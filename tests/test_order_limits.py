"""Cart limits and malformed carts are rejected before any stock or money moves."""
import pytest

from test_order_multi_item import order_env, _order  # noqa: F401


def _count_side_effects(fake):
    return [c for c in fake.calls if c[0] in ("reserve", "charge")]


@pytest.mark.integration
def test_exactly_the_maximum_quantity_is_allowed(order_env):
    client, stock, fake = order_env
    fake.stock[1] = 50
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 10}]))
    assert r.status_code == 201


@pytest.mark.integration
def test_one_more_than_the_maximum_quantity_is_rejected(order_env):
    client, stock, fake = order_env
    fake.stock[1] = 50
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 11}]))
    assert r.status_code == 422 and "at most 10 units" in r.json()["detail"]
    assert _count_side_effects(fake) == [] and stock(1) == 50


@pytest.mark.integration
def test_duplicate_lines_cannot_dodge_the_quantity_limit(order_env):
    client, stock, fake = order_env
    fake.stock[1] = 50
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": 6}, {"product_id": 1, "quantity": 6}]))
    assert r.status_code == 422
    assert _count_side_effects(fake) == []


@pytest.mark.integration
def test_too_many_different_products_is_rejected(order_env):
    client, stock, fake = order_env
    items = [{"product_id": pid, "quantity": 1} for pid in range(1, 22)]  # 21 products
    r = client.post("/orders", json=_order(items))
    assert r.status_code == 422 and "different products" in r.json()["detail"]
    assert _count_side_effects(fake) == []


@pytest.mark.integration
def test_legacy_single_product_payload_is_limited_too(order_env):
    client, stock, fake = order_env
    fake.stock[1] = 5000
    r = client.post("/orders", json={"product_id": 1, "quantity": 5000, "total_price": 1.0})
    assert r.status_code == 422 and stock(1) == 5000


@pytest.mark.integration
@pytest.mark.parametrize("body", [
    {"total_price": 100.0},                       # nothing at all
    {"total_price": 100.0, "items": []},          # empty cart
])
def test_order_with_no_items_does_not_silently_buy_product_1(order_env, body):
    client, stock, fake = order_env
    r = client.post("/orders", json=body)
    assert r.status_code == 422 and "at least one item" in r.json()["detail"]
    assert _count_side_effects(fake) == [] and stock(1) == 5


@pytest.mark.integration
@pytest.mark.parametrize("qty", [0, -3])
def test_zero_and_negative_quantities_are_rejected(order_env, qty):
    client, stock, fake = order_env
    r = client.post("/orders", json=_order([{"product_id": 1, "quantity": qty}]))
    assert r.status_code == 422 and _count_side_effects(fake) == []
