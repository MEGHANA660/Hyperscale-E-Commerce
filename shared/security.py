import re
import html
import time
from typing import Dict, List, Tuple
from fastapi import Response

# ─── 1. RateLimiter Class ───────────────────────────────────────────────────
class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}

    async def check_rate_limit(self, client_ip: str) -> bool:
        now = time.time()
        cutoff = now - self.window_seconds
        
        # Filter old timestamps for IP
        user_timestamps = self.requests.get(client_ip, [])
        valid_timestamps = [t for t in user_timestamps if t > cutoff]
        
        if len(valid_timestamps) >= self.max_requests:
            return False
            
        valid_timestamps.append(now)
        self.requests[client_ip] = valid_timestamps
        return True


# ─── 2. InputValidator Class ────────────────────────────────────────────────
class InputValidator:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,30}$")
    SQL_INJECTION_REGEX = re.compile(r"(?i)(\b(select|insert|update|delete|drop|union|alter|exec)\b|--|\/\*|\*\/)")

    @staticmethod
    def validate_email(email: str) -> bool:
        if not email or len(email) > 254:
            return False
        return bool(InputValidator.EMAIL_REGEX.match(email.strip()))

    @staticmethod
    def validate_username(username: str) -> bool:
        if not username:
            return False
        return bool(InputValidator.USERNAME_REGEX.match(username.strip()))

    @staticmethod
    def validate_password(password: str) -> Tuple[bool, str]:
        if not password or len(password) < 8:
            return False, "Password must be at least 8 characters long"
        if not any(c.isupper() for c in password):
            return False, "Password requires at least one uppercase letter"
        if not any(c.isdigit() for c in password):
            return False, "Password requires at least one number"
        return True, "Password is valid"

    @staticmethod
    def sanitize_input(user_input: str) -> str:
        if not user_input:
            return ""
        # Escape HTML script/tags to prevent XSS
        cleaned = html.escape(user_input.strip())
        return cleaned

    @staticmethod
    def validate_search_query(query: str) -> bool:
        if not query or len(query) > 100:
            return False
        # Block basic SQLi patterns and harmful control chars
        if InputValidator.SQL_INJECTION_REGEX.search(query):
            return False
        return True


# ─── 3. Security Headers Function ───────────────────────────────────────────
def add_security_headers(response: Response) -> Response:
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
