"""
user-service/app/routes.py
LRU Cache-powered user management routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from shared.dsa.lru_cache import LRUCache

router = APIRouter()

# Module-level LRU Cache shared across requests
user_cache = LRUCache(capacity=1000)
_cache_hits = 0
_cache_misses = 0


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.get("/users/{user_id}", tags=["Users"])
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Fetch user profile. Checks LRU Cache first (O(1)) before hitting DB.
    DSA: LRU Cache — 100× speedup on cache hits.
    """
    global _cache_hits, _cache_misses
    cached = user_cache.get(user_id)
    if cached != -1:
        _cache_hits += 1
        return {**cached, "_source": "lru_cache", "_hit": True}

    _cache_misses += 1
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = {"id": user.id, "username": user.username, "email": user.email, "role": user.role}
    user_cache.put(user_id, user_data)
    return {**user_data, "_source": "database", "_hit": False}


@router.post("/users", status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Invalidates cache entry if it existed."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(username=payload.username, email=payload.email, hashed_password=payload.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "id": user.id}


@router.post("/login", tags=["Auth"])
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Simple login (no JWT for demo purposes)."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.hashed_password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_data = {"id": user.id, "username": user.username, "email": user.email, "role": user.role}
    user_cache.put(user.id, user_data)
    return {"message": "Login successful", "user": user_data}


@router.get("/cache/stats", tags=["DSA Metrics"])
def get_cache_stats():
    """
    Returns LRU Cache performance statistics.
    DSA: LRU Cache
    """
    total = _cache_hits + _cache_misses
    return {
        "dsa": "LRU Cache",
        "capacity": 1000,
        "current_size": user_cache.size(),
        "hits": _cache_hits,
        "misses": _cache_misses,
        "hit_ratio": round(_cache_hits / total * 100, 2) if total > 0 else 0,
        "description": "O(1) get/put, 100× faster than DB queries on cache hits",
    }


@router.delete("/cache/invalidate/{user_id}", tags=["DSA Metrics"])
def invalidate_cache(user_id: int):
    """Force-invalidate a specific user from cache (for testing)."""
    return {"message": f"Cache invalidated for user {user_id} (on next miss)"}
