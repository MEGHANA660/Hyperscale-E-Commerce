import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://admin:password@localhost:5432/order_service_db"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables. Call during startup with retry logic."""
    import time
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return True
        except Exception as e:
            print(f"DB init attempt {attempt + 1}/10 failed: {e}")
            time.sleep(3)
    return False


_NEW_COLUMNS = {"payment_txn_id": "VARCHAR", "failure_reason": "VARCHAR", "reserved_lines": "JSON"}


def ensure_columns():
    """Add columns introduced after the `orders` table was first created."""
    from sqlalchemy import inspect, text
    try:
        insp = inspect(engine)
        if "orders" not in insp.get_table_names():
            return
        existing = {c["name"] for c in insp.get_columns("orders")}
        with engine.begin() as conn:
            for name, ddl in _NEW_COLUMNS.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE orders ADD COLUMN {name} {ddl}"))
    except Exception as e:
        print(f"ensure_columns skipped: {e}")
