from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import os
from typing import Optional
from sqlalchemy.orm import Session

from . import models
from .database import engine, get_db, init_db
from shared.dsa.lru_cache import LRUCache
from shared.core_logger.logger import CoreLogger
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale User Service", version="1.0.0")

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
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    if not await rate_limiter.check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return add_security_headers(response)

# Initialize DSA: LRU Cache (Capacity 1000 users, O(1) get/put)
user_cache = LRUCache(1000)
cache_stats = {"hits": 0, "misses": 0}

# Initialize Core Logger
logger = CoreLogger("user-service")

@app.on_event("startup")
async def startup_event():
    init_db()
    await logger.connect()
    await logger.info("User Service started with LRU Cache capacity 1000.")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "user-service"}

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/users/login")
@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user, return JWT token, and warm LRU cache."""
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or user.hashed_password != req.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    token_payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role
    }
    token = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    # Put into LRU cache
    user_cache.put(user.id, user_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

@app.get("/users/me")
async def get_me(current_user: Optional[dict] = Depends(verify_jwt_token), db: Session = Depends(get_db)):
    """Get profile of current authenticated user."""
    if not current_user:
        # Default to demo user alice_dev if not logged in
        return await get_user(user_id=1, db=db)
    user_id = current_user.get("user_id")
    return await get_user(user_id=int(user_id), db=db)

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get user profile.
    Step 1: Check LRU Cache (DSA Innovation #1) in O(1) time.
    Step 2: Database fallback on miss.
    """
    cached_user = user_cache.get(user_id)
    if cached_user != -1:
        cache_stats["hits"] += 1
        await logger.info(f"LRU Cache HIT for user {user_id}")
        return cached_user

    # Cache MISS -> Query PostgreSQL
    cache_stats["misses"] += 1
    await logger.info(f"LRU Cache MISS for user {user_id}")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    # Store in LRU Cache
    user_cache.put(user_id, user_data)
    return user_data

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "customer"

@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    existing = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    new_user = models.User(
        username=payload.username, 
        email=payload.email, 
        hashed_password=payload.password,
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    user_data = {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "role": new_user.role
    }
    user_cache.put(new_user.id, user_data)
    await logger.info(f"New user created: {payload.username}")
    return {"message": "User created", "user": user_data}

@app.get("/cache/stats")
def get_cache_stats():
    """Real LRU Cache statistics for the Performance Dashboard."""
    total = cache_stats["hits"] + cache_stats["misses"]
    hit_ratio = round((cache_stats["hits"] / max(1, total)) * 100, 1)
    return {
        "dsa": "LRU Cache",
        "service": "user-service",
        "capacity": user_cache.capacity,
        "current_size": user_cache.size(),
        "hits": cache_stats["hits"],
        "misses": cache_stats["misses"],
        "hit_ratio_pct": hit_ratio,
        "complexity": "O(1) get and put",
        "description": "Doubly linked list + hash map for O(1) user profile retrieval with capacity 1000 eviction."
    }
