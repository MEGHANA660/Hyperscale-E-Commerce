"""Order lifecycle: cancel + refund, compensation, retries, expiry."""
from datetime import datetime, timedelta, timezone

import pytest

from test_order_multi_item import order_env, _order, ADMIN  # noqa: F401  (fixture re-use)


def _place(client, pid=1, qty=1, priority=3, **kw):
    r = client.post("/orders", json={**_order([{"product_id": pid, "quantity": qty}]), "priority": priority, **kw})
    assert r.status_code == 201, r.text
    return r.json()["order_id"]


def _db():
    import app.database as db_mod
    import app.main as m
    return next(m.app.dependency_overrides[db_mod.get_db]())


@pytest.mark.integration
def test_cancel_paid_order_refunds_and_returns_stock(order_env):
    client, stock, fake = order_env
    oid = _place(client, 1, 2)
    assert stock(1) == 3
    r = client.post(f"/orders/{oid}/cancel")
    assert r.status_code == 200 and r.json()["status"] == "refunded"
    assert stock(1) == 5
    assert ("refund", "txn-test") in fake.calls
    # idempotent: no second refund, no second release
    assert client.post(f"/orders/{oid}/cancel").json()["message"] == "Already cancelled"
    assert stock(1) == 5 and sum(1 for c in fake.calls if c[0] == "refund") == 1


@pytest.mark.integration
def test_refund_failure_keeps_order_paid_and_stock_taken(order_env):
    client, stock, fake = order_env
    oid = _place(client, 1, 2)
    fake.refund_fails = True
    r = client.post(f"/orders/{oid}/cancel")
    assert r.status_code == 502
    assert client.get(f"/orders/{oid}").json()["status"] == "paid"
    assert stock(1) == 3


@pytest.mark.integration
def test_delivered_order_cannot_be_cancelled(order_env):
    client, stock, fake = order_env
    oid = _place(client)
    assert client.post("/orders/queue/process", headers=ADMIN).json()["processed_order"]["id"] == oid
    assert client.post(f"/orders/{oid}/cancel").status_code == 409
    assert stock(1) == 4


@pytest.mark.integration
def test_cancelled_order_is_skipped_by_the_queue(order_env):
    client, stock, fake = order_env
    first = _place(client, priority=1)
    second = _place(client, pid=2, priority=3)
    client.post(f"/orders/{first}/cancel")
    done = client.post("/orders/queue/process", headers=ADMIN).json()
    assert done["processed_order"]["id"] == second


@pytest.mark.integration
def test_failed_release_on_cancel_is_retried_by_sweep(order_env):
    client, stock, fake = order_env
    oid = _place(client, 1, 2)
    fake.release_fails = True
    r = client.post(f"/orders/{oid}/cancel")
    assert r.status_code == 200 and r.json()["stock_returned"] is False
    assert stock(1) == 3  # refunded but stock not yet back
    fake.release_fails = False
    import app.main as m
    result = m.expire_stale_orders(_db())
    assert result["stock_released"] == [oid]
    assert stock(1) == 5
    assert m.expire_stale_orders(_db())["stock_released"] == []  # nothing left to release


@pytest.mark.integration
def test_payment_service_blip_is_retried_once_with_same_key(order_env, monkeypatch):
    client, stock, fake = order_env
    import app.clients as clients
    calls = []

    def flaky(ref, amount, method, key):
        calls.append(key)
        if len(calls) == 1:
            raise clients.ServiceError(503, "Payment service unreachable")
        return fake.charge(ref, amount, method, key)

    monkeypatch.setattr(clients, "charge", flaky)
    oid = _place(client)
    assert len(calls) == 2 and calls[0] == calls[1]
    assert client.get(f"/orders/{oid}").json()["status"] == "paid"


@pytest.mark.integration
def test_decline_is_not_retried(order_env, monkeypatch):
    client, stock, fake = order_env
    fake.decline = True
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 1}]))
    assert r.status_code == 402
    assert sum(1 for c in fake.calls if c[0] == "charge") == 1


def _stuck_order(status, minutes_old, lines, fake=None):
    """Simulate a crash mid-saga: an order row that holds stock but never finished."""
    import app.models as models
    db = _db()
    o = models.Order(user_id=7, product_id=lines[0]["product_id"], quantity=lines[0]["quantity"],
                     total_price=1.0, priority=3, status=status, reserved_lines=lines, items=[])
    db.add(o)
    db.commit()
    o.created_at = datetime.now(timezone.utc) - timedelta(minutes=minutes_old)
    db.commit()
    if fake is not None:  # the Product service really did take this stock before the crash
        for l in lines:
            fake.reservations[(str(o.id), l["product_id"])] = {"qty": l["quantity"], "state": "reserved"}
    return o.id


@pytest.mark.integration
def test_stuck_order_expires_and_returns_stock(order_env):
    client, stock, fake = order_env
    fake.stock[1] -= 3  # the crashed request had taken 3 units
    oid = _stuck_order("reserved", 60, [{"product_id": 1, "quantity": 3}], fake)
    import app.main as m
    assert m.expire_stale_orders(_db())["expired"] == [oid]
    assert stock(1) == 5
    assert client.get(f"/orders/{oid}").json()["status"] == "expired"


@pytest.mark.integration
def test_recent_in_flight_order_is_not_expired(order_env):
    client, stock, fake = order_env
    fake.stock[1] -= 3
    oid = _stuck_order("reserved", 1, [{"product_id": 1, "quantity": 3}], fake)
    import app.main as m
    assert m.expire_stale_orders(_db())["expired"] == []
    assert stock(1) == 2
    assert client.get(f"/orders/{oid}").json()["status"] == "reserved"


@pytest.mark.integration
def test_expiry_endpoint_exists(order_env):
    client, stock, fake = order_env
    r = client.post("/orders/expire", headers=ADMIN)
    assert r.status_code == 200 and r.json() == {"expired": [], "stock_released": []}


@pytest.mark.integration
def test_charge_taken_but_order_not_saved_is_refunded_and_stock_returned(order_env, monkeypatch):
    client, stock, fake = order_env
    from sqlalchemy.orm import Session
    real_commit = Session.commit

    def failing_commit(self):
        if any(getattr(o, "status", None) == "paid" for o in self.dirty):
            raise RuntimeError("database went away")
        return real_commit(self)

    monkeypatch.setattr(Session, "commit", failing_commit)
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 2}]))
    assert r.status_code == 500
    assert ("refund", "txn-test") in fake.calls   # money returned
    assert stock(1) == 5                           # stock returned
    monkeypatch.setattr(Session, "commit", real_commit)
    orders = client.get("/orders/user/7").json()["orders"]
    assert [o["status"] for o in orders] == ["failed"]


@pytest.mark.integration
def test_release_retry_after_lost_reply_does_not_inflate_stock(order_env):
    """Release worked but the reply timed out; the retry must not give the stock back twice."""
    client, stock, fake = order_env
    oid = _place(client, 1, 2)
    assert stock(1) == 3
    fake.lose_release_response = True
    client.post(f"/orders/{oid}/cancel")          # release happened, reply lost -> still recorded as held
    assert stock(1) == 5
    fake.lose_release_response = False
    import app.main as m
    m.expire_stale_orders(_db())                  # sweep retries the release
    assert stock(1) == 5                          # NOT 7
    assert m.expire_stale_orders(_db())["stock_released"] == []
