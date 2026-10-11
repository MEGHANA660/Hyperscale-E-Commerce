"""
recommendation-service/app/main.py
Graph BFS powered product recommendation engine.
"""
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import sys, os
from typing import Optional
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.graph_bfs import ProductGraph
from shared.security import add_security_headers, RateLimiter

app = FastAPI(
    title="HyperScale Recommendation Service",
    description="Graph BFS powered product recommendation engine",
    version="1.0.0",
)

security = HTTPBearer(auto_error=False)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")
ALGORITHM = "HS256"
rate_limiter = RateLimiter(max_requests=100, window_seconds=60)

async def verify_jwt_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    if not await rate_limiter.check_rate_limit(ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return add_security_headers(response)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize product relationship graph
product_graph = ProductGraph()
_graph_operations = 0

# Seed with initial co-purchase relationships across all 6 categories
INITIAL_EDGES = [
    # Laptops co-purchased with Peripherals & Monitors
    (1, 20), (1, 21), (1, 22), (1, 17), (2, 20), (2, 22), (3, 20), (4, 21), (5, 20), (6, 19), (7, 21), (8, 22),
    # Phones co-purchased with Earbuds, Watches & Accessories
    (9, 19), (9, 18), (10, 18), (10, 19), (11, 19), (12, 17), (13, 18), (14, 19), (15, 19), (16, 17),
    # Electronics co-purchased together
    (17, 19), (18, 19), (20, 21), (21, 22), (23, 17), (24, 18),
    # Home & Living co-purchases
    (25, 30), (26, 31), (27, 28), (28, 29), (29, 30),
    # Fashion co-purchases
    (32, 34), (33, 34), (33, 37), (35, 32), (36, 34), (37, 38),
    # Beauty co-purchases
    (39, 43), (39, 45), (40, 41), (42, 44), (43, 45), (44, 39),
    # Cross-category pairings
    (1, 9), (9, 38), (32, 40), (25, 17), (18, 36),
]
for p1, p2 in INITIAL_EDGES:
    product_graph.add_edge(p1, p2)


class EdgeRequest(BaseModel):
    product_id_1: int
    product_id_2: int


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "recommendation-service"}


@app.get("/recommendations/{product_id}", tags=["Recommendations"])
def get_recommendations(product_id: int, depth: int = 2):
    """
    Get product recommendations via Graph BFS.
    Traverses the product co-purchase graph at given depth.
    DSA: Graph BFS — O(V+E) complexity.
    """
    global _graph_operations
    _graph_operations += 1
    rec_ids = product_graph.get_recommendations(product_id, depth=min(depth, 3))
    return {
        "product_id": product_id,
        "depth": depth,
        "recommended_ids": rec_ids,
        "count": len(rec_ids),
        "dsa": "Graph BFS",
        "complexity": "O(V+E)",
    }


@app.post("/graph/edge", tags=["Graph Management"])
def add_product_edge(payload: EdgeRequest):
    """
    Add a co-purchase relationship between two products.
    Creates a bidirectional edge in the product graph.
    """
    global _graph_operations
    product_graph.add_edge(payload.product_id_1, payload.product_id_2)
    _graph_operations += 1
    return {
        "message": f"Edge added: {payload.product_id_1} ↔ {payload.product_id_2}",
        "dsa": "Graph (Adjacency List)",
    }


@app.get("/graph/stats", tags=["DSA Metrics"])
def get_graph_stats():
    """Graph statistics for DSA metrics dashboard."""
    num_nodes = len(product_graph.graph)
    num_edges = sum(len(v) for v in product_graph.graph.values()) // 2
    return {
        "dsa": "Graph BFS",
        "nodes": num_nodes,
        "edges": num_edges,
        "total_operations": _graph_operations,
        "description": "Adjacency list graph — BFS finds recommendations in O(V+E)",
        "use_case": "Customers also bought — depth-2 BFS traversal",
    }
