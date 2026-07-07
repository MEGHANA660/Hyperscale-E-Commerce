# HyperScale Commerce — Phase I Architecture
### Bangalore Technological Institute (VTU) — Phase II Review 0

---

## 1. System Architecture Overview

HyperScale Commerce follows a **microservices architecture** where each business domain is an independent Python FastAPI service. The React frontend communicates with these services via REST APIs, and falls back to client-side mock data when services are offline (enabling demo-ready operation at all times).

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                               │
│  React 19 + Vite 8 SPA @ localhost:5173                         │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐   │
│  │  Home   │ │ Search │ │Product │ │  Cart  │ │Performance │   │
│  │  Page   │ │  Page  │ │ Detail │ │ / Order│ │ Dashboard  │   │
│  └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └─────┬──────┘   │
│       └──────────┴──────────┴──────────┴─────────────┘           │
│                         API Service Layer                         │
│              (api.js — with graceful fallback)                   │
└──────────────────────────────────────────────────────────────────┘
                              │ REST HTTP
         ┌────────────────────┼────────────────────┐
         │                    │                    │
┌────────▼──────┐  ┌─────────▼─────┐  ┌──────────▼──────┐
│product-service│  │  user-service │  │  order-service  │
│   Port 8001   │  │   Port 8002   │  │    Port 8003    │
│  FastAPI/Py   │  │  FastAPI/Py   │  │  FastAPI/Py     │
│  Trie + Bloom │  │  LRU Cache    │  │  Min Heap       │
└────────┬──────┘  └──────────┬────┘  └────────┬────────┘
         │                    │                 │
         └────────────┬───────┘                 │
                      │                         │
┌─────────────────────▼───┐     ┌───────────────▼────────┐
│ recommendation-service  │     │  analytics-service     │
│       Port 8004         │     │       Port 8005        │
│     FastAPI/Py          │     │     FastAPI/Py         │
│     Graph BFS           │     │  Segment Tree + DP     │
└─────────────────────────┘     └────────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
              ┌─────────▼─────────┐
              │    PostgreSQL DB   │
              │  (via Docker)     │
              └───────────────────┘
```

---

## 2. Microservices Detail

### 2.1 Product Service (Port 8001)
Responsible for the product catalog, search, and existence checks.

| Endpoint | Method | DSA Used | Description |
|---|---|---|---|
| `/search?q=<query>` | GET | **Trie** | Autocomplete search with prefix matching |
| `/products` | GET | — | List all products (paginated) |
| `/products/{id}` | GET | **Bloom Filter** | Fetch product by ID; Bloom Filter checks existence before DB |
| `/exists/{product_id}` | GET | **Bloom Filter** | Membership-only check without full product fetch |
| `/trie/stats` | GET | Trie | Returns Trie performance stats |
| `/bloom/stats` | GET | Bloom Filter | Returns Bloom Filter statistics |

**Data Store:** PostgreSQL `products` table  
**DSA Integration:** Trie indexes all product names and categories at startup. Bloom Filter pre-populated with all known product IDs.

---

### 2.2 User Service (Port 8002)
Responsible for user profiles and session management.

| Endpoint | Method | DSA Used | Description |
|---|---|---|---|
| `/users/{user_id}` | GET | **LRU Cache** | Fetch user profile; O(1) cache lookup before DB |
| `/login` | POST | — | Authenticate user credentials |
| `/cache/stats` | GET | LRU Cache | Returns cache hits, misses, ratio, capacity |

**Data Store:** PostgreSQL `users` table  
**DSA Integration:** LRU Cache (capacity 1,000) keeps recently active user records in memory. Cache hit avoids ~45ms PostgreSQL round-trip, replacing it with ~0.4ms in-memory O(1) lookup (112× speedup).

---

### 2.3 Order Service (Port 8003)
Responsible for order placement and dispatch queue management.

| Endpoint | Method | DSA Used | Description |
|---|---|---|---|
| `/orders` | POST | **Min Heap** | Place new order; enqueued by priority |
| `/queue` | GET | Min Heap | View current dispatch queue |
| `/queue/process` | POST | Min Heap | Process (pop) next order from heap |
| `/orders/{order_id}` | GET | — | Retrieve specific order details |
| `/heap/stats` | GET | Min Heap | Returns heap size and min priority |

**Data Store:** PostgreSQL `orders` table  
**DSA Integration:** Min Heap queue sorts orders: Express (priority=1) before Priority Delivery (priority=2) before Standard (priority=3). O(log n) push/pop ensures scalable scheduling.

---

### 2.4 Recommendation Service (Port 8004)
Responsible for "Customers Also Bought" product recommendations.

| Endpoint | Method | DSA Used | Description |
|---|---|---|---|
| `/recommendations/{product_id}?depth=2` | GET | **Graph BFS** | BFS traversal of product co-purchase graph |
| `/graph/edge` | POST | Graph BFS | Add a new product relationship edge |
| `/graph/stats` | GET | Graph BFS | Returns vertex/edge counts |

**Data Store:** In-memory adjacency list (PostgreSQL for persistence)  
**DSA Integration:** Products modeled as graph vertices, co-purchases as edges. BFS at depth=2 finds all products within 2 degrees of separation from the viewed product.

---

### 2.5 Analytics Service (Port 8005)
Responsible for sales analytics and discount computation.

| Endpoint | Method | DSA Used | Description |
|---|---|---|---|
| `/analytics/range?start=L&end=R` | GET | **Segment Tree** | O(log n) range sum query over sales data |
| `/analytics/dashboard` | GET | Segment Tree | Full dashboard data snapshot |
| `/discounts/optimize` | POST | **DP Knapsack** | Optimal discount subset selection |
| `/segment/stats` | GET | Segment Tree | Data point count and query performance |

**Data Store:** PostgreSQL `analytics` table (time-series sales)  
**DSA Integration:** 
- Segment Tree built over monthly sales array; any date-range sum query runs in O(log n).  
- 0/1 Knapsack DP optimises the discount portfolio for each customer's checkout budget.

---

### 2.6 Auxiliary Services

| Service | Role |
|---|---|
| `inventory-service` | Stock level tracking and depletion on orders |
| `notification-service` | Order confirmation and status notification dispatch |
| `main-service` | API Gateway / entry point (routing proxy) |

---

## 3. Database Schema

### PostgreSQL Tables (via Docker Compose)

```sql
-- products
CREATE TABLE products (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    price         NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    category      VARCHAR(100),
    rating        NUMERIC(3,2),
    stock         INTEGER DEFAULT 0,
    image_url     TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    role          VARCHAR(50) DEFAULT 'customer',
    address       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- orders
CREATE TABLE orders (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id),
    product_ids   INTEGER[],
    total_amount  NUMERIC(10,2),
    priority      INTEGER DEFAULT 3,  -- 1=Express, 2=Priority, 3=Standard
    status        VARCHAR(50) DEFAULT 'pending',
    created_at    TIMESTAMP DEFAULT NOW()
);
```

---

## 4. DSA Data Flow

### 4.1 Search Flow (Trie + Bloom Filter)
```
User types "iph"
     │
     ▼
Header Trie (client-side)
  search("iph") → [productId: 2, 4]  [O(m)]
     │
     ▼
Suggestions dropdown shown instantly
     │
     ▼  (on submit)
product-service /search?q=iph
  Trie.search("iph") → [2, 4]  [O(m) = O(3)]
     │
     ▼
Return matched products → rendered in Search page
```

### 4.2 Product Fetch Flow (LRU Cache)
```
User visits /product/3
     │
     ▼
ProductDetail.jsx: lruGet(3)
     ├── Cache HIT  → return in O(1), window.__lruHits++
     └── Cache MISS → MOCK.products.find(p=>p.id===3), window.__lruMisses++
                       insert into LRU Map (evict LRU if at capacity)
     │
     ▼
Performance Dashboard reflects updated hit/miss ratio
```

### 4.3 Order Placement Flow (Min Heap + DP)
```
User at Checkout
     │
     ▼
optimizeDiscounts(DISCOUNTS, budget)  [DP Knapsack O(n×W)]
  → returns optimal subset of coupons
     │
     ▼
User clicks "Place Order"
     │
     ▼
MinHeap.push(orderType.priority, orderData)  [O(log n)]
  + existing orders pushed for demonstration
     │
     ▼
Heap popped in priority order → window.__lastHeapQueue
     │
     ▼
Order confirmation page shows Min Heap queue sorted by priority
```

### 4.4 Recommendation Flow (Graph BFS)
```
User views product id=1 (MacBook Pro)
     │
     ▼
bfsRecommend(1, depth=2)  [O(V+E)]
  GRAPH[1] = [3, 11, 12]   ← depth 1 neighbors
  GRAPH[3] = [7, 1, 4]     ← depth 2 from node 3 (skip visited)
  GRAPH[11] = [12, 6, 1]   ← depth 2 from node 11
  GRAPH[12] = [11, 6, 9]   ← depth 2 from node 12
     │
     ▼
recIds = [3, 11, 12, 7, 4, 6, 9]  (unique, source excluded)
Products fetched and shown as "Customers also bought"
```

### 4.5 Analytics Flow (Segment Tree)
```
PerformanceDashboard mounts
     │
     ▼
SegmentTree(salesData)  [Build: O(n)]
  salesData = [120, 85, 200, 150, 300, 250, 180, 95, 320, 410, 290, 175]
     │
     ▼
User selects range Mar → Aug (indices 2 → 7)
     │
     ▼
segTree.query(2, 7)  [O(log 12)]
  → returns 1480 (sum of months Mar–Aug)
     │
     ▼
Result displayed in real-time without recomputing the full array
```

---

## 5. Frontend Architecture

### Component Tree
```
App.jsx
├── CartProvider (React Context)
│   └── WishlistProvider (React Context)
│       └── BrowserRouter
│           └── Layout.jsx
│               ├── Header.jsx
│               │   ├── Trie (client-side autocomplete)
│               │   └── Cart/Wishlist badge counts
│               ├── [Outlet — Page Routes]
│               │   ├── / → Home.jsx
│               │   ├── /search → ProductSearch.jsx
│               │   │   └── Trie (client-side search)
│               │   ├── /product/:id → ProductDetail.jsx
│               │   │   ├── LRU Cache (client-side)
│               │   │   └── Graph BFS (client-side)
│               │   ├── /cart → ShoppingCart.jsx
│               │   │   ├── Min Heap (client-side)
│               │   │   └── DP Knapsack (client-side)
│               │   ├── /wishlist → Wishlist.jsx
│               │   ├── /profile → UserProfile.jsx
│               │   └── /performance → PerformanceDashboard.jsx
│               │       └── Segment Tree (client-side)
│               └── Footer.jsx
```

### State Management
- **CartContext:** Manages cart items, quantities, running total
- **WishlistContext:** Manages wishlisted product IDs
- Both use React Context API with `useState` — no external state library

### API Service Layer (`services/api.js`)
- `productApi` — Product Service endpoints (8001)
- `userApi` — User Service endpoints (8002)
- `orderApi` — Order Service endpoints (8003)
- `recApi` — Recommendation Service endpoints (8004)
- `analyticsApi` — Analytics Service endpoints (8005)
- `MOCK` — Fallback data (20 products, mock stats) used when backend offline

---

## 6. Cache Architecture

| Layer | Type | Scope | TTL / Policy |
|---|---|---|---|
| Browser LRU Cache | JavaScript Map | Client-side product fetch | Capacity 10, LRU eviction |
| Backend LRU Cache | Python doubly-linked HashMap | Per user-service instance | Capacity 1000, LRU eviction |
| Bloom Filter | Bit array (Python) | Product existence pre-check | Static (populated at startup) |

---

## 7. Deployment Architecture

### Docker Compose Services
```yaml
services:
  product-service:   port 8001
  user-service:      port 8002
  order-service:     port 8003
  recommendation-service: port 8004
  analytics-service: port 8005
  inventory-service: (auxiliary)
  notification-service: (auxiliary)
  main-service: (gateway)
  postgres: (shared DB)
```

### Frontend (Standalone — no Docker required)
```
cd frontend
npm install
npm run dev    → http://localhost:5173
npm run build  → dist/ (production bundle)
```

### Full Stack Start
```bash
# Option 1: Docker Compose (all services)
docker-compose up --build

# Option 2: Frontend only (demo mode with mock data)
cd frontend && npm run dev
```

---

## 8. Shared DSA Module

All DSA implementations reside in `shared/dsa/` and are imported by all backend services:

```
shared/
├── __init__.py
└── dsa/
    ├── __init__.py
    ├── lru_cache.py      ← LRUCache class
    ├── trie.py           ← Trie + TrieNode classes
    ├── bloom_filter.py   ← BloomFilter class
    ├── min_heap.py       ← MinHeap class
    ├── graph_bfs.py      ← ProductGraph class
    ├── segment_tree.py   ← SegmentTree class
    ├── discount_dp.py    ← optimize_discounts() function
    ├── test_lru.py       ← Unit tests
    ├── test_trie.py      ← Unit tests
    └── benchmark_trie.py ← Trie benchmarks
```

Client-side JavaScript mirrors of all 7 algorithms also exist directly within the React component files, enabling full DSA demonstrations without any backend dependency.
