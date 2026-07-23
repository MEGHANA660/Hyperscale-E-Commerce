from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
import os
import json
from typing import Optional
from sqlalchemy.orm import Session

from . import models
from . import database
from .database import engine, get_db, init_db
from shared.dsa.trie import Trie
from shared.core_logger.logger import CoreLogger
from shared.security import add_security_headers, RateLimiter, InputValidator

app = FastAPI(title="HyperScale Product Service")

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

# Initialize DSA: Trie (In-memory for lightning fast autocomplete)
product_trie = Trie()

# Initialize Core Logger
logger = CoreLogger("product-service")

# External Connections - with graceful fallback
redis_client = None
es = None

try:
    import redis
    redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=6379, db=0, socket_connect_timeout=2)
except Exception:
    pass

try:
    from elasticsearch import Elasticsearch
    es = Elasticsearch([os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")])
except Exception:
    pass

@app.on_event("startup")
async def startup_event():
    # Create tables with retry logic
    init_db()
    await logger.connect()
    # Warm up the Trie (DSA Innovation #2)
    try:
        db = next(get_db())
        all_products = db.query(models.Product).all()
        for p in all_products:
            product_trie.insert(p.name, p.id)
        await logger.info(f"Product Service started. Trie warmed with {len(all_products)} products.")
    except Exception as e:
        await logger.warning(f"Could not warm trie on startup: {e}")
        await logger.info("Product Service started (trie warm-up skipped).")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/products/autocomplete")
async def autocomplete(prefix: str):
    """
    Search suggestions using the Trie (DSA #2).
    Time Complexity: O(m) where m is prefix length.
    """
    if not prefix:
        return []
        
    suggestions = product_trie.search(prefix)
    return {"suggestions": suggestions, "prefix": prefix}

@app.get("/products/search")
async def advanced_search(q: str):
    """
    Advanced search using Elasticsearch for fuzzy matching and descriptions.
    """
    if es is None:
        return {"error": "Elasticsearch not available", "results": []}
    try:
        query = {
            "multi_match": {
                "query": q,
                "fields": ["name", "description", "category"]
            }
        }
        resp = es.search(index="products", query=query)
        results = [hit["_source"] for hit in resp["hits"]["hits"]]
        return results
    except Exception as e:
        await logger.error(f"ES Search failed: {e}")
        return []

@app.get("/products/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    # 1. Check Redis Cache
    if redis_client:
        try:
            cached = redis_client.get(f"product:{product_id}")
            if cached:
                await logger.info(f"Redis HIT for product {product_id}")
                return json.loads(cached)
        except Exception:
            pass

    # 2. DB Fallback
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_data = {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock": product.stock
    }

    # 3. Update Redis
    if redis_client:
        try:
            redis_client.setex(f"product:{product_id}", 3600, json.dumps(product_data))
        except Exception:
            pass
    
    return product_data

@app.post("/products")
async def create_product(name: str, price: float, description: str = "", db: Session = Depends(get_db)):
    product = models.Product(name=name, price=price, description=description)
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Update Trie
    product_trie.insert(name, product.id)
    
    # Sync to Elasticsearch
    if es:
        try:
            es.index(index="products", id=product.id, document={
                "id": product.id,
                "name": name,
                "description": description,
                "price": price
            })
        except Exception as e:
            await logger.error(f"Failed to sync to ES: {e}")

    return product
