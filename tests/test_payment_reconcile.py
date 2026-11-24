"""A charge that succeeds after the order service gave up (timeout) must be refunded."""
import pytest
from test_integration_services import make_db_client, make_user_headers

USER = make_user_headers(7)


@pytest.fixture
def setup(monkeypatch):
    c, mod = make_db_client("order-service")
    import app.clients as clients
    log = {"refunds": []}
    monkeypatch.setattr(clients, "get_price", lambda pid: 100.0, raising=False)
    monkeypatch.setattr(clients, "reserve_stock", lambda *a, **k: {"status": "reserved"})
    monkeypatch.setattr(clients, "release_stock", lambda *a, **k: {"status": "released"})

    def timeout(*a, **k):
        raise clients.ServiceError(503, "Payment service unreachable (ReadTimeout)")
    monkeypatch.setattr(clients, "charge", timeout)
    monkeypatch.setattr(clients, "refund", lambda txn: log["refunds"].append(txn) or {"status": "refunded"})
    yield c, clients, log, monkeypatch
    mod.app.dependency_overrides.clear()


def place(c):
    return c.post("/orders", headers=USER, json={
        "items": [{"product_id": 1, "quantity": 1}], "total_price": 100.0, "priority": 3, "payment_method": "upi"})


def test_late_success_is_refunded(setup):
    c, clients, log, mp = setup
    mp.setattr(clients, "find_successful_payment", lambda ref: {"transaction_id": "txn-late"}, raising=False)
    assert place(c).status_code == 503
    assert log["refunds"] == ["txn-late"]


def test_no_charge_means_no_refund(setup):
    c, clients, log, mp = setup
    mp.setattr(clients, "find_successful_payment", lambda ref: None, raising=False)
    assert place(c).status_code == 503
    assert log["refunds"] == []