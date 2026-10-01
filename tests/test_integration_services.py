"""
test_integration_services.py
Comprehensive integration tests for all HyperScale Commerce microservices.

Tests every service's core endpoints (health check and primary routes)
using FastAPI's TestClient with isolated module loading and in-memory
databases (SQLite StaticPool for SQLAlchemy services, mock in-memory stores
for cache/graph/heap/bloom/trie/queue).
"""

import sys
import os
import jwt
from datetime import datetime, timedelta
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SERVICES_DIR = os.path.join(ROOT, "services")
SHARED_DIR = os.path.join(ROOT, "shared")

SECRET_KEY = "dev-secret-key-change-in-prod"
ALGORITHM = "HS256"


def make_token(user_id="usr-1", username="admin", role="admin") -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def load_service_app(service_name: str):
    """
    Load a service's FastAPI `app` in isolation by purging previous `app.*`
    cached modules from sys.modules and setting sys.path with service_dir first.
    """
    svc_dir = os.path.join(SERVICES_DIR, service_name)
    for k in list(sys.modules.keys()):
        if k == "app" or k.startswith("app."):
            del sys.modules[k]

    clean_path = [
        p for p in sys.path
        if not any(p.startswith(os.path.join(SERVICES_DIR, s)) for s in os.listdir(SERVICES_DIR))
    ]
    sys.path = [svc_dir, os.path.join(SERVICES_DIR, "shared"), SHARED_DIR] + clean_path

    import app.main as svc_main
    return svc_main


def make_db_client(service_name: str):
    """
    Load a DB-backed service with get_db overridden to use SQLite in-memory with StaticPool.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    mod = load_service_app(service_name)
    import app.database as db_mod
    import app.models  # Ensure models are registered on Base

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db_mod.Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    mod.app.dependency_overrides[db_mod.get_db] = override_get_db
    return TestClient(mod.app, raise_server_exceptions=False), mod


# ════════════════════════════════════════════════════════════════════════════
#  1. Auth Service
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def auth_client():
    mod = load_service_app("auth-service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_auth_health(auth_client):
    r = auth_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_auth_login_success(auth_client):
    r = auth_client.post("/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.integration
def test_auth_login_wrong_password(auth_client):
    r = auth_client.post("/login", json={"username": "admin", "password": "wrongpassword"})
    assert r.status_code == 401


@pytest.mark.integration
def test_auth_verify_token(auth_client):
    token = make_token()
    r = auth_client.get("/verify", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["valid"] is True


@pytest.mark.integration
def test_auth_me_endpoint(auth_client):
    token = make_token(user_id="usr-99", username="testuser", role="customer")
    r = auth_client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["user"]["username"] == "testuser"


# ════════════════════════════════════════════════════════════════════════════
#  2. Recommendation Service (Graph BFS)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def rec_client():
    mod = load_service_app("recommendation-service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_rec_health(rec_client):
    r = rec_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_rec_get_recommendations(rec_client):
    r = rec_client.get("/recommendations/1")
    assert r.status_code == 200
    data = r.json()
    assert "recommended_ids" in data
    assert data["product_id"] == 1
    assert data["dsa"] == "Graph BFS"


@pytest.mark.integration
def test_rec_graph_stats(rec_client):
    r = rec_client.get("/graph/stats")
    assert r.status_code == 200
    assert "nodes" in r.json()
    assert "edges" in r.json()


@pytest.mark.integration
def test_rec_add_edge(rec_client):
    r = rec_client.post("/graph/edge", json={"product_id_1": 100, "product_id_2": 200})
    assert r.status_code == 200
    assert "Edge added" in r.json()["message"]


# ════════════════════════════════════════════════════════════════════════════
#  3. Analytics Service (Segment Tree & DP)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def analytics_client():
    mod = load_service_app("analytics-service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_analytics_health(analytics_client):
    r = analytics_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_analytics_range_query(analytics_client):
    r = analytics_client.get("/analytics/range?start=0&end=5")
    assert r.status_code == 200
    data = r.json()
    assert "total_sales" in data
    assert data["dsa"] == "Segment Tree"


@pytest.mark.integration
def test_analytics_dashboard(analytics_client):
    r = analytics_client.get("/analytics/dashboard")
    assert r.status_code == 200
    data = r.json()
    assert "months" in data
    assert len(data["months"]) == 12


@pytest.mark.integration
def test_analytics_discount_optimize(analytics_client):
    payload = {"discounts": [[10, 50], [8, 30], [15, 70]], "budget": 100}
    r = analytics_client.post("/discounts/optimize", json=payload)
    assert r.status_code == 200
    assert "max_conversion_increase" in r.json()


@pytest.mark.integration
def test_analytics_range_invalid(analytics_client):
    r = analytics_client.get("/analytics/range?start=10&end=2")
    assert r.status_code == 400


# ════════════════════════════════════════════════════════════════════════════
#  4. Cart Service
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def cart_client():
    mod = load_service_app("cart_service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_cart_health(cart_client):
    r = cart_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_cart_requires_auth(cart_client):
    r = cart_client.get("/cart")
    assert r.status_code == 401


@pytest.mark.integration
def test_cart_add_and_get_item(cart_client):
    token = make_token(user_id="usr-cart-1")
    headers = {"Authorization": f"Bearer {token}"}
    r = cart_client.post("/cart/add", json={"product_id": 42, "quantity": 2}, headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    r_get = cart_client.get("/cart", headers=headers)
    assert r_get.status_code == 200
    items = r_get.json()["cart"]
    assert any(i["product_id"] == 42 for i in items)


@pytest.mark.integration
def test_cart_clear(cart_client):
    token = make_token(user_id="usr-cart-2")
    headers = {"Authorization": f"Bearer {token}"}
    cart_client.post("/cart/add", json={"product_id": 99, "quantity": 1}, headers=headers)
    r_clear = cart_client.delete("/cart/clear", headers=headers)
    assert r_clear.status_code == 200

    r_get = cart_client.get("/cart", headers=headers)
    assert len(r_get.json()["cart"]) == 0


# ════════════════════════════════════════════════════════════════════════════
#  5. Payment Service
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def payment_client():
    mod = load_service_app("payment_service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_payment_health(payment_client):
    r = payment_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_payment_requires_auth(payment_client):
    r = payment_client.post("/payments/process", json={"amount": 100.0})
    assert r.status_code == 401


@pytest.mark.integration
def test_payment_process_success(payment_client):
    token = make_token()
    r = payment_client.post(
        "/payments/process",
        json={"amount": 999.0, "currency": "INR", "payment_method": "upi"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "success"
    assert "transaction_id" in data
    assert data["amount"] == 999.0


# ════════════════════════════════════════════════════════════════════════════
#  6. Review Service
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def review_client():
    mod = load_service_app("review_service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_review_health(review_client):
    r = review_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_review_get_reviews(review_client):
    r = review_client.get("/reviews/1")
    assert r.status_code == 200
    data = r.json()
    assert data["product_id"] == 1
    assert isinstance(data["reviews"], list)


@pytest.mark.integration
def test_review_post_requires_auth(review_client):
    r = review_client.post(
        "/reviews",
        json={"product_id": 1, "rating": 5, "comment": "Good"},
    )
    assert r.status_code == 401


@pytest.mark.integration
def test_review_post_success(review_client):
    token = make_token(user_id="usr-reviewer")
    r = review_client.post(
        "/reviews",
        json={"product_id": 5, "rating": 5, "comment": "Great product!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    assert r.json()["status"] == "ok"


# ════════════════════════════════════════════════════════════════════════════
#  7. User Service (SQLAlchemy DB)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def user_client():
    client, mod = make_db_client("user-service")
    yield client
    mod.app.dependency_overrides.clear()


@pytest.mark.integration
def test_user_health(user_client):
    r = user_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_user_create_and_fetch(user_client):
    r = user_client.post("/users?username=testuser&email=test@example.com&password=secret123")
    assert r.status_code == 201
    user_id = r.json()["id"]

    r2 = user_client.get(f"/users/{user_id}")
    assert r2.status_code == 200
    assert r2.json()["username"] == "testuser"


@pytest.mark.integration
def test_user_not_found(user_client):
    r = user_client.get("/users/999999")
    assert r.status_code == 404


# ════════════════════════════════════════════════════════════════════════════
#  8. Product Service (SQLAlchemy DB + Trie)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def product_client():
    client, mod = make_db_client("product-service")
    mod.es = None  # Disable remote ES in unit/integration test
    mod.redis_client = None  # Disable remote Redis in test
    yield client
    mod.app.dependency_overrides.clear()


@pytest.mark.integration
def test_product_health(product_client):
    r = product_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_product_create_and_fetch(product_client):
    r = product_client.post("/products?name=SuperLaptop&price=1299.99&description=Ultra+fast")
    assert r.status_code == 200
    pid = r.json()["id"]

    r2 = product_client.get(f"/products/{pid}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "SuperLaptop"


@pytest.mark.integration
def test_product_autocomplete(product_client):
    r = product_client.get("/products/autocomplete?prefix=Super")
    assert r.status_code == 200
    assert "suggestions" in r.json()


@pytest.mark.integration
def test_product_not_found(product_client):
    r = product_client.get("/products/999999")
    assert r.status_code == 404


# ════════════════════════════════════════════════════════════════════════════
#  9. Inventory Service (SQLAlchemy DB + Bloom Filter)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def inventory_client():
    client, mod = make_db_client("inventory-service")
    yield client
    mod.app.dependency_overrides.clear()


@pytest.mark.integration
def test_inventory_health(inventory_client):
    r = inventory_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_inventory_add_item(inventory_client):
    r = inventory_client.post("/inventory?product_id=501&stock_level=250")
    assert r.status_code == 201
    assert r.json()["product_id"] == 501


# ════════════════════════════════════════════════════════════════════════════
#  10. Order Service (SQLAlchemy DB + Min Heap)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def order_client():
    client, mod = make_db_client("order-service")
    yield client
    mod.app.dependency_overrides.clear()


@pytest.mark.integration
def test_order_health(order_client):
    r = order_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_order_create(order_client):
    r = order_client.post("/orders?user_id=1&product_id=501&quantity=3&priority=1")
    assert r.status_code == 201
    assert "order_id" in r.json()


@pytest.mark.integration
def test_order_queue_status(order_client):
    r = order_client.get("/orders/queue")
    assert r.status_code == 200
    assert "size" in r.json()


# ════════════════════════════════════════════════════════════════════════════
#  11. Notification Service
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def notification_client():
    mod = load_service_app("notification-service")
    # Mock celery task to test endpoint without RabbitMQ broker
    mod.send_notification = MagicMock()
    mod.send_notification.delay.return_value = MagicMock(id="test-task-uuid-1234")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_notification_health(notification_client):
    r = notification_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.integration
def test_notification_notify(notification_client):
    r = notification_client.post("/notify?user_id=1&message=Welcome!&type=email")
    assert r.status_code == 200
    assert r.json()["task_id"] == "test-task-uuid-1234"


# ════════════════════════════════════════════════════════════════════════════
#  12. API Gateway (Main Service)
# ════════════════════════════════════════════════════════════════════════════
@pytest.fixture(scope="module")
def gateway_client():
    mod = load_service_app("main-service")
    return TestClient(mod.app, raise_server_exceptions=False)


@pytest.mark.integration
def test_gateway_health(gateway_client):
    r = gateway_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "gateway-online"


@pytest.mark.integration
def test_gateway_unknown_service(gateway_client):
    r = gateway_client.get("/nonexistent/endpoint")
    assert r.status_code == 404
