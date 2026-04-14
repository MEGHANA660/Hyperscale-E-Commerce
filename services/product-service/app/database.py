import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "PRODUCT_DATABASE_URL", "postgresql://admin:password@localhost:5432/product_service_db"
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
