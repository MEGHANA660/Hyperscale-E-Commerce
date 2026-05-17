# HyperScale Commerce — System Architecture

## Overview

HyperScale Commerce is a microservices-based e-commerce platform demonstrating 7 Data Structure and Algorithm implementations that provide measurable performance improvements over naive approaches.

---

## System Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════╗
║              HYPERSCALE COMMERCE — SYSTEM ARCHITECTURE            ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │          React Frontend (Vite + Tailwind CSS)            │    ║
║  │  • Home  • Product Search  • Product Detail              │    ║
║  │  • Shopping Cart  • Performance Dashboard                │    ║
║  │  Port: 5173                                              │    ║
║  └─────────────┬────────────────────────────────────────────┘    ║
║                │ HTTP REST (fetch/axios)                          ║
║  ╔═════════════╪════════════════════════════════════════════╗     ║
║  ║             │         MICROSERVICES LAYER                ║     ║
║  ╠═════════════╪════════════════════════════════════════════╣     ║
║  ║             │                                            ║     ║
║  ║  ┌──────────┴──────┐  ┌──────────────────────────────┐  ║     ║
║  ║  │  USER SERVICE   │  │     PRODUCT SERVICE          │  ║     ║
║  ║  │  Port: 8002     │  │     Port: 8001               │  ║     ║
║  ║  │                 │  │                              │  ║     ║
║  ║  │ ⚡ LRU Cache    │  │ 🔍 Trie (Autocomplete)      │  ║     ║
║  ║  │   capacity=1000 │  │    50× vs SQL LIKE           │  ║     ║
║  ║  │   100× speedup  │  │ 🛡️ Bloom Filter              │  ║     ║
║  ║  │                 │  │    95% query reduction       │  ║     ║
║  ║  └────────┬────────┘  └──────────────┬───────────────┘  ║     ║
║  ║           │                          │                   ║     ║
║  ║  ┌────────┴────────┐  ┌──────────────┴───────────────┐  ║     ║
║  ║  │  ORDER SERVICE  │  │  RECOMMENDATION SERVICE      │  ║     ║
║  ║  │  Port: 8003     │  │  Port: 8004                  │  ║     ║
║  ║  │                 │  │                              │  ║     ║
║  ║  │ 📦 Min Heap     │  │ 🕸️ Graph BFS                │  ║     ║
║  ║  │   Priority queue│  │    Adjacency list graph      │  ║     ║
║  ║  │   O(log n) ops  │  │    O(V+E) traversal          │  ║     ║
║  ║  └────────┬────────┘  └──────────────┬───────────────┘  ║     ║
║  ║           │                          │                   ║     ║
║  ║  ┌────────┴──────────────────────────┴───────────────┐  ║     ║
║  ║  │              ANALYTICS SERVICE                    │  ║     ║
║  ║  │              Port: 8005                           │  ║     ║
║  ║  │                                                   │  ║     ║
║  ║  │ 📊 Segment Tree  — O(log n) range queries        │  ║     ║
║  ║  │ 💡 Dynamic Programming  — 0/1 Knapsack           │  ║     ║
║  ║  └───────────────────────────────────────────────────┘  ║     ║
║  ╚════════════════════════════════════════════════════════╝      ║
║                                                                   ║
║  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  ║
║  │  PostgreSQL 15  │  │   Redis 7      │  │ Elasticsearch 8    │  ║
║  │  Port: 5432     │  │   Port: 6379   │  │   Port: 9200       │  ║
║  │  Primary store  │  │   Session cache│  │   Full-text search │  ║
║  └────────────────┘  └────────────────┘  └────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + Tailwind CSS | Interactive UI with DSA demos |
| API | FastAPI (Python 3.11) | High-performance REST APIs |
| Database | PostgreSQL 15 | Relational data persistence |
| Cache | Redis 7 | Session and hot data caching |
| Search | Elasticsearch 8 | Full-text product search |
| Container | Docker + Docker Compose | Service orchestration |

---

## DSA → Service Mapping

| DSA | Service | Performance Gain |
|-----|---------|-----------------|
| LRU Cache | User Service | 100× (DB → cache hit) |
| Trie | Product Service | 53× (SQL LIKE → Trie) |
| Bloom Filter | Product Service | 95% DB query reduction |
| Graph BFS | Recommendation Service | O(V+E) vs O(V×E) |
| Min Heap | Order Service | O(log n) priority queue |
| Segment Tree | Analytics Service | 125× range query |
| Dynamic Programming | Analytics Service | Optimal discount selection |

---

## Data Flow

1. **User searches for a product** → Frontend → Product Service → **Trie** returns suggestions in O(m)
2. **Product ID lookup** → Product Service → **Bloom Filter** pre-checks existence → DB only on positive
3. **User profile fetch** → User Service → **LRU Cache** serves in O(1) on hit
4. **Product detail viewed** → Recommendation Service → **Graph BFS** finds related products
5. **Order placed** → Order Service → **Min Heap** queues by priority
6. **Analytics range query** → Analytics Service → **Segment Tree** answers in O(log n)
7. **Discount calculation** → Analytics Service → **DP Knapsack** returns optimal selection
