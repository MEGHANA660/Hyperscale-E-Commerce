# API Documentation
## HyperScale Commerce — All Microservice Endpoints

Base URLs when running locally:
- **Product Service:** `http://localhost:8001`
- **User Service:** `http://localhost:8002`
- **Order Service:** `http://localhost:8003`
- **Recommendation Service:** `http://localhost:8004`
- **Analytics Service:** `http://localhost:8005`

---

## Product Service (Port 8001)

| Method | Endpoint | Description | DSA |
|--------|----------|-------------|-----|
| GET | `/health` | Health check | — |
| GET | `/products?page=1&limit=20` | List all products | — |
| GET | `/products/{id}` | Get single product | LRU Cache |
| GET | `/search?q={query}` | Autocomplete search | **Trie** |
| GET | `/exists/{product_id}` | Existence check | **Bloom Filter** |
| GET | `/trie/stats` | Trie performance metrics | Trie |
| GET | `/bloom/stats` | Bloom Filter metrics | Bloom Filter |

### Example: Search with Trie
```bash
curl http://localhost:8001/search?q=mac
# Response:
{
  "query": "mac",
  "results": [{"id": 1, "name": "MacBook Pro 16\"", ...}],
  "search_time_ms": 0.12,
  "dsa": "Trie",
  "complexity": "O(m)"
}
```

---

## User Service (Port 8002)

| Method | Endpoint | Description | DSA |
|--------|----------|-------------|-----|
| GET | `/health` | Health check | — |
| GET | `/users/{user_id}` | Get user profile | **LRU Cache** |
| POST | `/users` | Register user | — |
| POST | `/login` | Authenticate user | LRU Cache |
| GET | `/cache/stats` | LRU Cache metrics | LRU Cache |
| DELETE | `/cache/invalidate/{id}` | Invalidate cache entry | LRU Cache |

### Example: Get User (LRU Cache)
```bash
curl http://localhost:8002/users/1
# Response:
{
  "id": 1,
  "username": "alice",
  "_source": "lru_cache",
  "_hit": true
}
```

---

## Order Service (Port 8003)

| Method | Endpoint | Description | DSA |
|--------|----------|-------------|-----|
| GET | `/health` | Health check | — |
| POST | `/orders` | Place new order | **Min Heap** |
| GET | `/orders/{order_id}` | Get order status | — |
| GET | `/queue` | View priority queue | Min Heap |
| POST | `/queue/process` | Process next order | Min Heap |
| GET | `/heap/stats` | Heap performance stats | Min Heap |

### Example: Place Express Order
```bash
curl -X POST http://localhost:8003/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "items": [{"id": 2, "qty": 1}], "order_type": "express", "total_amount": 1199.99}'
# Response:
{
  "order_id": "A3F2B1",
  "priority": 1,
  "queue_position": 1,
  "dsa": "Min Heap — O(log n) insertion"
}
```

---

## Recommendation Service (Port 8004)

| Method | Endpoint | Description | DSA |
|--------|----------|-------------|-----|
| GET | `/health` | Health check | — |
| GET | `/recommendations/{product_id}?depth=2` | Get BFS recommendations | **Graph BFS** |
| POST | `/graph/edge` | Add product relationship | Graph |
| GET | `/graph/stats` | Graph metrics | Graph BFS |

### Example: Get Recommendations
```bash
curl http://localhost:8004/recommendations/1?depth=2
# Response:
{
  "product_id": 1,
  "depth": 2,
  "recommended_ids": [2, 3, 4, 5],
  "count": 4,
  "dsa": "Graph BFS",
  "complexity": "O(V+E)"
}
```

---

## Analytics Service (Port 8005)

| Method | Endpoint | Description | DSA |
|--------|----------|-------------|-----|
| GET | `/health` | Health check | — |
| GET | `/analytics/range?start=0&end=5` | Range sales query | **Segment Tree** |
| GET | `/analytics/dashboard` | Full monthly analytics | Segment Tree |
| GET | `/segment/stats` | Segment Tree metrics | Segment Tree |
| POST | `/discounts/optimize` | Optimal discount selection | **Dynamic Programming** |

### Example: Range Query
```bash
curl "http://localhost:8005/analytics/range?start=0&end=5"
# Response:
{
  "range": "Jan–Jun",
  "total_sales": 11050,
  "dsa": "Segment Tree",
  "complexity": "O(log n)"
}
```

### Example: DP Discount Optimization
```bash
curl -X POST http://localhost:8005/discounts/optimize \
  -H "Content-Type: application/json" \
  -d '{"discounts": [[10, 50], [8, 30], [15, 70]], "budget": 100}'
# Response:
{
  "max_conversion_increase": 18,
  "selected_discount_indices": [0, 1],
  "dsa": "Dynamic Programming (0/1 Knapsack)"
}
```
