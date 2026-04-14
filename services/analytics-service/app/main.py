from fastapi import FastAPI

from shared.dsa.segment_tree import SegmentTree
from shared.core_logger.logger import CoreLogger

app = FastAPI(title="HyperScale Analytics Service")

# Initialize DSA: Segment Tree (Range Queries)
# Imagine 10,000 product slots, initial stock 0
stock_analytics = SegmentTree([0] * 10000)

# Initialize Core Logger
logger = CoreLogger("analytics-service")

@app.on_event("startup")
async def startup_event():
    await logger.connect()
    await logger.info("Analytics Service started.")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/analytics/stock/range")
async def get_stock_range(low_idx: int, high_idx: int):
    """
    Query total stock in range [low_idx, high_idx] using Segment Tree (DSA #6).
    Complexity: O(log N)
    """
    total = stock_analytics.query(low_idx, high_idx)
    return {"range": [low_idx, high_idx], "total_stock": total}

@app.post("/analytics/stock/update")
async def update_stock_analytics(product_idx: int, new_stock: int):
    """
    Update stock for a product in the Segment Tree.
    Complexity: O(log N)
    """
    stock_analytics.update(product_idx, new_stock)
    await logger.info(f"Updated segment tree for product index {product_idx}")
    return {"message": "Analytics updated"}
