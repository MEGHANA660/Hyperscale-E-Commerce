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

from . import models
from . import database
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
    await logger.connect()
    # Warm Min Heap with any pending orders in database
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

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "order-service"}

class OrderItem(BaseModel):
    product_id: int
    quantity: int = 1
    price: float = 0.0
    name: Optional[str] = None

class OrderCreate(BaseModel):
    user_id: int = 1
    product_id: Optional[int] = 1
    quantity: int = 1
    total_price: float = 0.0
    priority: int = 3  # 1: Express (2hr), 2: Priority (Next day), 3: Standard
    items: Optional[List[Dict[str, Any]]] = None
    idempotency_key: Optional[str] = None

@app.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    idempotency_key_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    """
    Accept an order, reserve stock, and enqueue into Min Heap priority queue.
    Supports Idempotency-Key header to prevent duplicate charges or duplicate orders.
    """
    idemp_key = payload.idempotency_key or idempotency_key_header
    
    # 1. Idempotency Check
    if idemp_key:
        existing_order = db.query(models.Order).filter(models.Order.idempotency_key == idemp_key).first()
        if existing_order:
            await logger.info(f"Idempotency HIT for key {idemp_key}. Returning existing order {existing_order.id}.")
            return {
                "message": "Order already processed (idempotent response)",
                "order_id": existing_order.id,
                "status": existing_order.status,
                "total_price": existing_order.total_price,
                "priority": existing_order.priority,
                "idempotency_hit": True
            }

    # 2. Concurrency-safe stock reservation in Product service
    # Reserve stock directly via DB atomic update or Product Service API
    primary_pid = payload.product_id or (payload.items[0]["product_id"] if payload.items else 1)
    primary_qty = payload.quantity if payload.quantity > 0 else 1
    
    # Atomic reservation in PostgreSQL products table
    # Wrapped in try/except for SQLite test-environment compatibility (no RETURNING clause)
    try:
        res = db.execute(
            text("UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty RETURNING stock"),
            {"qty": primary_qty, "id": primary_pid}
        ).fetchone()
        
        if not res:
            # Check available stock
            try:
                prod_row = db.execute(text("SELECT stock, name FROM products WHERE id = :id"), {"id": primary_pid}).fetchone()
            except Exception:
                prod_row = None
            available = prod_row[0] if prod_row else 0
            pname = prod_row[1] if prod_row else f"ID {primary_pid}"
            raise HTTPException(
                status_code=409, 
                detail=f"Insufficient stock for '{pname}'. Available: {available}, Requested: {primary_qty}"
            )
    except HTTPException:
        raise
    except Exception as e:
        # Products table may not exist in test environments — treat as no stock
        raise HTTPException(status_code=409, detail=f"Stock check failed: {str(e)[:100]}")

    # 3. Create persistent Order
    new_order = models.Order(
        user_id=payload.user_id,
        product_id=primary_pid,
        quantity=primary_qty,
        total_price=payload.total_price,
        priority=payload.priority,
        status="paid",  # Sandbox payment auto-confirmed on placement
        items=payload.items,
        idempotency_key=idemp_key
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 4. Enqueue into Min Heap Priority Queue (DSA #3)
    order_info = {
        "id": new_order.id,
        "user_id": new_order.user_id,
        "product_id": primary_pid,
        "quantity": primary_qty,
        "total_price": new_order.total_price,
        "priority": payload.priority,
        "status": new_order.status,
        "type": "Express" if payload.priority == 1 else ("Priority" if payload.priority == 2 else "Standard")
    }
    order_queue.push(payload.priority, order_info)
    heap_stats["total_enqueued"] += 1

    await logger.info(f"Order {new_order.id} placed and pushed to Min Heap priority queue (Priority: {payload.priority}).")

    return {
        "message": "Order successfully created and queued in Min Heap",
        "order_id": new_order.id,
        "status": new_order.status,
        "priority": new_order.priority,
        "total_price": new_order.total_price,
        "queue_size": order_queue.size(),
        "dsa": "Min Heap Priority Queue",
        "complexity": "O(log n)"
    }

# ─── Static/specific routes BEFORE dynamic {order_id} to avoid path conflicts ──

@app.get("/orders/queue")
def get_queue_status():
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
async def process_next_order(db: Session = Depends(get_db)):
    """
    Process highest priority order from Min Heap (DSA #3 pop).
    Express orders (priority 1) are popped before Standard (priority 3).
    """
    if order_queue.is_empty():
        return {"message": "Queue is empty. No orders to process.", "processed": None}
    
    priority, order_data = order_queue.pop()
    heap_stats["total_processed"] += 1
    
    # Update status to delivered in database
    db.execute(
        text("UPDATE orders SET status = 'delivered' WHERE id = :id"),
        {"id": order_data["id"]}
    )
    db.commit()
    
    await logger.info(f"Min Heap processed order {order_data['id']} (Priority: {priority}).")
    return {
        "message": f"Processed highest priority order {order_data['id']}",
        "processed_order": order_data,
        "priority_level": priority,
        "remaining_queue_size": order_queue.size(),
        "dsa": "Min Heap Pop",
        "complexity": "O(log n)"
    }

@app.get("/orders/user/{user_id}")
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    """
    Get order history for a specific customer (for 'My Orders' flow).
    IMPORTANT: must be defined BEFORE /orders/{order_id} to avoid route conflict.
    """
    orders = db.query(models.Order).filter(models.Order.user_id == user_id).order_by(models.Order.id.desc()).all()
    results = []
    for o in orders:
        # Join product name if available
        p_row = db.execute(text("SELECT name, image_url, price FROM products WHERE id = :id"), {"id": o.product_id}).fetchone()
        results.append({
            "id": o.id,
            "product_id": o.product_id,
            "product_name": p_row[0] if p_row else f"Product #{o.product_id}",
            "image_url": p_row[1] if p_row else None,
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
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get single order details."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
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
