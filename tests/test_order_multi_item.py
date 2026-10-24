"""Order service must reserve stock for EVERY cart item, all-or-nothing."""
import pytest
from sqlalchemy import text

from test_integration_services import make_db_client


@pytest.fixture()
def order_env():
    client, mod = make_db_client("order-service")
    import app.database as db_mod
    override = mod.app.dependency_overrides[db_mod.get_db]
    db = next(override())
    db.execute(text("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, stock INTEGER)"))
    db.execute(text("INSERT INTO products VALUES (1,'A',5),(2,'B',5),(3,'C',1)"))
    db.commit()

    def stock(pid):
        return db.execute(text("SELECT stock FROM products WHERE id=:i"), {"i": pid}).scalar()

    yield client, stock
    db.close()
    mod.app.dependency_overrides.clear()


def _order(items, user_id=7):
    return {"user_id": user_id, "total_price": 100.0, "priority": 3, "items": items}


@pytest.mark.integration
def test_all_items_are_reserved(order_env):
    client, stock = order_env
    r = client.post("/orders", json=_order([
        {"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 3}]))
    assert r.status_code == 201
    assert stock(1) == 3
    assert stock(2) == 2  # previously untouched


@pytest.mark.integration
def test_second_item_out_of_stock_rolls_back_first(order_env):
    client, stock = order_env
    r = client.post("/orders", json=_order([
        {"product_id": 1, "quantity": 2}, {"product_id": 3, "quantity": 2}]))
    assert r.status_code == 409
    assert stock(1) == 5  # first item restored
    assert stock(3) == 1
    assert client.get("/orders/user/7").json()["count"] == 0


@pytest.mark.integration
def test_duplicate_lines_are_merged(order_env):
    client, stock = order_env
    r = client.post("/orders", json=_order([
        {"product_id": 1, "quantity": 3}, {"product_id": 1, "quantity": 3}]))
    assert r.status_code == 409  # 6 > 5 available
    assert stock(1) == 5


@pytest.mark.integration
def test_invalid_quantity_rejected(order_env):
    client, stock = order_env
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 0}]))
    assert r.status_code == 422
    assert stock(1) == 5
