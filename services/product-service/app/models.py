from sqlalchemy import Column, Integer, String, Float, Text, DateTime, PrimaryKeyConstraint
from sqlalchemy.sql import func
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    category = Column(String, index=True)
    image_url = Column(String, nullable=True)
    rating = Column(Float, default=4.5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class StockReservation(Base):
    """One row per (order, product): makes reserve/release safe to retry after a timeout."""
    __tablename__ = "stock_reservations"
    __table_args__ = (PrimaryKeyConstraint("order_ref", "product_id"),)

    order_ref = Column(String, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    state = Column(String, nullable=False, default="reserved")  # reserved | released
    created_at = Column(DateTime(timezone=True), server_default=func.now())