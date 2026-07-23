from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
import os
import json
import asyncio
import logging
from typing import Optional
from sqlalchemy.orm import Session

from . import models
from . import database
from .database import engine, get_db, init_db
from shared.dsa.min_heap import MinHeap
from shared.core_logger.logger import CoreLogger
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale Order Service")

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

async def verify_jwt_token(credentials: Optional[HTTPAuthCredentials] = Depends(security)) -> Optional[dict]:
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

# Initialize DSA: Min Heap (Priority Queue)
order_queue = MinHeap()

# Initialize Core Logger
logger = CoreLogger("order-service")

# Kafka Producer (optional)
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_SERVERS", "localhost:9092")
_kafka_available = False
producer = None

try:
    from aiokafka import AIOKafkaProducer
    _kafka_available = True
except ImportError:
    logging.getLogger("order-service").warning("aiokafka not installed, Kafka producer disabled")

@app.on_event("startup")
async def startup_event():
    global producer
    # Create tables with retry logic
    init_db()
    await logger.connect()
    
    if _kafka_available:
        try:
            producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
            await producer.start()
            await logger.info("Order Service started. Producer connected to Kafka.")
        except Exception as e:
            await logger.warning(f"Could not connect to Kafka producer: {e}")
            producer = None
    else:
        await logger.info("Order Service started (Kafka disabled).")
    
    # Start the priority worker in the background
    asyncio.create_task(priority_order_worker())

@app.on_event("shutdown")
async def shutdown_event():
    if producer:
        await producer.stop()

async def priority_order_worker():
    """
    Background worker that processes orders from the Min Heap (DSA #3).
    """
    await asyncio.sleep(5)
    while True:
        if not order_queue.is_empty():
            priority, order_data = order_queue.pop()
            await logger.info(f"Worker picked up order: {order_data['id']} (Priority: {priority})")
            
            if producer:
                try:
                    message = json.dumps(order_data).encode("utf-8")
                    await producer.send_and_wait("ORDER_CREATED", message)
                    await logger.info(f"Order {order_data['id']} event emitted to Kafka.")
                except Exception as e:
                    await logger.error(f"Failed to emit Kafka event: {e}")
            
            await asyncio.sleep(1)
        else:
            await asyncio.sleep(2)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/orders", status_code=201)
async def create_order(user_id: int, product_id: int, quantity: int, priority: int = 3, db: Session = Depends(get_db)):
    """
    Accept an order and add it to the Min Heap priority queue.
    """
    new_order = models.Order(
        user_id=user_id, 
        product_id=product_id, 
        quantity=quantity, 
        priority=priority,
        total_price=0.0
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    order_info = {
        "id": new_order.id,
        "user_id": user_id,
        "product_id": product_id,
        "quantity": quantity,
        "priority": priority
    }
    order_queue.push(priority, order_info)
    
    await logger.info(f"Order {new_order.id} received and queued with priority {priority}.")
    return {"message": "Order received and queued", "order_id": new_order.id, "queue_size": order_queue.size()}

@app.get("/orders/queue")
def get_queue_status():
    return {"size": order_queue.size(), "next_order": order_queue.peek()}
