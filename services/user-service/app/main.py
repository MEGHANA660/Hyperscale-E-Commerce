from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from . import models
from .database import engine, get_db, init_db
from shared.dsa.lru_cache import LRUCache
from shared.core_logger.logger import CoreLogger

app = FastAPI(title="HyperScale User Service")

# Initialize DSA: LRU Cache (Capacity 1000 users)
user_cache = LRUCache(1000)

# Initialize Core Logger
logger = CoreLogger("user-service")

@app.on_event("startup")
async def startup_event():
    # Create tables with retry logic (waits for PostgreSQL to be ready)
    init_db()
    await logger.connect()
    await logger.info("User Service started.")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    # 1. Check LRU Cache (DSA Innovation #1)
    cached_user = user_cache.get(user_id)
    if cached_user != -1:
        await logger.info(f"Cache HIT for user {user_id}", extra={"source": "lru_cache"})
        return cached_user

    # 2. Database Fallback
    await logger.info(f"Cache MISS for user {user_id}", extra={"source": "postgres"})
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Simple dict conversion for caching
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    
    # 3. Update Cache
    user_cache.put(user_id, user_data)
    
    return user_data

@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(username: str, email: str, password: str, db: Session = Depends(get_db)):
    new_user = models.User(username=username, email=email, hashed_password=password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    await logger.info(f"New user created: {username}")
    return {"message": "User created", "id": new_user.id}
