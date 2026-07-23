from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
import jwt
import os
from typing import List, Optional
from shared.security import add_security_headers, RateLimiter

app = FastAPI(title="HyperScale Cart Service", version="1.0.0")

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

# Mock in-memory user carts
# TODO: persist cart state in Redis cluster
user_carts = {}

class CartItem(BaseModel):
    product_id: int
    quantity: int = 1

async def get_current_user(credentials: Optional[HTTPAuthCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    if not await rate_limiter.check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return add_security_headers(response)

@app.get("/cart")
def get_cart(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id", "guest")
    cart_items = user_carts.get(user_id, [])
    return {"user_id": user_id, "cart": cart_items}

@app.post("/cart/add")
def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id", "guest")
    if user_id not in user_carts:
        user_carts[user_id] = []
    
    # Check if item exists in cart
    existing = next((i for i in user_carts[user_id] if i["product_id"] == item.product_id), None)
    if existing:
        existing["quantity"] += item.quantity
    else:
        user_carts[user_id].append({"product_id": item.product_id, "quantity": item.quantity})
        
    return {"status": "ok", "cart": user_carts[user_id]}

@app.delete("/cart/clear")
def clear_cart(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id", "guest")
    user_carts[user_id] = []
    return {"status": "cart cleared"}

@app.get("/health")
def health_check():
    return {"service": "cart-service", "status": "healthy"}
