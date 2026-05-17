"""
order-service/app/routes.py
Min Heap powered priority order queue.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import time, uuid
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.min_heap import MinHeap

router = APIRouter()

# Global priority queue (Min Heap)
order_heap = MinHeap()
_processed_orders: List[dict] = []
_total_operations = 0

ORDER_PRIORITY = {
    "express": 1,   # Highest priority (smallest number = top of heap)
    "premium": 2,
    "standard": 3,
}


class OrderCreate(BaseModel):
    user_id: int
    items: list
    order_type: str = "standard"  # express | premium | standard
    total_amount: float


@router.post("/orders", tags=["Orders"])
def place_order(payload: OrderCreate):
    """
    Place a new order. Uses Min Heap for O(log n) priority insertion.
    Express orders always processed before standard orders.
    DSA: Min Heap
    """
    global _total_operations
    priority = ORDER_PRIORITY.get(payload.order_type.lower(), 3)
    order_id = str(uuid.uuid4())[:8].upper()
    order_data = {
        "order_id": order_id,
        "user_id": payload.user_id,
        "items": payload.items,
        "order_type": payload.order_type,
        "total_amount": payload.total_amount,
        "priority": priority,
        "placed_at": time.time(),
        "status": "queued",
    }
    order_heap.push(priority, order_data)
    _total_operations += 1
    return {
        "message": "Order placed and queued",
        "order_id": order_id,
        "priority": priority,
        "queue_position": order_heap.size(),
        "dsa": "Min Heap — O(log n) insertion",
    }


@router.get("/orders/{order_id}", tags=["Orders"])
def get_order(order_id: str):
    """Look up a processed order by ID."""
    for o in _processed_orders:
        if o.get("order_id") == order_id:
            return o
    raise HTTPException(status_code=404, detail="Order not found (may still be in queue)")


@router.get("/queue", tags=["Orders"])
def view_queue():
    """Peek at the current order queue (Min Heap)."""
    top = order_heap.peek()
    return {
        "queue_size": order_heap.size(),
        "next_order": top[1] if top else None,
        "next_priority": top[0] if top else None,
        "dsa": "Min Heap",
    }


@router.post("/queue/process", tags=["Orders"])
def process_next_order():
    """
    Process the highest-priority order from the Min Heap.
    DSA: Min Heap — O(log n) pop
    """
    global _total_operations
    if order_heap.is_empty():
        raise HTTPException(status_code=404, detail="No orders in queue")
    priority, order = order_heap.pop()
    order["status"] = "processed"
    order["processed_at"] = time.time()
    _processed_orders.append(order)
    _total_operations += 1
    return {
        "message": "Order processed",
        "order": order,
        "dsa": "Min Heap pop — O(log n)",
    }


@router.get("/heap/stats", tags=["DSA Metrics"])
def get_heap_stats():
    """Min Heap performance statistics."""
    top = order_heap.peek()
    return {
        "dsa": "Min Heap",
        "queue_size": order_heap.size(),
        "min_priority": top[0] if top else None,
        "total_operations": _total_operations,
        "processed_orders": len(_processed_orders),
        "description": "O(log n) push/pop for priority order processing",
        "priority_map": ORDER_PRIORITY,
    }
