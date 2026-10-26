from fastapi import FastAPI, Depends, HTTPException, status, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import os
import json
import asyncio
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone

from . import models
from . import database
from . import clients
import uuid
from starlette.concurrency import run_in_threadpool
from .database import engine, get_db, init_db
from shared.dsa.min_heap import MinHeap
from shared.core_logger.logger import CoreLogger
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale Order Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=200, window_seconds=60)

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8000")

async def verify_jwt_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

class CurrentUser(BaseModel):
    user_id: int
    role: str = "customer"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


async def require_user(claims: Optional[dict] = Depends(verify_jwt_token)) -> CurrentUser:
    """The caller's identity comes ONLY from a valid token, never from the request body."""
    if not claims:
        raise HTTPException(status_code=401, detail="Login required",
                            headers={"WWW-Authenticate": "Bearer"})
    try:
        return CurrentUser(user_id=int(claims.get("user_id")), role=str(claims.get("role", "customer")))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token does not carry a valid user id")


async def require_admin(user: CurrentUser = Depends(require_user)) -> CurrentUser:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _owned_order_or_404(db: Session, order_id: int, user: CurrentUser) -> models.Order:
    """Other people's orders look exactly like orders that don't exist."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order or not (user.is_admin or order.user_id == user.user_id):
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    if not await rate_limiter.check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return add_security_headers(response)

# Initialize DSA: Min Heap (Priority Queue, O(log n))
order_queue = MinHeap()
heap_stats = {"total_enqueued": 0, "total_processed": 0}

# Initialize Core Logger
logger = CoreLogger("order-service")

@app.on_event("startup")
async def startup_event():
    init_db()
    database.ensure_columns()
    await logger.connect()
    if os.getenv("DISABLE_EXPIRY_LOOP") != "1":
        asyncio.create_task(_expiry_loop())
    db = None
    try:
        db = next(get_db())
        pending_orders = db.query(models.Order).filter(models.Order.status == "pending").all()
        for o in pending_orders:
            order_info = {
                "id": o.id,
                "user_id": o.user_id,
                "product_id": o.product_id,
                "quantity": o.quantity,
                "total_price": o.total_price,
                "priority": o.priority or 3,
                "status": o.status
            }
            order_queue.push(o.priority or 3, order_info)
            heap_stats["total_enqueued"] += 1
        await logger.info(f"Order Service started. Min Heap initialized with {order_queue.size()} pending orders.")
    except Exception as e:
        await logger.warning(f"Could not warm Min Heap on startup: {e}")
    finally:
        if db:
            db.close()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "order-service"}

class OrderItem(BaseModel):
    product_id: int
    quantity: int = 1
    price: float = 0.0
    name: Optional[str] = None

class OrderCreate(BaseModel):
    user_id: Optional[int] = None  # ignored: the order always belongs to the token's user
    product_id: Optional[int] = 1
    quantity: int = 1
    total_price: float = 0.0
    priority: int = 3  # 1: Express (2hr), 2: Priority (Next day), 3: Standard
    payment_method: str = "upi"
    items: Optional[List[Dict[str, Any]]] = None
    idempotency_key: Optional[str] = None

ORDER_EXPIRY_MINUTES = int(os.getenv("ORDER_EXPIRY_MINUTES", "15"))
EXPIRY_SWEEP_SECONDS = int(os.getenv("EXPIRY_SWEEP_SECONDS", "60"))
# Order states: pending -> reserved -> paid -> delivered
#               failed | payment_failed | expired | cancelled | refunded
HOLDING_STATES = ("pending", "reserved")                       # in flight; stuck ones expire
RELEASED_STATES = ("failed", "payment_failed", "expired", "cancelled", "refunded")


def _parse_lines(payload: "OrderCreate") -> Dict[int, int]:
    """Merge the cart into {product_id: quantity}, rejecting bad input."""
    lines: Dict[int, int] = {}
    for it in (payload.items or []):
        try:
            pid, qty = int(it["product_id"]), int(it.get("quantity", 1))
        except (KeyError, TypeError, ValueError):
            raise HTTPException(status_code=422, detail="Each item needs a numeric product_id and quantity")
        if qty < 1:
            raise HTTPException(status_code=422, detail=f"Invalid quantity for product {pid}")
        lines[pid] = lines.get(pid, 0) + qty
    if not lines:  # legacy single-product payload
        lines[payload.product_id or 1] = payload.quantity if payload.quantity > 0 else 1
    return lines


def _release_held(db: Session, order: models.Order) -> bool:
    """Give back all stock this order still holds. Progress is saved after every line,
    so a retry after a partial failure never releases the same line twice."""
    lines = list(order.reserved_lines or [])
    while lines:
        line = lines[0]
        try:
            clients.release_stock(line["product_id"], line["quantity"], str(order.id))
        except clients.ServiceError:
            return False
        lines = lines[1:]
        order.reserved_lines = lines
        db.commit()
    return True


def _set_status(db: Session, order: models.Order, new_status: str, reason: Optional[str] = None):
    order.status = new_status
    if reason:
        order.failure_reason = reason[:250]
    db.commit()


def _existing_order_response(existing: models.Order) -> dict:
    if existing.status == "payment_failed":
        raise HTTPException(status_code=402, detail=existing.failure_reason or "Payment failed")
    if existing.status in ("failed", "expired"):
        raise HTTPException(status_code=409, detail=existing.failure_reason or "Order failed")
    return {
        "message": "Order already processed (idempotent response)",
        "order_id": existing.id,
        "status": existing.status,
        "total_price": existing.total_price,
        "priority": existing.priority,
        "payment_transaction_id": existing.payment_txn_id,
        "idempotency_hit": True,
    }


def _charge_with_one_retry(order_id: int, amount: float, method: str, key: str) -> dict:
    """A decline (402) is final. An unreachable/timed-out payment service is retried once
    with the SAME idempotency key, which cannot double-charge."""
    try:
        return clients.charge(str(order_id), amount, method, key)
    except clients.ServiceError as e:
        if e.status_code < 500 and e.status_code != 408:  # 402 decline, 4xx: final
            raise
        return clients.charge(str(order_id), amount, method, key)


@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    user: CurrentUser = Depends(require_user),
    db: Session = Depends(get_db)
):
    """
    Saga: save order (pending) -> reserve stock for every item (reserved) -> charge (paid).
    Every failure gives back what was taken: stock is released, and a payment that was taken
    but could not be recorded is refunded. Orders that get stuck are expired by a sweep.
    """
    idemp_key = payload.idempotency_key or idempotency_key_header

    if idemp_key:
        existing = db.query(models.Order).filter(models.Order.idempotency_key == idemp_key).first()
        if existing:
            if existing.user_id != user.user_id:
                raise HTTPException(status_code=409, detail="Idempotency key already used")
            await logger.info(f"Idempotency HIT for key {idemp_key}. Returning existing order {existing.id}.")
            return _existing_order_response(existing)

    lines = _parse_lines(payload)
    primary_pid, primary_qty = next(iter(lines.items()))

    # 1. Persist first, so every outcome (and every crash) leaves a record to clean up.
    order = models.Order(
        user_id=user.user_id, product_id=primary_pid, quantity=primary_qty,
        total_price=payload.total_price, priority=payload.priority, status="pending",
        items=payload.items, reserved_lines=[], idempotency_key=idemp_key,
    )
    db.add(order)
    try:
        db.commit()
    except IntegrityError:
        # A concurrent request with the same idempotency key won the race.
        db.rollback()
        existing = db.query(models.Order).filter(models.Order.idempotency_key == idemp_key).first()
        if existing and existing.user_id == user.user_id:
            return _existing_order_response(existing)
        if existing:
            raise HTTPException(status_code=409, detail="Idempotency key already used")
        raise
    db.refresh(order)

    # 2. Reserve stock for EVERY item via the Product service (idempotent per order).
    try:
        for pid, qty in lines.items():
            # Write the intent BEFORE calling the Product service. If the call times out or we
            # crash, the line is still on record, and releasing it later is safe because the
            # Product service ignores a release for stock it never reserved.
            order.reserved_lines = (order.reserved_lines or []) + [{"product_id": pid, "quantity": qty}]
            db.commit()
            await run_in_threadpool(clients.reserve_stock, pid, qty, str(order.id))
    except clients.ServiceError as e:
        if not await run_in_threadpool(_release_held, db, order):
            await logger.error(f"Order {order.id}: stock release incomplete; the expiry sweep will retry.")
        _set_status(db, order, "failed", e.detail)
        raise HTTPException(status_code=e.status_code if e.status_code in (404, 409) else 503, detail=e.detail)
    _set_status(db, order, "reserved")

    # 3. Take payment.
    pay_key = idemp_key or f"order-{order.id}"
    try:
        payment = await run_in_threadpool(
            _charge_with_one_retry, order.id, payload.total_price, payload.payment_method, pay_key
        )
    except clients.ServiceError as e:
        if not await run_in_threadpool(_release_held, db, order):
            await logger.error(f"Order {order.id}: stock release incomplete; the expiry sweep will retry.")
        _set_status(db, order, "payment_failed", e.detail)
        await logger.warning(f"Payment failed for order {order.id}: {e.detail}")
        raise HTTPException(status_code=402 if e.status_code == 402 else 503, detail=e.detail)

    # 4. Mark paid. If we cannot record it, undo the charge and the reservation.
    try:
        order.status = "paid"
        order.payment_txn_id = payment.get("transaction_id")
        db.commit()
    except Exception as exc:
        db.rollback()
        txn = payment.get("transaction_id")
        try:
            await run_in_threadpool(clients.refund, txn)
        except clients.ServiceError as e:
            await logger.error(f"Order {order.id}: charged {txn} but could not record or refund it: {e.detail}")
        try:
            db.refresh(order)
            await run_in_threadpool(_release_held, db, order)
            _set_status(db, order, "failed", f"Could not record payment: {exc.__class__.__name__}")
        except Exception:
            db.rollback()
        raise HTTPException(status_code=500, detail="Order could not be completed; payment was refunded")
    db.refresh(order)

    order_queue.push(order.priority, {
        "id": order.id, "user_id": order.user_id, "product_id": primary_pid, "quantity": primary_qty,
        "total_price": order.total_price, "priority": order.priority, "status": order.status,
        "type": "Express" if order.priority == 1 else ("Priority" if order.priority == 2 else "Standard"),
    })
    heap_stats["total_enqueued"] += 1
    await logger.info(f"Order {order.id} paid ({order.payment_txn_id}) and queued (priority {order.priority}).")

    return {
        "message": "Order successfully created, paid and queued in Min Heap",
        "order_id": order.id,
        "status": order.status,
        "priority": order.priority,
        "total_price": order.total_price,
        "payment_status": payment.get("status"),
        "payment_transaction_id": order.payment_txn_id,
        "queue_size": order_queue.size(),
        "dsa": "Min Heap Priority Queue",
        "complexity": "O(log n)"
    }


def _remove_from_queue(order_id: int):
    kept = [(p, d) for p, d in order_queue.heap if d.get("id") != order_id]
    order_queue.heap = []
    for p, d in kept:
        order_queue.push(p, d)


@app.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: int, user: CurrentUser = Depends(require_user), db: Session = Depends(get_db)):
    """Cancel a paid order that has not been delivered: refund the payment, return the stock."""
    order = _owned_order_or_404(db, order_id, user)
    if order.status in ("cancelled", "refunded"):
        return {"order_id": order.id, "status": order.status, "message": "Already cancelled"}
    if order.status != "paid":
        raise HTTPException(status_code=409, detail=f"Order in status '{order.status}' cannot be cancelled")

    if order.payment_txn_id:
        try:
            await run_in_threadpool(clients.refund, order.payment_txn_id)
        except clients.ServiceError as e:
            raise HTTPException(status_code=502, detail=f"Refund failed, order not cancelled: {e.detail}")
    _remove_from_queue(order.id)
    _set_status(db, order, "refunded" if order.payment_txn_id else "cancelled")
    if not await run_in_threadpool(_release_held, db, order):
        await logger.error(f"Order {order.id}: refunded but stock release incomplete; sweep will retry.")
    return {"order_id": order.id, "status": order.status, "stock_returned": not order.reserved_lines}


def expire_stale_orders(db: Session, now: Optional[datetime] = None) -> Dict[str, List[int]]:
    """Clean up after crashes and failed releases.
    - pending/reserved orders older than ORDER_EXPIRY_MINUTES: release stock, mark `expired`
    - failed/cancelled/refunded orders that still hold stock (a release failed earlier): retry the release
    """
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=ORDER_EXPIRY_MINUTES)
    expired, released = [], []

    for o in db.query(models.Order).filter(models.Order.status.in_(HOLDING_STATES)).all():
        created = o.created_at
        if created is None:
            continue
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created > cutoff:
            continue
        if _release_held(db, o):
            _set_status(db, o, "expired", "Expired before payment completed")
            expired.append(o.id)

    for o in db.query(models.Order).filter(models.Order.status.in_(RELEASED_STATES)).all():
        if o.reserved_lines and _release_held(db, o):
            released.append(o.id)
    return {"expired": expired, "stock_released": released}


@app.post("/orders/expire")
async def expire_orders_now(_: CurrentUser = Depends(require_admin), db: Session = Depends(get_db)):
    return await run_in_threadpool(expire_stale_orders, db)


async def _expiry_loop():
    while True:
        await asyncio.sleep(EXPIRY_SWEEP_SECONDS)
        db = None
        try:
            db = database.SessionLocal()
            result = await run_in_threadpool(expire_stale_orders, db)
            if result["expired"] or result["stock_released"]:
                await logger.info(f"Expiry sweep: {result}")
        except Exception as e:
            await logger.warning(f"Expiry sweep failed: {e}")
        finally:
            if db:
                db.close()

# ─── Static/specific routes BEFORE dynamic {order_id} to avoid path conflicts ──

@app.get("/orders/queue")
def get_queue_status(_: CurrentUser = Depends(require_admin)):
    """Get current Min Heap priority queue status."""
    return {
        "dsa": "Min Heap",
        "queue_size": order_queue.size(),
        "next_order": order_queue.peek(),
        "total_enqueued": heap_stats["total_enqueued"],
        "total_processed": heap_stats["total_processed"],
        "complexity": "O(log n)"
    }

@app.post("/orders/queue/process")
async def process_next_order(_: CurrentUser = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Process highest priority order from Min Heap (DSA #3 pop).
    Express orders (priority 1) are popped before Standard (priority 3).
    Orders that were cancelled/refunded since being queued are skipped.
    """
    while not order_queue.is_empty():
        priority, order_data = order_queue.pop()
        order = db.query(models.Order).filter(models.Order.id == order_data["id"]).first()
        if not order or order.status != "paid":
            continue
        heap_stats["total_processed"] += 1
        order.status = "delivered"
        db.commit()
        await logger.info(f"Min Heap processed order {order.id} (Priority: {priority}).")
        return {
            "message": f"Processed highest priority order {order.id}",
            "processed_order": order_data,
            "priority_level": priority,
            "remaining_queue_size": order_queue.size(),
            "dsa": "Min Heap Pop",
            "complexity": "O(log n)"
        }
    return {"message": "Queue is empty. No orders to process.", "processed": None}

@app.get("/orders/user/{user_id}")
def get_user_orders(user_id: int, user: CurrentUser = Depends(require_user), db: Session = Depends(get_db)):
    """
    Get order history for a specific customer (for 'My Orders' flow).
    IMPORTANT: must be defined BEFORE /orders/{order_id} to avoid route conflict.
    """
    if not (user.is_admin or user.user_id == user_id):
        raise HTTPException(status_code=403, detail="You can only view your own orders")
    orders = db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.id.desc()).all()
    results = []
    for o in orders:
        items = o.items or []
        first = items[0] if items else {}
        results.append({
            "id": o.id,
            "product_id": o.product_id,
            "product_name": first.get("name") or f"Product #{o.product_id}",
            "items": items,
            "quantity": o.quantity,
            "total_price": o.total_price,
            "priority": o.priority,
            "priority_label": "Express (2hr)" if o.priority == 1 else ("Priority (Next day)" if o.priority == 2 else "Standard"),
            "status": o.status,
            "created_at": str(o.created_at) if o.created_at else None
        })
    return {"user_id": user_id, "orders": results, "count": len(results)}

@app.get("/heap/stats")
def get_heap_stats():
    """Real Min Heap metrics for Performance Dashboard."""
    return {
        "dsa": "Min Heap",
        "service": "order-service",
        "queue_size": order_queue.size(),
        "total_enqueued": heap_stats["total_enqueued"],
        "total_processed": heap_stats["total_processed"],
        "peek_priority": order_queue.peek()[0] if order_queue.peek() else None,
        "complexity": "O(log n) push and pop",
        "description": "Binary min heap priority queue ensuring urgent orders (Express priority 1) are fulfilled before standard orders."
    }

# NOTE: Dynamic route LAST — must come after all static /orders/* routes
@app.get("/orders/{order_id}")
def get_order(order_id: int, user: CurrentUser = Depends(require_user), db: Session = Depends(get_db)):
    """Get single order details (own orders only; admins can read any)."""
    order = _owned_order_or_404(db, order_id, user)
    return {
        "id": order.id,
        "user_id": order.user_id,
        "product_id": order.product_id,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "priority": order.priority,
        "status": order.status,
        "items": order.items,
        "created_at": str(order.created_at) if order.created_at else None
    }