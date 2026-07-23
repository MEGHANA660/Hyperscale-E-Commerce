from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
import jwt
import os
from typing import List, Optional
from shared.security import add_security_headers, RateLimiter, InputValidator

app = FastAPI(title="HyperScale Review Service", version="1.0.0")

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

# Mock review store
reviews_db = [
    {"id": "rev-1", "product_id": 1, "user_id": "usr-1", "rating": 5, "comment": "Outstanding build quality and screen!"},
    {"id": "rev-2", "product_id": 2, "user_id": "usr-2", "rating": 5, "comment": "Super fast shipping and crisp camera."}
]

class ReviewSubmission(BaseModel):
    product_id: int
    rating: int
    comment: str

async def verify_user(credentials: Optional[HTTPAuthCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required to leave review")
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

@app.get("/reviews/{product_id}")
def get_product_reviews(product_id: int):
    matched = [r for r in reviews_db if r["product_id"] == product_id]
    return {"product_id": product_id, "reviews": matched}

@app.post("/reviews", status_code=status.HTTP_201_CREATED)
def post_review(review: ReviewSubmission, user: dict = Depends(verify_user)):
    cleaned_comment = InputValidator.sanitize_input(review.comment)
    new_rev = {
        "id": f"rev-{len(reviews_db) + 1}",
        "product_id": review.product_id,
        "user_id": user.get("user_id", "guest"),
        "rating": max(1, min(5, review.rating)),
        "comment": cleaned_comment
    }
    reviews_db.append(new_rev)
    return {"status": "ok", "review": new_rev}

@app.get("/health")
def health_check():
    return {"service": "review-service", "status": "healthy"}
