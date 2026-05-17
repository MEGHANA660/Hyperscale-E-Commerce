/**
 * API Service Layer for HyperScale Commerce
 * Connects to FastAPI microservices running on localhost
 */

const SERVICES = {
  products: 'http://localhost:8001',
  users:    'http://localhost:8002',
  orders:   'http://localhost:8003',
  recs:     'http://localhost:8004',
  analytics:'http://localhost:8005',
}

// Generic fetch helper with error handling
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (error) {
    console.error(`[API Error] ${url}:`, error.message)
    throw error
  }
}

// ─── Product Service ──────────────────────────────────────────────────────────
export const productApi = {
  /** Trie-based autocomplete search */
  search: (query) =>
    apiFetch(`${SERVICES.products}/search?q=${encodeURIComponent(query)}`),

  /** Get all products with pagination */
  getAll: (page = 1, limit = 20) =>
    apiFetch(`${SERVICES.products}/products?page=${page}&limit=${limit}`),

  /** Get single product by ID (LRU Cache backed) */
  getById: (id) =>
    apiFetch(`${SERVICES.products}/products/${id}`),

  /** Bloom Filter existence check */
  checkExists: (productId) =>
    apiFetch(`${SERVICES.products}/exists/${productId}`),

  /** Get Trie benchmark stats */
  getTrieStats: () =>
    apiFetch(`${SERVICES.products}/trie/stats`),

  /** Get Bloom Filter stats */
  getBloomStats: () =>
    apiFetch(`${SERVICES.products}/bloom/stats`),
}

// ─── User Service ─────────────────────────────────────────────────────────────
export const userApi = {
  /** Get user profile (LRU Cache backed) */
  getProfile: (userId) =>
    apiFetch(`${SERVICES.users}/users/${userId}`),

  /** Get LRU Cache metrics */
  getLruStats: () =>
    apiFetch(`${SERVICES.users}/cache/stats`),

  /** Create/login user */
  login: (credentials) =>
    apiFetch(`${SERVICES.users}/login`, { method: 'POST', body: JSON.stringify(credentials) }),
}

// ─── Order Service ────────────────────────────────────────────────────────────
export const orderApi = {
  /** Place a new order (queued via Min Heap) */
  placeOrder: (orderData) =>
    apiFetch(`${SERVICES.orders}/orders`, { method: 'POST', body: JSON.stringify(orderData) }),

  /** Get order queue status */
  getQueue: () =>
    apiFetch(`${SERVICES.orders}/queue`),

  /** Process next order from Min Heap */
  processNext: () =>
    apiFetch(`${SERVICES.orders}/queue/process`, { method: 'POST' }),

  /** Get order by ID */
  getOrder: (orderId) =>
    apiFetch(`${SERVICES.orders}/orders/${orderId}`),

  /** Get Min Heap stats */
  getHeapStats: () =>
    apiFetch(`${SERVICES.orders}/heap/stats`),
}

// ─── Recommendation Service ───────────────────────────────────────────────────
export const recApi = {
  /** Graph BFS recommendations for a product */
  getRecommendations: (productId, depth = 2) =>
    apiFetch(`${SERVICES.recs}/recommendations/${productId}?depth=${depth}`),

  /** Add product relationship edge */
  addEdge: (p1, p2) =>
    apiFetch(`${SERVICES.recs}/graph/edge`, {
      method: 'POST',
      body: JSON.stringify({ product_id_1: p1, product_id_2: p2 }),
    }),

  /** Get graph stats */
  getGraphStats: () =>
    apiFetch(`${SERVICES.recs}/graph/stats`),
}

// ─── Analytics Service ────────────────────────────────────────────────────────
export const analyticsApi = {
  /** Query range sales using Segment Tree */
  queryRange: (start, end) =>
    apiFetch(`${SERVICES.analytics}/analytics/range?start=${start}&end=${end}`),

  /** Get all analytics data */
  getDashboard: () =>
    apiFetch(`${SERVICES.analytics}/analytics/dashboard`),

  /** Get Segment Tree stats */
  getSegmentStats: () =>
    apiFetch(`${SERVICES.analytics}/segment/stats`),

  /** Get DP discount optimization result */
  optimizeDiscounts: (payload) =>
    apiFetch(`${SERVICES.analytics}/discounts/optimize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

// ─── Mock Data (fallback when backend is offline) ──────────────────────────────
export const MOCK = {
  products: [
    { id: 1, name: 'MacBook Pro 16"', price: 2499.99, category: 'Laptops', rating: 4.8, stock: 50, image_url: null },
    { id: 2, name: 'iPhone 15 Pro Max', price: 1199.99, category: 'Smartphones', rating: 4.9, stock: 120, image_url: null },
    { id: 3, name: 'Sony WH-1000XM5', price: 349.99, category: 'Audio', rating: 4.7, stock: 200, image_url: null },
    { id: 4, name: 'iPad Pro 12.9"', price: 1099.99, category: 'Tablets', rating: 4.6, stock: 80, image_url: null },
    { id: 5, name: 'Samsung Galaxy S24 Ultra', price: 1299.99, category: 'Smartphones', rating: 4.7, stock: 90, image_url: null },
    { id: 6, name: 'Dell XPS 15', price: 1899.99, category: 'Laptops', rating: 4.5, stock: 40, image_url: null },
    { id: 7, name: 'AirPods Pro 2', price: 249.99, category: 'Audio', rating: 4.8, stock: 300, image_url: null },
    { id: 8, name: 'Apple Watch Ultra 2', price: 799.99, category: 'Wearables', rating: 4.7, stock: 60, image_url: null },
    { id: 9, name: 'NVIDIA RTX 4090', price: 1599.99, category: 'GPU', rating: 4.9, stock: 15, image_url: null },
    { id: 10, name: 'LG OLED C3 65"', price: 1799.99, category: 'TVs', rating: 4.8, stock: 25, image_url: null },
    { id: 11, name: 'Logitech MX Master 3S', price: 99.99, category: 'Peripherals', rating: 4.7, stock: 400, image_url: null },
    { id: 12, name: 'Keychron Q1 Pro', price: 199.99, category: 'Peripherals', rating: 4.6, stock: 150, image_url: null },
  ],

  searchResults: (query) => {
    const q = query.toLowerCase()
    return MOCK.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  },

  recommendations: (productId) => {
    const edges = {
      1: [3, 11, 12], 2: [7, 8, 5], 3: [7, 1, 4],
      4: [2, 7, 1], 5: [7, 8, 2], 6: [11, 12, 9],
      7: [2, 3, 8], 8: [2, 5, 7], 9: [6, 11, 12],
      10: [9], 11: [12, 6, 1], 12: [11, 6, 9],
    }
    const ids = edges[productId] || [1, 2, 3]
    return MOCK.products.filter(p => ids.includes(p.id))
  },

  lruStats: { hits: 847, misses: 153, ratio: 84.7, capacity: 100, size: 87 },
  trieStats: { words: 1247, nodes: 4832, avg_search_ms: 0.12, sql_baseline_ms: 6.4 },
  bloomStats: { size: 95850, hash_count: 4, queries_blocked: 9524, total_queries: 10000 },
  heapStats: { size: 23, min_priority: 1, operations: 1892 },
  segmentStats: { data_points: 1000, range_queries: 4521, avg_query_ms: 0.08 },
}
