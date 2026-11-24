HyperScale Commerce

An e-commerce microservices platform that applies classic data structures and algorithms to concrete shop bottlenecks (search, queueing, caching, recommendations, analytics, discounts) and measures them against naive versions. Built with FastAPI services, a React + Vite + Tailwind storefront, PostgreSQL 15 and Redis 7, run with Docker Compose.

Payments are simulated (test mode). There is no real payment gateway and no real money.

🏗️ Architecture

The storefront (React) calls the FastAPI services over HTTP with a JWT. Services own their own data; they talk to each other through APIs, not each other's tables.

Service	Host port	What it owns	DSA used
Product	5002	Catalogue and stock (atomic reserve / release)	Trie, Bloom filter
User	5001	Accounts, login (bcrypt + JWT), profiles	LRU cache
Order	5004	Order lifecycle, checkout saga, fulfilment queue	Min-Heap
Payment	5010	Simulated charges, idempotency, refunds	none
Recommendation	5005	"Customers also bought"	Graph BFS
Analytics	5006	Revenue reports, discount optimiser	Segment tree, 0/1 knapsack

Checkout (saga): the Order service saves the order as pending, reserves stock for every item through the Product service (atomic conditional UPDATE), then charges through the Payment service (idempotency key), then marks the order paid. If any step fails, stock is released and the order is cancelled or failed. Orders stuck mid-way are expired by a background sweep.

The repository also contains earlier prototype folders (cart_service, auth-service, inventory-service, notification-service, review_service, main-service). They are not part of the checkout flow above; stock is owned by the Product service.

💻 Tech Stack
Frontend: React 19, Vite, Tailwind CSS v4, Lucide icons
Backend: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0
Data: PostgreSQL 15, Redis 7
Run: Docker Compose
Tests: pytest (backend), Vitest (frontend)
CI: GitHub Actions
📊 Data Structures & Algorithms
DSA	Service	Where it is used	Complexity
Trie	Product	Search autocomplete	O(m) prefix lookup
Bloom filter	Product	Skip the database for product IDs that cannot exist	O(k) check, no false negatives
LRU cache	User	Fast profile lookups with eviction	O(1) get/put
Min-Heap	Order	Fulfilment order: Express, then Priority, then Standard	O(log n) push/pop
Graph BFS	Recommendation	Related products from co-purchases	O(V+E)
Segment tree	Analytics	Revenue over a date range	O(log n) range query
0/1 knapsack (DP)	Analytics / cart	Best set of discounts under a budget	O(N·W)
Benchmarks

Measured in-memory with benchmarks/performance_tests.py; raw numbers are in benchmarks/results.csv. They compare each structure with a naive version on synthetic data, so treat them as micro-benchmarks, not production load tests.

DSA	Naive	Optimised	Speed-up
Trie search	linear scan	Trie	about 115x
Min-Heap	sort	heap pop	about 17x
Segment tree	linear sum	range query	about 9x
Graph BFS	naive O(V·E)	BFS	about 6x

The Bloom filter row is a count (about 54% of lookups for invalid IDs avoided the database), not a speed-up. The LRU-cache row uses fixed illustrative timings (an estimate, not a measurement).

✅ Work Completed

Checkout and payments

Saga checkout with atomic stock reservation, idempotency keys and compensation (stock released on failure).
Card (Luhn, expiry, CVV checks) or UPI, followed by a simulated OTP step (123456). The OTP and approval exist only in the frontend; there is no backend OTP check. Card data never leaves the browser.
Cash on delivery is stored as cod_pending: it is confirmed and queued for delivery, but no charge is made. It can be cancelled without a refund.
Delivery options (Standard / Priority / Express) change the total; the free-delivery voucher is capped at ₹150.

Security and correctness

Passwords are hashed with bcrypt (legacy plain values are upgraded on first login).
JWT auth with customer, admin and service roles. Refunds and payment lookups need the service or admin role. POST /orders requires login and uses the user from the token.
The Order service checks the submitted total against current product prices from the Product service and rejects a total outside the range the cart's own discount and delivery rules allow (HTTP 422).
One successful payment per order (unique database index plus a 409 on a second attempt).
If a payment succeeds after the order service timed out, the order service looks it up and refunds it.
Rate limiting returns a clean HTTP 429.
The order queue is rebuilt from the database on restart.
A 50-buyer concurrency test (stock of 5) confirms exactly 5 orders succeed.

Catalogue and UI

158 products in 7 categories, generated from one source (tools/build_catalog.py). Each product shows a generated icon tile by default; a real photo saved as frontend/public/products/<id>.jpg is used when present.
Search with category and price filters, sorting and paging; cart with the knapsack discount optimiser; login, profile with order history and wishlist.
If the backend is unreachable, the storefront shows built-in demo data and a red "offline" banner.

Quality

204 backend tests (python -m pytest tests -q).
11 frontend unit tests (cd frontend && npm test): image fallback, session handling, offline detection.

CI/CD (.github/workflows/ci-cd.yml)

On every push to main and on pull requests: backend tests on Python 3.11, and a frontend job that runs npm ci, npm test and npm run build.
On push to main, after the tests pass: builds the service Docker images and pushes them to GitHub Container Registry (ghcr.io).
An SSH deploy job is written but off by default; it runs only when the repository variable DEPLOY_ENABLED=true and the deploy secrets are set. No server is currently deployed.
▶️ Run it
bash
docker compose up -d --build        # backend services, Postgres, Redis
cd frontend && npm install && npm run dev

Test card for the simulated payment: 4242 4242 4242 4242, expiry 12/30, CVV 123, OTP 123456.

🔜 Known Limitations
Payments are simulated; there is no real gateway.
The server range-checks order totals; it does not recompute exact discounts.
If a payment succeeds after a timeout and the follow-up lookup also fails, the problem is only logged.
Real product photos are still to be added for most products.
Home page category tiles use external stock images.
Frontend tests are unit tests only; there are no component or end-to-end tests.
The LRU-cache benchmark row is an estimate.