from fastapi import FastAPI, Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.sql import func
import jwt
import os
import uuid
from typing import Optional
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale Payment Service", version="2.0.0")

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

# ── Persistence ──────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./payments.db")
_engine_kwargs = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    _engine_kwargs = {"connect_args": {"check_same_thread": False}}
    if ":memory:" in DATABASE_URL:
        _engine_kwargs["poolclass"] = StaticPool
engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    idempotency_key = Column(String, unique=True, index=True, nullable=True)
    order_id = Column(String, index=True, nullable=True)
    user_id = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    payment_method = Column(String, default="upi")
    status = Column(String, nullable=False)  # success | failed | refunded
    failure_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def _create_tables():
    Base.metadata.create_all(bind=engine)


# ── Sandbox gateway rules (stand-in for Stripe / Razorpay) ───────────────────
MAX_AMOUNT = float(os.getenv("PAYMENT_MAX_AMOUNT", "1000000"))
DECLINE_METHODS = {"card_declined", "insufficient_funds"}  # sandbox test methods


class PaymentRequest(BaseModel):
    amount: float = Field(gt=0)
    currency: str = "INR"
    payment_method: str = "upi"
    order_id: Optional[str] = None


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token required for payment processing")
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid payment auth token")


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    if not await rate_limiter.check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return add_security_headers(response)


def _view(p: Payment) -> dict:
    return {
        "status": p.status,
        "transaction_id": p.transaction_id,
        "order_id": p.order_id,
        "amount": p.amount,
        "currency": p.currency,
        "payment_method": p.payment_method,
        "failure_reason": p.failure_reason,
    }


@app.post("/payments/process")
def process_payment(
    req: PaymentRequest,
    current_user: dict = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
):
    """Charge once per Idempotency-Key. A retry returns the original result, never a second charge."""
    if idempotency_key:
        prior = db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()
        if prior:
            if prior.status == "failed":
                raise HTTPException(status_code=402, detail=prior.failure_reason or "Payment declined")
            return {**_view(prior), "idempotent_replay": True}

    failure = None
    if req.amount > MAX_AMOUNT:
        failure = f"Amount exceeds sandbox limit of {MAX_AMOUNT:.0f}"
    elif req.payment_method.lower() in DECLINE_METHODS:
        failure = f"Payment declined ({req.payment_method})"

    payment = Payment(
        transaction_id=f"txn-{uuid.uuid4().hex[:12]}",
        idempotency_key=idempotency_key,
        order_id=req.order_id,
        user_id=str(current_user.get("user_id", "anonymous")),
        amount=req.amount,
        currency=req.currency,
        payment_method=req.payment_method,
        status="failed" if failure else "success",
        failure_reason=failure,
    )
    db.add(payment)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request with the same key won the race: return its result.
        db.rollback()
        prior = db.query(Payment).filter(Payment.idempotency_key == idempotency_key).first()
        if prior and prior.status == "success":
            return {**_view(prior), "idempotent_replay": True}
        raise HTTPException(status_code=402, detail=(prior.failure_reason if prior else "Payment failed"))
    if failure:
        raise HTTPException(status_code=402, detail=failure)
    return _view(payment)


@app.post("/payments/{transaction_id}/refund")
def refund_payment(transaction_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.transaction_id == transaction_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if payment.status == "refunded":
        return {**_view(payment), "idempotent_replay": True}
    if payment.status != "success":
        raise HTTPException(status_code=409, detail=f"Cannot refund a {payment.status} payment")
    payment.status = "refunded"
    db.commit()
    return _view(payment)


@app.get("/payments/{transaction_id}")
def get_payment(transaction_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.transaction_id == transaction_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _view(payment)


@app.get("/health")
def health_check():
    return {"service": "payment-service", "status": "healthy"}
