"""Cash on delivery must not be recorded as paid, and must not touch the payment service."""
import pytest
from test_integration_services import make_db_client, make_user_headers

USER = make_user_headers(7)


@pytest.fixture
def setup(monkeypatch):
    c, mod = make_db_client("order-service")
    import app.clients as clients
    calls = []
    monkeypatch.setattr(clients, "get_price", lambda pid: 100.0, raising=False)
    monkeypatch.setattr(clients, "reserve_stock", lambda *a, **k: {"status": "reserved"})
    monkeypatch.setattr(clients, "release_stock", lambda *a, **k: {"status": "released"})
    monkeypatch.setattr(clients, "charge", lambda *a, **k: calls.append(a) or {"status": "success", "transaction_id": "t"})
    yield c, calls
    mod.app.dependency_overrides.clear()


def place(c, method):
    return c.post("/orders", headers=USER, json={
        "items": [{"product_id": 1, "quantity": 1}], "total_price": 100.0, "priority": 3, "payment_method": method})


def test_cod_is_pending_not_paid_and_not_charged(setup):
    c, calls = setup
    r = place(c, "cod")
    assert r.status_code == 201
    assert r.json()["status"] == "cod_pending"
    assert calls == []


def test_upi_is_still_paid_and_charged(setup):
    c, calls = setup
    r = place(c, "upi")
    assert r.json()["status"] == "paid"
    assert len(calls) == 1


def test_cod_order_can_be_cancelled_without_refund(setup):
    c, _ = setup
    oid = place(c, "cod").json()["order_id"]
    r = c.post(f"/orders/{oid}/cancel", headers=USER)
    assert r.status_code == 200
    assert r.json()["status"] == "cancelled"