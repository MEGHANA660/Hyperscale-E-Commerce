"""Product service reserve/release must be safe to retry (timeouts, lost replies)."""
import pytest

from test_integration_services import make_db_client


@pytest.fixture()
def product_env():
    client, mod = make_db_client("product-service")
    mod.es = None
    mod.redis_client = None
    import app.database as db_mod
    import app.models as models
    db = next(mod.app.dependency_overrides[db_mod.get_db]())
    db.add(models.Product(id=1, name="Widget", price=10.0, stock=10, category="x"))
    db.commit()

    def stock():
        db.expire_all()
        return db.query(models.Product).filter_by(id=1).one().stock

    yield client, stock
    db.close()
    mod.app.dependency_overrides.clear()


def reserve(c, ref, qty=3):
    return c.post("/products/1/reserve", json={"quantity": qty, "order_ref": ref})


def release(c, ref, qty=3):
    return c.post("/products/1/release", json={"quantity": qty, "order_ref": ref})


@pytest.mark.integration
def test_repeated_reserve_takes_stock_once(product_env):
    c, stock = product_env
    assert reserve(c, "o1").status_code == 200
    r = reserve(c, "o1")
    assert r.status_code == 200 and r.json()["idempotent_replay"] is True
    assert stock() == 7


@pytest.mark.integration
def test_repeated_release_returns_stock_once(product_env):
    c, stock = product_env
    reserve(c, "o1")
    assert release(c, "o1").json()["quantity_released"] == 3
    assert release(c, "o1").json()["idempotent_replay"] is True
    assert stock() == 10  # not 13


@pytest.mark.integration
def test_release_gives_back_what_was_taken_not_what_caller_claims(product_env):
    c, stock = product_env
    reserve(c, "o1", qty=3)
    release(c, "o1", qty=99)
    assert stock() == 10


@pytest.mark.integration
def test_release_without_reservation_is_a_noop_and_blocks_late_reserve(product_env):
    c, stock = product_env
    r = release(c, "o9")
    assert r.json()["status"] == "nothing_to_release" and stock() == 10
    # the reserve that timed out earlier arrives late: it must not take stock for a dead order
    assert reserve(c, "o9").status_code == 409
    assert stock() == 10


@pytest.mark.integration
def test_reserve_after_release_is_refused(product_env):
    c, stock = product_env
    reserve(c, "o1")
    release(c, "o1")
    assert reserve(c, "o1").status_code == 409
    assert stock() == 10


@pytest.mark.integration
def test_insufficient_stock_leaves_no_reservation(product_env):
    c, stock = product_env
    assert reserve(c, "o1", qty=11).status_code == 409
    assert stock() == 10
    assert reserve(c, "o1", qty=2).status_code == 200  # a later, smaller attempt can succeed
    assert stock() == 8


@pytest.mark.integration
def test_calls_without_order_ref_still_work(product_env):
    c, stock = product_env
    assert c.post("/products/1/reserve", json={"quantity": 2}).status_code == 200
    assert c.post("/products/1/release", json={"quantity": 2}).status_code == 200
    assert stock() == 10
