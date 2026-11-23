"""The order service must not trust the total_price the browser sends."""
import pytest
from test_integration_services import make_db_client, make_user_headers

USER = make_user_headers(7)


@pytest.fixture
def client(monkeypatch):
    c, mod = make_db_client("order-service")
    import app.clients as clients
    monkeypatch.setattr(clients, "get_price", lambda pid: 1000.0)  # 1 item = Rs 1000
    monkeypatch.setattr(clients, "reserve_stock", lambda *a, **k: {"status": "reserved"})
    monkeypatch.setattr(clients, "release_stock", lambda *a, **k: {"status": "released"})
    monkeypatch.setattr(clients, "charge", lambda *a, **k: {"status": "success", "transaction_id": "t"})
    yield c
    mod.app.dependency_overrides.clear()


def order(client, total, qty=1):
    return client.post("/orders", headers=USER, json={
        "items": [{"product_id": 1, "quantity": qty}], "total_price": total, "priority": 3})


def test_tampered_low_total_is_rejected(client):
    # 5 x Rs 1000 = Rs 5000; the best honest total is 5000*0.85-1500 = 2750
    assert order(client, 1.0, qty=5).status_code == 422


def test_tampered_high_total_is_rejected(client):
    assert order(client, 999999.0).status_code == 422


def test_honest_totals_are_accepted(client):
    assert order(client, 1000.0).status_code == 201        # no discount, free delivery
    assert order(client, 1300.0, qty=1).status_code == 201  # with Rs 300 delivery


def test_unknown_product_is_404(client, monkeypatch):
    import app.clients as clients
    def missing(pid):
        raise clients.ServiceError(404, "Product 1 not found")
    monkeypatch.setattr(clients, "get_price", missing)
    assert order(client, 1000.0).status_code == 404