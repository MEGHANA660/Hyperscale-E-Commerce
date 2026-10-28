import { CATALOG } from '../data/catalog'
/**
 * API Service Layer for HyperScale Commerce
 * Connects to FastAPI microservices running on localhost
 */

const SERVICES = {
  products: 'http://localhost:5002',
  users:    'http://localhost:5001',
  orders:   'http://localhost:5004',
  recs:     'http://localhost:5005',
  analytics:'http://localhost:5006',
  auth:     'http://localhost:5001',
}

// ─── Login session (token issued by user-service) ─────────────────────────────
const TOKEN_KEY = 'hsc_token'
const USER_KEY = 'hsc_user'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function saveSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch { /* storage unavailable: session lasts until reload */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* ignore */ }
  window.dispatchEvent(new Event('hsc-logout'))
}

// Generic fetch helper with error handling
async function apiFetch(url, options = {}) {
  try {
    const token = getToken()
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
    if (res.status === 401 && token) {
      clearSession() // token expired or rejected: send the shopper back to the login page
      throw new Error('Your session expired. Please log in again.')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (error) {
    console.warn(`[API Error] ${url}:`, error.message)
    if (error instanceof TypeError) {
      // fetch() throws a bare TypeError ("Failed to fetch") when the server cannot be reached at all.
      throw new Error("Can't reach the server. Make sure the backend is running, then try again.")
    }
    throw error
  }
}

// ─── Product Service ──────────────────────────────────────────────────────────
export const productApi = {
  /** Trie-based autocomplete suggestions (O(m) prefix) */
  autocomplete: (prefix) =>
    apiFetch(`${SERVICES.products}/products/autocomplete?prefix=${encodeURIComponent(prefix)}`),

  /** Search products (Trie prefix + DB / Elasticsearch) */
  search: (query, category = '') =>
    apiFetch(`${SERVICES.products}/products/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`),

  /** Get all products with pagination & category filter */
  getAll: (page = 1, limit = 50, category = '') =>
    apiFetch(`${SERVICES.products}/products?page=${page}&limit=${limit}&category=${encodeURIComponent(category)}`),

  /** Get single product by ID (guarded by Bloom Filter & Redis) */
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

  /** Atomic stock reservation */
  reserveStock: (productId, quantity = 1) =>
    apiFetch(`${SERVICES.products}/products/${productId}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    }),
}

// ─── User Service ─────────────────────────────────────────────────────────────
export const userApi = {
  /** Get user profile (LRU Cache backed) */
  getProfile: (userId) =>
    apiFetch(`${SERVICES.users}/users/${userId}`),

  /** Get current user profile */
  getMe: () =>
    apiFetch(`${SERVICES.users}/users/me`),

  /** Get LRU Cache metrics */
  getLruStats: () =>
    apiFetch(`${SERVICES.users}/cache/stats`),

  /** Login user */
  login: (credentials) =>
    apiFetch(`${SERVICES.users}/users/login`, { method: 'POST', body: JSON.stringify(credentials) }),
}

// ─── Order Service ────────────────────────────────────────────────────────────
export const orderApi = {
  /** Place a new order (queued via Min Heap, atomic stock reserve) */
  placeOrder: (orderData, idempotencyKey = null) => {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
    return apiFetch(`${SERVICES.orders}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    })
  },

  /** Get customer orders history (for My Orders) */
  getUserOrders: (userId) =>
    apiFetch(`${SERVICES.orders}/orders/user/${userId}`),

  /** Get order queue status */
  getQueue: () =>
    apiFetch(`${SERVICES.orders}/orders/queue`),

  /** Process next order from Min Heap */
  processNext: () =>
    apiFetch(`${SERVICES.orders}/orders/queue/process`, { method: 'POST' }),

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
  // One catalog for the whole app (generated by tools/build_catalog.py, the same
  // data seed_db.py loads into the database).
  products: CATALOG.map(p => ({ ...p, image_url: p.image || null })),

  // A few well-rated items from different categories (cart "you might also like").
  popular: (n = 4) => {
    const seen = new Set()
    const picks = []
    const ranked = [...MOCK.products].sort((x, y) => (y.sold ?? 0) - (x.sold ?? 0))
    for (const p of ranked) {
      if (!seen.has(p.category)) {
        seen.add(p.category)
        picks.push(p)
      }
      if (picks.length === n) break
    }
    return picks
  },

  searchResults: (query) => {
    const q = query.toLowerCase()
    return MOCK.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  },

  // Items from the same category, starting after the current product.
  recommendations: (productId) => {
    const all = MOCK.products
    const me = all.find(p => p.id === productId)
    if (!me) return MOCK.popular(4)
    const same = all.filter(p => p.category === me.category)
    const i = same.findIndex(p => p.id === productId)
    return [1, 2, 3, 4].map(k => same[(i + k) % same.length]).filter(p => p.id !== productId)
  },

  lruStats: { hits: 847, misses: 153, ratio: 84.7, capacity: 100, size: 87 },
  trieStats: { words: 1247, nodes: 4832, avg_search_ms: 0.12, sql_baseline_ms: 6.4 },
  bloomStats: { size: 95850, hash_count: 4, queries_blocked: 9524, total_queries: 10000 },
  heapStats: { size: 23, min_priority: 1, operations: 1892 },
  segmentStats: { data_points: 1000, range_queries: 4521, avg_query_ms: 0.08 },
}
