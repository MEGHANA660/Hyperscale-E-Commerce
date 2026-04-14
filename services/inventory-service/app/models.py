from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, unique=True, index=True, nullable=False)
    stock_level = Column(Integer, default=0)
    location = Column(String, default="Warehouse A")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
