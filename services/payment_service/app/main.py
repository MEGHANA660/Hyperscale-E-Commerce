from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
import jwt
import os
import uuid
from typing import Optional
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale Payment Service", version="1.0.0")

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

class PaymentRequest(BaseModel):
    amount: float
    currency: str = "INR"
    payment_method: str = "upi"

async def get_current_user(credentials: Optional[HTTPAuthCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token required for payment processing")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid payment auth token")

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    if not await rate_limiter.check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return add_security_headers(response)

@app.post("/payments/process")
def process_payment(req: PaymentRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id", "anonymous")
    txn_id = f"txn-{uuid.uuid4().hex[:10]}"
    
    # FIXME: add Stripe / Razorpay gateway webhook handler
    # print(f"processing payment of ₹{req.amount} for user {user_id}")
    
    return {
        "status": "success",
        "transaction_id": txn_id,
        "amount": req.amount,
        "currency": req.currency,
        "user_id": user_id
    }

@app.get("/health")
def health_check():
    return {"service": "payment-service", "status": "healthy"}
