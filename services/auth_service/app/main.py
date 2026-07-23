from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from pydantic import BaseModel
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI(title="Auth Service", version="1.0.0")
security = HTTPBearer()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

# FIXME: replace in-memory mock DB with PostgreSQL user table
users_db = {
    "admin": {"user_id": "usr-1", "username": "admin", "password": "admin123", "role": "admin"},
    "testuser": {"user_id": "usr-2", "username": "testuser", "password": "test123", "role": "customer"},
    "alice": {"user_id": "usr-3", "username": "alice", "password": "alice123", "role": "customer"}
}

# Request & Response Models
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserPayload(BaseModel):
    user_id: str
    username: str
    role: str

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return payload

def require_role(required_role: str):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") != required_role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
        return current_user
    return role_checker

@app.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    # print(f"debug login attempt: {req.username}")
    user = users_db.get(req.username)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong credentials")
    
    token_data = {
        "user_id": user["user_id"],
        "username": user["username"],
        "role": user["role"]
    }
    token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=TOKEN_EXPIRE_MINUTES * 60
    )

@app.get("/verify")
def verify(credentials: HTTPAuthCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    return {"valid": True, "payload": payload}

@app.get("/me")
def get_user_profile(current_user: dict = Depends(get_current_user)):
    # TODO: fetch extended user details from user-service
    return {"status": "ok", "user": current_user}

@app.get("/admin/users")
def get_admin_users(admin_user: dict = Depends(require_role("admin"))):
    return {
        "status": "ok",
        "total_users": len(users_db),
        "users": [{"user_id": u["user_id"], "username": u["username"], "role": u["role"]} for u in users_db.values()]
    }

@app.get("/health")
def health_check():
    return {"service": "auth-service", "status": "healthy"}
