"""HTTP clients for the services the Order service depends on.

The Order service must not read or write other services' tables: the Product
service owns stock and the Payment service owns money, and the Order service
only talks to them through their APIs.
"""
import os
from datetime import datetime, timedelta, timezone

import httpx
import jwt

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8000")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8000")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
TIMEOUT = float(os.getenv("SERVICE_TIMEOUT_SECONDS", "5"))


class ServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _service_token() -> str:
    claims = {"user_id": "order-service", "role": "service",
              "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    return jwt.encode(claims, SECRET_KEY, algorithm="HS256")


def _post(url: str, body: dict, headers: dict | None = None, name: str = "Service") -> dict:
    try:
        resp = httpx.post(url, json=body, headers=headers or {}, timeout=TIMEOUT)
    except httpx.HTTPError as e:
        raise ServiceError(503, f"{name} unreachable ({e.__class__.__name__})")
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        raise ServiceError(resp.status_code, str(detail))
    return resp.json()


def reserve_stock(product_id: int, quantity: int) -> dict:
    return _post(f"{PRODUCT_SERVICE_URL}/products/{product_id}/reserve", {"quantity": quantity}, name="Product service")


def release_stock(product_id: int, quantity: int) -> dict:
    return _post(f"{PRODUCT_SERVICE_URL}/products/{product_id}/release", {"quantity": quantity}, name="Product service")


def charge(order_ref: str, amount: float, payment_method: str, idempotency_key: str) -> dict:
    """Charge the customer. Retrying with the same idempotency_key never charges twice."""
    return _post(
        f"{PAYMENT_SERVICE_URL}/payments/process",
        {"amount": amount, "payment_method": payment_method, "order_id": order_ref},
        headers={"Authorization": f"Bearer {_service_token()}", "Idempotency-Key": idempotency_key},
        name="Payment service",
    )


def refund(transaction_id: str) -> dict:
    return _post(
        f"{PAYMENT_SERVICE_URL}/payments/{transaction_id}/refund", {},
        headers={"Authorization": f"Bearer {_service_token()}"},
        name="Payment service",
    )