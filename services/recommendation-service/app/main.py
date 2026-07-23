"""
recommendation-service/app/main.py
Graph BFS powered product recommendation engine.
"""
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthCredentials
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

async def verify_jwt_token(credentials: Optional[HTTPAuthCredentials] = Depends(security)) -> Optional[dict]:
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

# Seed with some initial relationships
INITIAL_EDGES = [
    (1, 2), (1, 3), (2, 4), (3, 5), (4, 6), (5, 6),
    (7, 8), (7, 9), (8, 10), (9, 10), (10, 11), (11, 12),
    (1, 7), (2, 8), (3, 9), (4, 10),
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
