"""Order service must reserve stock for EVERY cart item, all-or-nothing."""
import pytest
from test_integration_services import make_db_client


class FakeProductService:
    """Stands in for the Product service API. Note: the order DB has NO products table."""
    def __init__(self, stock):
        self.stock = dict(stock)
        self.calls = []
        self.decline = False

    def reserve(self, pid, qty):
        import app.clients as c
        self.calls.append(("reserve", pid, qty))
        if pid not in self.stock:
            raise c.ServiceError(404, "Product not found")
        if self.stock[pid] < qty:
            raise c.ServiceError(409, f"Insufficient stock for product {pid}")
        self.stock[pid] -= qty
        return {"status": "reserved"}

    def charge(self, order_ref, amount, method, key):
        import app.clients as c
        self.calls.append(("charge", amount, method, key))
        if self.decline:
            raise c.ServiceError(402, "Payment declined")
        return {"status": "success", "transaction_id": "txn-test"}

    def refund(self, txn):
        self.calls.append(("refund", txn))
        if getattr(self, "refund_fails", False):
            import app.clients as c
            raise c.ServiceError(503, "Payment service unreachable")
        return {"status": "refunded"}

    def release(self, pid, qty):
        if getattr(self, "release_fails", False):
            import app.clients as c
            raise c.ServiceError(503, "Product service unreachable")
        self.calls.append(("release", pid, qty))
        self.stock[pid] += qty
        return {"status": "released"}


@pytest.fixture()
def order_env(monkeypatch):
    client, mod = make_db_client("order-service")
    import app.clients as clients
    fake = FakeProductService({1: 5, 2: 5, 3: 1})
    monkeypatch.setattr(clients, "reserve_stock", fake.reserve)
    monkeypatch.setattr(clients, "release_stock", fake.release)
    monkeypatch.setattr(clients, "charge", fake.charge)
    monkeypatch.setattr(clients, "refund", fake.refund)
    yield client, (lambda pid: fake.stock[pid]), fake
    mod.app.dependency_overrides.clear()


def _order(items, user_id=7):
    return {"user_id": user_id, "total_price": 100.0, "priority": 3, "items": items}


@pytest.mark.integration
def test_all_items_are_reserved(order_env):
    client, stock, fake = order_env
    r = client.post("/orders", json=_order([
        {"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 3}]))
    assert r.status_code == 201
    assert stock(1) == 3
    assert stock(2) == 2  # previously untouched


@pytest.mark.integration
def test_second_item_out_of_stock_rolls_back_first(order_env):
    client, stock, fake = order_env
    r = client.post("/orders", json=_order([
        {"product_id": 1, "quantity": 2}, {"product_id": 3, "quantity": 2}]))
    assert r.status_code == 409
    assert stock(1) == 5  # first item restored
    assert stock(3) == 1
    orders = client.get("/orders/user/7").json()["orders"]
    assert [o["status"] for o in orders] == ["failed"]  # recorded, never paid


@pytest.mark.integration
def test_duplicate_lines_are_merged(order_env):
    client, stock, fake = order_env
    r = client.post("/orders", json=_order([
        {"product_id": 1, "quantity": 3}, {"product_id": 1, "quantity": 3}]))
    assert r.status_code == 409  # 6 > 5 available
    assert stock(1) == 5


@pytest.mark.integration
def test_invalid_quantity_rejected(order_env):
    client, stock, fake = order_env
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 0}]))
    assert r.status_code == 422
    assert stock(1) == 5


@pytest.mark.integration
def test_product_service_down_gives_503_and_rolls_back(order_env, monkeypatch):
    client, stock, fake = order_env
    import app.clients as clients
    real = fake.reserve

    def flaky(pid, qty):
        if pid == 2:
            raise clients.ServiceError(503, "Product service unreachable")
        return real(pid, qty)

    monkeypatch.setattr(clients, "reserve_stock", flaky)
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 1}]))
    assert r.status_code == 503
    assert stock(1) == 5  # first reservation released via the API
    assert ("release", 1, 2) in fake.calls


@pytest.mark.integration
def test_order_service_never_touches_products_table(order_env):
    client, stock, fake = order_env
    import app.main as m
    import inspect
    src = inspect.getsource(m)
    assert "UPDATE products" not in src and "FROM products" not in src


@pytest.mark.integration
def test_successful_order_is_charged_and_stores_transaction(order_env):
    client, stock, fake = order_env
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 1}]))
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "paid"
    assert body["payment_transaction_id"] == "txn-test"
    assert any(c[0] == "charge" and c[1] == 100.0 for c in fake.calls)


@pytest.mark.integration
def test_declined_payment_returns_402_releases_stock_and_is_not_paid(order_env):
    client, stock, fake = order_env
    fake.decline = True
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 1}]))
    assert r.status_code == 402
    assert stock(1) == 5 and stock(2) == 5  # everything given back
    orders = client.get("/orders/user/7").json()["orders"]
    assert len(orders) == 1 and orders[0]["status"] == "payment_failed"


@pytest.mark.integration
def test_payment_service_down_gives_503_and_no_paid_order(order_env, monkeypatch):
    client, stock, fake = order_env
    import app.clients as clients

    def down(*a, **k):
        raise clients.ServiceError(503, "Payment service unreachable")

    monkeypatch.setattr(clients, "charge", down)
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 1}]))
    assert r.status_code == 503
    assert stock(1) == 5
    assert all(o["status"] != "paid" for o in client.get("/orders/user/7").json()["orders"])


@pytest.mark.integration
def test_retry_with_same_key_does_not_charge_twice(order_env):
    client, stock, fake = order_env
    body = _order([{"product_id": 1, "quantity": 1}])
    body["idempotency_key"] = "key-1"
    assert client.post("/orders", json=body).status_code == 201
    r2 = client.post("/orders", json=body)
    assert r2.json()["idempotency_hit"] is True
    assert sum(1 for c in fake.calls if c[0] == "charge") == 1
    assert stock(1) == 4