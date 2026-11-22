from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from shared.dsa.bloom_filter import BloomFilter
from shared.core_logger.logger import CoreLogger
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale Inventory Service")

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

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
                return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
    response = await call_next(request)
    return add_security_headers(response)

# Initialize DSA: Bloom Filter (Probabilistic existence check)
inventory_filter = BloomFilter(expected_elements=10000, false_positive_rate=0.01)

# Initialize Core Logger
logger = CoreLogger("inventory-service")


@app.on_event("startup")
async def startup_event():
    # Create tables with retry logic
    init_db()
    await logger.connect()
    
    # Warm up Bloom Filter (DSA Innovation #5)
    try:
        db = next(database.get_db())
        items = db.query(models.Inventory).all()
        for item in items:
            inventory_filter.add(item.product_id)
        await logger.info(f"Inventory Service started. Bloom Filter warmed with {len(items)} product IDs.")
    except Exception as e:
        await logger.warning(f"Could not warm Bloom Filter: {e}")
        await logger.info("Inventory Service started (Bloom Filter warm-up skipped).")
    
    



@app.post("/inventory", status_code=201)
async def add_inventory(product_id: int, stock_level: int, db: Session = Depends(get_db)):
    inv_item = models.Inventory(product_id=product_id, stock_level=stock_level)
    db.add(inv_item)
    db.commit()
    db.refresh(inv_item)
    
    inventory_filter.add(product_id)
    
    await logger.info(f"Inventory added for product {product_id}")
    return {"message": "Inventory added", "product_id": product_id}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
