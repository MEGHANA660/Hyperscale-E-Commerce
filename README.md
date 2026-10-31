# HyperScale Commerce

A high-performance e-commerce microservices platform demonstrating that **algorithmic optimization delivers measurable gains over naive implementations**. Built with 5 core FastAPI services, 7 Data Structures & Algorithms, a React + Vite + Tailwind frontend ("CartBlitz"), PostgreSQL 15, and Redis 7.

---

## 🏗️ Architecture (5 Core Services)

The architecture is centered on 5 domain-driven microservices, each embedding a specific Data Structure & Algorithm (DSA) to solve a concrete e-commerce bottleneck:

1. **Product Service (Port 8001 / 5002)**: Product catalog and inventory ownership.
   - **Trie**: O(m) prefix autocomplete search (vs. SQL `LIKE`).
   - **Bloom Filter**: O(k) existence pre-check guarding database queries for invalid product IDs.
   - **Atomic Stock Reservation**: Concurrency-safe atomic conditional update preventing flash-sale overselling.
2. **User Service (Port 8002 / 5001)**: Customer and admin profile management.
   - **LRU Cache (Capacity 1,000)**: O(1) in-memory profile retrieval with hit/miss tracking.
3. **Order Service (Port 8003 / 5004)**: Order lifecycle and fulfillment.
   - **Min Heap**: O(log n) order priority queue (Express > Priority > Standard fulfillment).
   - **Idempotent Payment Sandbox**: Idempotency-Key deduplication and robust order state machine.
4. **Recommendation Service (Port 8004 / 5005)**: Co-purchase graph recommendations.
   - **Graph BFS**: O(V+E) traversal for "Customers Also Bought" recommendations.
5. **Analytics Service (Port 8005 / 5006)**: Sales reporting and promotion optimization.
   - **Segment Tree**: O(log n) range query for date-range revenue analytics.
   - **0/1 Knapsack (Dynamic Programming)**: Optimal discount allocation under a strict marketing budget.

*Note on legacy scaffold services:* The repository contains prototype folders (`cart_service`, `payment_service`, `inventory-service`, `auth-service`, `notification-service`, `review_service`, `main-service`) created during early scaffolding. In accordance with the system design in `ARCHITECTURE.md`, inventory is owned strictly by the Product service, checkout & payment sandbox are owned by the Order service, and auth is handled centrally.

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons (Port 5173)
- **Backend Services**: FastAPI, Python 3.11, Pydantic v2, SQLAlchemy 2.0
- **Data Stores**: PostgreSQL 15, Redis 7
- **Orchestration**: Docker Compose
- **Testing**: pytest, pytest-asyncio

---

## 📊 7 Data Structures & Algorithms (DSA Mapping)

| DSA | Service | Real Feature Use Case | Theoretical Complexity |
|---|---|---|---|
| **Trie** | Product Service | Search bar autocomplete dropdown | O(m) prefix lookup vs O(N) scan |
| **Bloom Filter** | Product Service | Pre-DB product ID existence guard | O(k) hash check; 0 false negatives |
| **LRU Cache** | User Service | Fast user profile session lookup | O(1) get/put with capacity eviction |
| **Min Heap** | Order Service | Priority fulfillment processing | O(log n) push/pop priority queue |
| **Graph BFS** | Recommendation Service | "Customers also bought" related items | O(V + E) breadth-first search |
| **Segment Tree** | Analytics Service | Revenue queries across date ranges | O(log n) range query vs O(N) scan |
| **0/1 Knapsack DP** | Analytics Service | Maximum discount value under budget | O(N * W) pseudo-polynomial time |

---

## ✅ Work Completed

**Checkout & payments**
- Real order flow: stock is reserved for every item atomically, then payment, then confirmation; on failure the stock is released and the order cancelled (saga with compensation and idempotency keys).
- Payment UI asks for card (Luhn, expiry, CVV checks) or UPI details and a simulated OTP step before "order placed". The OTP (`123456`) and the approval are a frontend simulation in test mode: no real payment gateway, no real money, and no backend OTP verification. Card data never leaves the browser.
- Delivery options (Standard / Priority / Express) change the total correctly; the free-delivery voucher is capped at ₹150.
- Cash on delivery supported.

**Catalogue & images**
- 158 unique products in 7 categories with realistic prices (from the affordable range up), generated from one source (`tools/build_catalog.py` → `data/products.json` + `frontend/src/data/catalog.js`).
- Every product shows a relevant illustration (icon + name) by default. Real photos can be added by saving them as `frontend/public/products/<product id>.jpg`; the site uses the photo when present and falls back to the illustration. Photos are shown uncropped.
- Search page: category and price filters, sorting, "Show more" paging.

**Accounts & UI**
- Login, logout (header and profile page), profile page with real order history and wishlist (demo orders are opt-in via `SEED_DEMO_ORDERS=1`).
- Full-width responsive layouts, consistent fonts and spacing; an error boundary shows a message instead of a blank page.
- Discount optimiser (0/1 knapsack) chooses the best vouchers in the cart.

**Quality**
- 187 backend tests passing (`python -m pytest -q`).
- The frontend has no automated test suite in this repository yet (checked manually).

## 🔜 Known Limitations / Next Steps
- Real product photos still to be added for most items.
- Cash-on-delivery orders are stored as "paid" in the backend.
- Plain-text passwords in the user service (hash them before any real deployment).
- Home page category tiles show placeholder counts and external stock images.
- Tracked `.pyc` files should be removed from git; `benchmarks/results.csv` and `benchmarks/comparison_report.md` / `metrics.json` disagree (the report is dated May 2025). The LRU-cache row in the CSV uses fixed illustrative timings (45,000 µs DB vs 400 µs cache), not a live measurement, so treat it as an estimate.
- No AWS/cloud deployment is included; the stack runs locally with Docker Compose (Kubernetes manifests are in `k8s/`).
- Real payment-gateway integration and server-side OTP verification are not implemented.
