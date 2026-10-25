from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import os
import json
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text

from . import models
from . import database
from .database import engine, get_db, init_db
from shared.dsa.trie import Trie
from shared.dsa.bloom_filter import BloomFilter
from shared.core_logger.logger import CoreLogger
from shared.security import add_security_headers, RateLimiter, InputValidator

app = FastAPI(title="HyperScale Product Service", version="1.0.0")

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

# Initialize DSA Implementations
# 1. Trie: Autocomplete search (O(m) prefix lookup)
product_trie = Trie()
# 2. Bloom Filter: Fast existence check guarding database queries
product_bloom = BloomFilter(expected_elements=10000, false_positive_rate=0.01)

# Real runtime statistics counters
bloom_stats = {"total_queries": 0, "blocked_queries": 0, "allowed_queries": 0}
trie_stats = {"total_lookups": 0, "words_indexed": 0}

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

def warm_dsas(db: Session):
    """Warm Trie and Bloom Filter with all products from the database."""
    global trie_stats
    all_products = db.query(models.Product).all()
    words_count = 0
    for p in all_products:
        product_bloom.add(p.id)
        # Index product name words into Trie
        for word in p.name.split():
            product_trie.insert(word, p.id)
            words_count += 1
        if p.category:
            product_trie.insert(p.category, p.id)
            words_count += 1
    trie_stats["words_indexed"] = words_count
    return len(all_products)

@app.on_event("startup")
async def startup_event():
    init_db()
    await logger.connect()
    db = None
    try:
        db = next(get_db())
        count = warm_dsas(db)
        await logger.info(f"Product Service started. Warmed Trie & Bloom Filter with {count} products.")
    except Exception as e:
        await logger.warning(f"Could not warm DSAs on startup: {e}")
    finally:
        if db:
            db.close()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "product-service"}

@app.get("/products")
def list_products(
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all products with pagination and category filtering.
    """
    query = db.query(models.Product)
    if category and category.lower() != "all":
        query = query.filter(models.Product.category.ilike(category))
    
    total = query.count()
    offset = max(0, (page - 1) * limit)
    items = query.order_by(models.Product.id.asc()).offset(offset).limit(limit).all()
    
    products_data = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "stock": p.stock,
            "category": p.category,
            "image_url": p.image_url,
            "rating": p.rating or 4.5
        }
        for p in items
    ]
    return {"products": products_data, "total": total, "page": page, "limit": limit}

@app.get("/products/autocomplete")
def autocomplete(prefix: str, db: Session = Depends(get_db)):
    """
    Search suggestions using the Trie (DSA #2).
    Time Complexity: O(m) where m is prefix length.
    """
    if not prefix:
        return {"suggestions": [], "prefix": prefix}
        
    trie_stats["total_lookups"] += 1
    matched_ids = product_trie.search(prefix)
    
    suggestions = []
    if matched_ids:
        items = db.query(models.Product).filter(models.Product.id.in_(matched_ids)).all()
        suggestions = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "price": p.price,
                "image_url": p.image_url
            }
            for p in items
        ]
    return {
        "suggestions": suggestions,
        "matched_ids": matched_ids,
        "prefix": prefix,
        "dsa": "Trie",
        "complexity": "O(m)"
    }

@app.get("/products/search")
@app.get("/search")
def search_products(q: str = "", category: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Search products using Trie-assisted database search or Elasticsearch.
    """
    if not q:
        return []

    # 1. Elasticsearch if available
    if es:
        try:
            query = {
                "multi_match": {
                    "query": q,
                    "fields": ["name", "description", "category"],
                    "fuzziness": "AUTO"
                }
            }
            resp = es.search(index="products", query=query)
            results = [hit["_source"] for hit in resp["hits"]["hits"]]
            if results:
                return results
        except Exception:
            pass

    # 2. Database search
    db_query = db.query(models.Product).filter(
        (models.Product.name.ilike(f"%{q}%")) |
        (models.Product.description.ilike(f"%{q}%")) |
        (models.Product.category.ilike(f"%{q}%"))
    )
    if category and category.lower() != "all":
        db_query = db_query.filter(models.Product.category.ilike(category))
    
    products = db_query.limit(40).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "stock": p.stock,
            "category": p.category,
            "image_url": p.image_url,
            "rating": p.rating or 4.5
        }
        for p in products
    ]

@app.get("/exists/{product_id}")
def check_exists(product_id: int):
    """
    Bloom Filter existence check endpoint.
    Guards against database queries for invalid product IDs.
    """
    bloom_stats["total_queries"] += 1
    exists = product_bloom.exists(product_id)
    if not exists:
        bloom_stats["blocked_queries"] += 1
    else:
        bloom_stats["allowed_queries"] += 1
    return {
        "product_id": product_id,
        "might_exist": exists,
        "dsa": "Bloom Filter",
        "complexity": "O(k)"
    }

@app.get("/products/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Get product details by ID.
    Step 1: Check Bloom Filter existence guard (DSA #3).
    Step 2: Check Redis Cache.
    Step 3: Fallback to PostgreSQL.
    """
    bloom_stats["total_queries"] += 1
    
    # 1. Bloom Filter Check
    if not product_bloom.exists(product_id):
        bloom_stats["blocked_queries"] += 1
        raise HTTPException(
            status_code=404, 
            detail=f"Product {product_id} does not exist (Blocked by Bloom Filter pre-check: 0 DB queries needed)"
        )
    bloom_stats["allowed_queries"] += 1

    # 2. Check Redis Cache
    if redis_client:
        try:
            cached = redis_client.get(f"product:{product_id}")
            if cached:
                await logger.info(f"Redis HIT for product {product_id}")
                return json.loads(cached)
        except Exception:
            pass

    # 3. DB Fallback
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_data = {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock": product.stock,
        "category": product.category,
        "image_url": product.image_url,
        "rating": product.rating or 4.5
    }

    # 4. Update Redis
    if redis_client:
        try:
            redis_client.setex(f"product:{product_id}", 3600, json.dumps(product_data))
        except Exception:
            pass
    
    return product_data

class ProductCreate(BaseModel):
    name: str
    price: float
    description: str = ""
    category: str = "Electronics"
    stock: int = 50
    image_url: Optional[str] = None
    rating: float = 4.5

@app.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product and update Trie and Bloom Filter."""
    product = models.Product(
        name=payload.name,
        price=payload.price,
        description=payload.description,
        category=payload.category,
        stock=payload.stock,
        image_url=payload.image_url,
        rating=payload.rating
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Update Bloom Filter & Trie
    product_bloom.add(product.id)
    for word in product.name.split():
        product_trie.insert(word, product.id)
    if product.category:
        product_trie.insert(product.category, product.id)
    
    # Sync to Elasticsearch
    if es:
        try:
            es.index(index="products", id=product.id, document={
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "category": product.category
            })
        except Exception as e:
            await logger.error(f"Failed to sync to ES: {e}")

    return product

# ─── Inventory Atomic Stock Operations (Phase 2 & End-to-End) ───────────────────
class StockRequest(BaseModel):
    quantity: int = 1
    # When given, the call is idempotent per (order_ref, product): a retried reserve
    # never takes stock twice and a retried release never returns it twice.
    order_ref: Optional[str] = None


def _invalidate_cache(product_id: int):
    if redis_client:
        try:
            redis_client.delete(f"product:{product_id}")
        except Exception:
            pass


@app.post("/products/{product_id}/reserve")
def reserve_stock(product_id: int, req: StockRequest, db: Session = Depends(get_db)):
    """
    Atomic Stock Reservation using conditional SQL:
    UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty RETURNING stock;
    Guarantees no race conditions or overselling under high parallel concurrency.
    """
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    if req.order_ref:
        prior = db.query(models.StockReservation).filter_by(order_ref=req.order_ref, product_id=product_id).first()
        if prior:
            if prior.state == "released":
                raise HTTPException(status_code=409, detail="Reservation was already released for this order")
            return {"status": "reserved", "product_id": product_id, "quantity_reserved": prior.quantity,
                    "idempotent_replay": True}

    result = db.execute(
        text("UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty RETURNING stock"),
        {"qty": req.quantity, "id": product_id}
    ).fetchone()

    if not result:
        db.rollback()
        prod = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Product not found")
        raise HTTPException(
            status_code=409,
            detail=f"Insufficient stock for product '{prod.name}'. Available: {prod.stock}, Requested: {req.quantity}"
        )

    if req.order_ref:
        # Same transaction as the decrement: both happen or neither does.
        db.add(models.StockReservation(order_ref=req.order_ref, product_id=product_id,
                                       quantity=req.quantity, state="reserved"))
    db.commit()
    _invalidate_cache(product_id)
    return {
        "status": "reserved",
        "product_id": product_id,
        "quantity_reserved": req.quantity,
        "remaining_stock": result[0]
    }


@app.post("/products/{product_id}/release")
def release_stock(product_id: int, req: StockRequest, db: Session = Depends(get_db)):
    """Release reserved stock back to inventory upon payment cancellation or timeout."""
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    qty = req.quantity
    if req.order_ref:
        prior = db.query(models.StockReservation).filter_by(order_ref=req.order_ref, product_id=product_id).first()
        if not prior:
            # The reserve never reached us (e.g. it timed out first). Nothing to give back.
            # Recording the tombstone stops a late-arriving reserve from taking stock afterwards.
            db.add(models.StockReservation(order_ref=req.order_ref, product_id=product_id,
                                           quantity=0, state="released"))
            db.commit()
            return {"status": "nothing_to_release", "product_id": product_id, "quantity_released": 0}
        if prior.state == "released":
            return {"status": "released", "product_id": product_id, "quantity_released": 0,
                    "idempotent_replay": True}
        qty = prior.quantity  # always give back exactly what was taken

    result = db.execute(
        text("UPDATE products SET stock = stock + :qty WHERE id = :id RETURNING stock"),
        {"qty": qty, "id": product_id}
    ).fetchone()

    if not result:
        db.rollback()
        raise HTTPException(status_code=404, detail="Product not found")

    if req.order_ref:
        prior.state = "released"
    db.commit()
    _invalidate_cache(product_id)
    return {
        "status": "released",
        "product_id": product_id,
        "quantity_released": qty,
        "current_stock": result[0]
    }


@app.get("/bloom/stats")
def get_bloom_stats(db: Session = Depends(get_db)):
    """Bloom Filter performance metrics."""
    total = bloom_stats["total_queries"]
    blocked = bloom_stats["blocked_queries"]
    allowed = bloom_stats["allowed_queries"]
    reduction = round((blocked / max(1, total)) * 100, 1)
    items_count = db.query(models.Product).count()
    return {
        "dsa": "Bloom Filter",
        "service": "product-service",
        "total_queries": total,
        "blocked_queries": blocked,
        "allowed_queries": allowed,
        "reduction_pct": reduction,
        "items_in_filter": items_count,
        "false_positive_rate": 0.01,
        "description": "Pre-check before DB for product existence. Rejects non-existent IDs with 0% false negatives.",
        "complexity": "O(k)"
    }

@app.get("/trie/stats")
def get_trie_stats(db: Session = Depends(get_db)):
    """Trie autocomplete performance metrics."""
    items_count = db.query(models.Product).count()
    return {
        "dsa": "Trie",
        "service": "product-service",
        "total_lookups": trie_stats["total_lookups"],
        "words_indexed": trie_stats["words_indexed"],
        "items_indexed": items_count,
        "time_complexity": "O(m) where m is prefix length",
        "description": "In-memory prefix tree for sub-millisecond autocomplete suggestions."
    }