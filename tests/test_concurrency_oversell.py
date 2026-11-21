"""Concurrency proof: parallel buyers can never oversell limited stock."""
import threading
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from test_integration_services import load_service_app

STOCK = 5
BUYERS = 50


@pytest.mark.integration
def test_50_parallel_buyers_against_stock_of_5(tmp_path):
    mod = load_service_app("product-service")
    mod.es = None
    mod.redis_client = None
    import app.database as db_mod
    import app.models as models

    engine = create_engine(f"sqlite:///{tmp_path / 'stock.db'}", connect_args={"check_same_thread": False, "timeout": 30})
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db_mod.Base.metadata.create_all(bind=engine)

    def get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    mod.app.dependency_overrides[db_mod.get_db] = get_db
    try:
        with Session() as db:
            db.add(models.Product(id=1, name="Limited Edition", price=10.0, stock=STOCK, category="x"))
            db.commit()

        client = TestClient(mod.app, raise_server_exceptions=False)
        barrier = threading.Barrier(BUYERS)

        def buy(i):
            barrier.wait()
            return client.post("/products/1/reserve", json={"quantity": 1, "order_ref": f"order-{i}"}).status_code

        with ThreadPoolExecutor(max_workers=BUYERS) as pool:
            codes = list(pool.map(buy, range(BUYERS)))

        assert codes.count(200) == STOCK, codes
        assert codes.count(409) == BUYERS - STOCK, codes
        with Session() as db:
            assert db.query(models.Product).filter_by(id=1).one().stock == 0
            assert db.query(models.StockReservation).count() == STOCK
    finally:
        mod.app.dependency_overrides.clear()