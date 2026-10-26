"""The order service must trust the login token, never the request body."""
import jwt
import pytest
from datetime import datetime, timedelta, timezone

from test_integration_services import make_user_headers, SECRET_KEY, ALGORITHM
from test_order_multi_item import order_env, _order  # noqa: F401

ALICE = make_user_headers(7)
BOB = make_user_headers(8)
ADMIN = make_user_headers(1, "admin")


def _place(client, headers, pid=1, qty=1, **extra):
    body = {**_order([{"product_id": pid, "quantity": qty}]), **extra}
    r = client.post("/orders", json=body, headers=headers)
    return r



@pytest.fixture()
def anon_env(order_env):
    client, stock, fake = order_env
    client.headers.pop("Authorization", None)
    return client, stock, fake


@pytest.mark.integration
def test_every_order_endpoint_needs_a_login(anon_env):
    client, stock, fake = anon_env
    assert client.post("/orders", json=_order([{"product_id": 1, "quantity": 1}])).status_code == 401
    assert client.get("/orders/1").status_code == 401
    assert client.get("/orders/user/7").status_code == 401
    assert client.post("/orders/1/cancel").status_code == 401
    assert client.post("/orders/queue/process").status_code == 401
    assert stock(1) == 5  # nothing was reserved


@pytest.mark.integration
def test_garbage_and_expired_tokens_are_rejected(anon_env):
    client, stock, fake = anon_env
    body = _order([{"product_id": 1, "quantity": 1}])
    assert client.post("/orders", json=body, headers={"Authorization": "Bearer nonsense"}).status_code == 401
    forged = jwt.encode({"user_id": 7, "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                        "wrong-secret", algorithm=ALGORITHM)
    assert client.post("/orders", json=body, headers={"Authorization": f"Bearer {forged}"}).status_code == 401
    expired = jwt.encode({"user_id": 7, "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
                         SECRET_KEY, algorithm=ALGORITHM)
    assert client.post("/orders", json=body, headers={"Authorization": f"Bearer {expired}"}).status_code == 401


@pytest.mark.integration
def test_token_without_numeric_user_id_is_rejected(anon_env):
    client, stock, fake = anon_env
    tok = jwt.encode({"user_id": "usr-1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                     SECRET_KEY, algorithm=ALGORITHM)
    r = _place(client, {"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401 and stock(1) == 5


@pytest.mark.integration
def test_user_id_in_body_is_ignored(order_env):
    client, stock, fake = order_env
    r = _place(client, ALICE, user_id=999)   # pretend to be someone else
    assert r.status_code == 201
    oid = r.json()["order_id"]
    assert client.get(f"/orders/{oid}", headers=ALICE).json()["user_id"] == 7
    assert client.get("/orders/user/999", headers=ADMIN).json()["count"] == 0


@pytest.mark.integration
def test_user_cannot_read_another_users_orders(order_env):
    client, stock, fake = order_env
    oid = _place(client, ALICE).json()["order_id"]
    assert client.get("/orders/user/7", headers=BOB).status_code == 403
    assert client.get(f"/orders/{oid}", headers=BOB).status_code == 404  # looks like it doesn't exist
    assert client.get(f"/orders/{oid}", headers=ALICE).status_code == 200


@pytest.mark.integration
def test_user_cannot_cancel_another_users_order(order_env):
    client, stock, fake = order_env
    oid = _place(client, ALICE, qty=2).json()["order_id"]
    assert client.post(f"/orders/{oid}/cancel", headers=BOB).status_code == 404
    assert client.get(f"/orders/{oid}", headers=ALICE).json()["status"] == "paid"
    assert stock(1) == 3 and not any(c[0] == "refund" for c in fake.calls)
    assert client.post(f"/orders/{oid}/cancel", headers=ALICE).status_code == 200


@pytest.mark.integration
def test_admin_can_read_and_cancel_any_order(order_env):
    client, stock, fake = order_env
    oid = _place(client, ALICE).json()["order_id"]
    assert client.get(f"/orders/{oid}", headers=ADMIN).status_code == 200
    assert client.get("/orders/user/7", headers=ADMIN).json()["count"] == 1
    assert client.post(f"/orders/{oid}/cancel", headers=ADMIN).json()["status"] == "refunded"


@pytest.mark.integration
def test_operations_endpoints_are_admin_only(order_env):
    client, stock, fake = order_env
    for method, path in [("get", "/orders/queue"), ("post", "/orders/queue/process"), ("post", "/orders/expire")]:
        assert getattr(client, method)(path, headers=ALICE).status_code == 403, path
        assert getattr(client, method)(path, headers=ADMIN).status_code == 200, path


@pytest.mark.integration
def test_idempotency_key_cannot_leak_another_users_order(order_env):
    client, stock, fake = order_env
    assert _place(client, ALICE, idempotency_key="shared-key").status_code == 201
    r = _place(client, BOB, idempotency_key="shared-key")
    assert r.status_code == 409
    assert "order_id" not in r.text
    assert stock(1) == 4  # Bob reserved nothing