from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    product_id = Column(Integer, index=True)
    quantity = Column(Integer)
    total_price = Column(Float)
    priority = Column(Integer)  # 1: Express, 2: Premium, 3: Standard
    status = Column(String, default="pending") # pending, processed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
