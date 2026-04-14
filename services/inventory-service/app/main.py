from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import json
import asyncio
import logging

from . import models
from . import database
from .database import engine, get_db, init_db
from shared.dsa.bloom_filter import BloomFilter
from shared.core_logger.logger import CoreLogger

app = FastAPI(title="HyperScale Inventory Service")

# Initialize DSA: Bloom Filter (Probabilistic existence check)
inventory_filter = BloomFilter(expected_elements=10000, false_positive_rate=0.01)

# Initialize Core Logger
logger = CoreLogger("inventory-service")

# Kafka Consumer (optional)
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_SERVERS", "localhost:9092")
_kafka_available = False

try:
    from aiokafka import AIOKafkaConsumer
    _kafka_available = True
except ImportError:
    logging.getLogger("inventory-service").warning("aiokafka not installed, Kafka consumer disabled")

@app.on_event("startup")
async def startup_event():
    # Create tables with retry logic
    init_db()
    await logger.connect()
    
    # Warm up Bloom Filter (DSA Innovation #5)
    try:
        db = next(database.get_db())
        items = db.query(models.Inventory).all()
        for item in items:
            inventory_filter.add(item.product_id)
        await logger.info(f"Inventory Service started. Bloom Filter warmed with {len(items)} product IDs.")
    except Exception as e:
        await logger.warning(f"Could not warm Bloom Filter: {e}")
        await logger.info("Inventory Service started (Bloom Filter warm-up skipped).")
    
    # Start Kafka Consumer task if available
    if _kafka_available:
        asyncio.create_task(order_event_consumer())

async def order_event_consumer():
    """
    Kafka Consumer that listens for ORDER_CREATED and processes inventory.
    """
    try:
        consumer = AIOKafkaConsumer(
            "ORDER_CREATED",
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id="inventory-group"
        )
        await consumer.start()
    except Exception as e:
        await logger.warning(f"Could not connect to Kafka: {e}")
        return

    try:
        async for msg in consumer:
            order_data = json.loads(msg.value.decode("utf-8"))
            product_id = order_data["product_id"]
            quantity = order_data["quantity"]
            
            await logger.info(f"Received order event for product {product_id}")
            
            if not inventory_filter.exists(product_id):
                await logger.warning(f"Bloom Filter rejection: Product {product_id} definitely does not exist.", extra={"source": "bloom_filter"})
                continue
            
            await logger.info(f"Bloom Filter passed: Product {product_id} might exist. Checking DB...", extra={"source": "postgres"})
            
            db = next(database.get_db())
            inv_item = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
            
            if inv_item:
                if inv_item.stock_level >= quantity:
                    inv_item.stock_level -= quantity
                    db.commit()
                    await logger.info(f"Inventory deducted for product {product_id}. New stock: {inv_item.stock_level}")
                else:
                    await logger.error(f"Insufficient stock for product {product_id}")
            else:
                await logger.warning(f"Bloom Filter FALSE POSITIVE: Product {product_id} not in DB.")
                
    finally:
        await consumer.stop()

@app.post("/inventory", status_code=201)
async def add_inventory(product_id: int, stock_level: int, db: Session = Depends(get_db)):
    inv_item = models.Inventory(product_id=product_id, stock_level=stock_level)
    db.add(inv_item)
    db.commit()
    db.refresh(inv_item)
    
    inventory_filter.add(product_id)
    
    await logger.info(f"Inventory added for product {product_id}")
    return {"message": "Inventory added", "product_id": product_id}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
