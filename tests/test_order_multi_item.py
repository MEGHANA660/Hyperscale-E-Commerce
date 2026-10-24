"""Order service must reserve stock for EVERY cart item, all-or-nothing."""
import pytest
from test_integration_services import make_db_client


class FakeProductService:
    """Stands in for the Product service API. Note: the order DB has NO products table."""
    def __init__(self, stock):
        self.stock = dict(stock)
        self.calls = []

    def reserve(self, pid, qty):
        import app.clients as c
        self.calls.append(("reserve", pid, qty))
        if pid not in self.stock:
            raise c.ServiceError(404, "Product not found")
        if self.stock[pid] < qty:
            raise c.ServiceError(409, f"Insufficient stock for product {pid}")
        self.stock[pid] -= qty
        return {"status": "reserved"}

    def release(self, pid, qty):
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
    assert client.get("/orders/user/7").json()["count"] == 0


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
