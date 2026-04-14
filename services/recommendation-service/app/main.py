from fastapi import FastAPI
import os
import json
import asyncio
import logging

from shared.dsa.graph_bfs import ProductGraph
from shared.dsa.discount_dp import optimize_discounts
from shared.core_logger.logger import CoreLogger

app = FastAPI(title="HyperScale Recommendation Service")

# Initialize DSA: Graph (Relationships)
relationship_graph = ProductGraph()

# Initialize Core Logger
logger = CoreLogger("recommendation-service")

# Kafka Config (optional)
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_SERVERS", "localhost:9092")
_kafka_available = False

try:
    from aiokafka import AIOKafkaConsumer
    _kafka_available = True
except ImportError:
    logging.getLogger("recommendation-service").warning("aiokafka not installed, Kafka consumer disabled")

@app.on_event("startup")
async def startup_event():
    await logger.connect()
    await logger.info("Recommendation Service started.")
    if _kafka_available:
        asyncio.create_task(order_consumer())

async def order_consumer():
    """Consume orders to build the recommendation graph."""
    try:
        consumer = AIOKafkaConsumer(
            "ORDER_CREATED",
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id="rec-group"
        )
        await consumer.start()
    except Exception as e:
        await logger.warning(f"Could not connect to Kafka: {e}")
        return

    try:
        async for msg in consumer:
            order_data = json.loads(msg.value.decode("utf-8"))
            await logger.info(f"Updated recommendation graph with order: {order_data['id']}")
    finally:
        await consumer.stop()

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/recommendations/{product_id}")
async def get_recommendations(product_id: int, depth: int = 2):
    """
    Get related products using Graph BFS (DSA #4).
    """
    recs = relationship_graph.get_recommendations(product_id, depth)
    return {"product_id": product_id, "recommendations": recs}

@app.post("/discounts/optimize")
async def optimize_discount_allocation(budget: int, discount_options: list):
    """
    Optimize discounts using Dynamic Programming (DSA #7).
    discount_options: list of [conversion_inc, cost]
    """
    max_inc, indices = optimize_discounts(discount_options, budget)
    return {
        "max_conversion_increase": max_inc,
        "selected_discounts": indices,
        "budget_used": sum(discount_options[i][1] for i in indices)
    }
