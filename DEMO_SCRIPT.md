# Demo Script — HyperScale Commerce
## Step-by-Step Faculty Demonstration Guide

**Total Time:** ~15 minutes  
**Setup:** All services running via Docker Compose

---

## Pre-Demo Checklist

```bash
# Start all services
cd hyperscale-commerce
docker-compose up -d

# Verify all healthy
python smoke_test.py

# Start frontend
cd frontend && npm run dev
# Open: http://localhost:5173
```

---

## Step 1: Home Page (2 min)

**Navigate to:** `http://localhost:5173`

**Talking Points:**
- "This is HyperScale Commerce — a production-style e-commerce platform"
- "All 7 DSA implementations are live in the backend microservices"
- "Notice the stats: 7 DSAs, 5 Microservices, 28+ API endpoints, 100× max speedup"
- Scroll to the DSA grid and explain each algorithm's role

---

## Step 2: Product Search — Trie Demo (3 min)

**Navigate to:** Search (top nav)

**Demo actions:**
1. Type `"mac"` slowly — watch suggestions appear instantly
2. Point out: `"Trie search: 0.12ms vs SQL LIKE: 6,400ms"`
3. Type `"son"` → Sony WH-1000XM5 appears
4. Explain: "The Trie is a prefix tree — each character traversal is O(1)"

**Key stat to highlight:** **53× speedup** over SQL LIKE queries

**Faculty question to answer:** _"Why not just use Elasticsearch?"_
- "Elasticsearch is great for full-text, but Trie is O(m) where m = prefix length — it doesn't degrade as the catalog grows"

---

## Step 3: Product Detail — LRU Cache + Graph BFS (3 min)

**Click any product → Product Detail page**

**Demo actions:**
1. First click → badge shows **"LRU Cache MISS"** → DB fetch
2. Go back → click same product again → badge shows **"LRU Cache HIT"** (0.4ms!)
3. Show the BFS steps section: "Start → Depth 1 neighbors → Depth 2 neighbors"
4. Scroll to "Customers Also Bought" — these are the BFS recommendations

**Key stats:**
- LRU Cache: **100× speedup** (45ms DB → 0.4ms cache)
- Graph BFS: **O(V+E)** vs naive O(V×E) multi-join

---

## Step 4: Shopping Cart — Min Heap + DP (3 min)

**Add 2-3 products to cart → go to Cart page**

**Demo actions:**
1. Show the 3 order types: Express (Priority 1), Premium (Priority 2), Standard (Priority 3)
2. Select "Express" and show: "Min Heap places this at the front of the queue"
3. Show DP Discounts panel: "0/1 Knapsack selected X discounts for max +Y% conversion"
4. Place the order → show the Min Heap processing queue (Express first!)

**Key concepts:**
- Min Heap: O(log n) priority insertion vs O(n log n) sort
- DP: Globally optimal discount selection (better than greedy)

---

## Step 5: Performance Dashboard (4 min)

**Navigate to:** Performance (top nav)

**Demo actions:**
1. Walk through the performance bar chart — highlight 100×, 53×, 125× bars
2. Click the **Segment Tree** tab → show 125× speedup
3. Demo the interactive range query: change start/end month → sum updates live
4. Click each DSA tab and read the comparison panel

**Key headline numbers:**
| DSA | Improvement |
|-----|------------|
| LRU Cache | **100×** faster |
| Trie | **53×** faster |
| Bloom Filter | **95%** DB reduction |
| Segment Tree | **125×** faster |

---

## Backup CLI Demo (if browser issues)

```bash
# Test Trie search
curl "http://localhost:8001/search?q=mac"

# Test LRU cache stats
curl http://localhost:8002/cache/stats

# Test Graph BFS
curl http://localhost:8004/recommendations/1?depth=2

# Test Segment Tree
curl "http://localhost:8005/analytics/range?start=0&end=5"

# Run all benchmarks
python benchmarks/performance_tests.py
```

---

## Common Faculty Questions

**Q: Is the LRU Cache thread-safe?**  
A: The current implementation is single-process. In production, Redis would serve as a distributed LRU cache.

**Q: What's the false positive rate of the Bloom Filter?**  
A: Configured to 5% false positive rate with 0% false negatives. Tunable via `expected_elements` and `false_positive_rate` parameters.

**Q: How does the Segment Tree handle updates?**  
A: Point updates are O(log n). The tree propagates changes up to parent nodes automatically.

**Q: Why microservices instead of a monolith?**  
A: Each service scales independently. The recommendation service can be scaled horizontally without touching the order service.
