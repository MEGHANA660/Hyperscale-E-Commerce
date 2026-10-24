"""HTTP client for the Product service.

The Order service must not read or write the `products` table: the Product
service owns stock, and the Order service only talks to it through its API.
"""
import os

import httpx

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8000")
TIMEOUT = float(os.getenv("SERVICE_TIMEOUT_SECONDS", "5"))


class ServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _post(path: str, quantity: int) -> dict:
    url = f"{PRODUCT_SERVICE_URL}{path}"
    try:
        resp = httpx.post(url, json={"quantity": quantity}, timeout=TIMEOUT)
    except httpx.HTTPError as e:
        raise ServiceError(503, f"Product service unreachable ({e.__class__.__name__})")
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("detail", resp.text)
        except Exception:
            detail = resp.text
        raise ServiceError(resp.status_code, str(detail))
    return resp.json()


def reserve_stock(product_id: int, quantity: int) -> dict:
    return _post(f"/products/{product_id}/reserve", quantity)


def release_stock(product_id: int, quantity: int) -> dict:
    return _post(f"/products/{product_id}/release", quantity)
