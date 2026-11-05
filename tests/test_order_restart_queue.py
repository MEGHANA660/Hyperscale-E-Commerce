"""After a restart the fulfilment queue must hold PAID orders only."""
import pytest

from test_integration_services import make_db_client


@pytest.mark.integration
def test_restart_rebuilds_queue_from_paid_orders_only():
    client, mod = make_db_client("order-service")
    try:
        db = next(next(iter(mod.app.dependency_overrides.values()))())
        for status, prio in [("paid", 1), ("paid", 3), ("pending", 1), ("reserved", 2), ("cancelled", 1), ("delivered", 1)]:
            db.add(mod.models.Order(user_id=7, product_id=1, quantity=1, total_price=100.0, priority=prio, status=status))
        db.commit()
        assert mod.warm_queue(db) == 2
        assert mod.order_queue.size() == 2
        first_priority, first = mod.order_queue.pop()
        assert first_priority == 1 and first["status"] == "paid"   # Express comes out first
        db.close()
    finally:
        mod.order_queue.heap = []
        mod.app.dependency_overrides.clear()
