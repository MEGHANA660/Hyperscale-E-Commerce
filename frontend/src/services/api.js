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
    // --- Laptops (15 items) ---
    { id: 1, name: 'MacBook Pro 16"', price: 129999, originalPrice: 149999, category: 'Laptops', rating: 4.8, stock: 50, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    { id: 6, name: 'Dell XPS 15', price: 99999, originalPrice: 119999, category: 'Laptops', rating: 4.5, stock: 40, image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80' },
    { id: 21, name: 'ThinkPad X1 Carbon Gen 11', price: 115000, originalPrice: 135000, category: 'Laptops', rating: 4.7, stock: 35, image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80' },
    { id: 22, name: 'ASUS ROG Zephyrus G14', price: 145000, originalPrice: 165000, category: 'Laptops', rating: 4.9, stock: 15, image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80' },
    { id: 23, name: 'HP Spectre x360 14', price: 105000, originalPrice: 125000, category: 'Laptops', rating: 4.6, stock: 25, image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80' },
    { id: 24, name: 'Razer Blade 16', price: 220000, originalPrice: 245000, category: 'Laptops', rating: 4.8, stock: 10, image_url: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80' },
    { id: 25, name: 'LG Gram 17', price: 95000, originalPrice: 110000, category: 'Laptops', rating: 4.4, stock: 30, image_url: 'https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=800&q=80' },
    { id: 26, name: 'Acer Swift Edge 16', price: 85000, originalPrice: 99999, category: 'Laptops', rating: 4.3, stock: 45, image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80' },
    { id: 27, name: 'Microsoft Surface Laptop 5', price: 102000, originalPrice: 119999, category: 'Laptops', rating: 4.5, stock: 20, image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80' },
    { id: 28, name: 'Lenovo Legion Pro 7i', price: 185000, originalPrice: 199999, category: 'Laptops', rating: 4.8, stock: 12, image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
    { id: 29, name: 'Apple MacBook Air M3', price: 99900, originalPrice: 114900, category: 'Laptops', rating: 4.9, stock: 60, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    { id: 30, name: 'ASUS Zenbook Duo', price: 135000, originalPrice: 149999, category: 'Laptops', rating: 4.7, stock: 8, image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80' },
    { id: 31, name: 'Dell Inspiron 16 Plus', price: 79000, originalPrice: 89999, category: 'Laptops', rating: 4.2, stock: 50, image_url: 'https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=800&q=80' },
    { id: 32, name: 'HP Envy x360 15', price: 68000, originalPrice: 79999, category: 'Laptops', rating: 4.3, stock: 40, image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80' },
    { id: 33, name: 'Samsung Galaxy Book4 Pro', price: 125000, originalPrice: 139999, category: 'Laptops', rating: 4.6, stock: 18, image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80' },

    // --- Phones (15 items) ---
    { id: 2, name: 'iPhone 15 Pro', price: 79999, originalPrice: 89999, category: 'Phones', rating: 4.9, stock: 120, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80' },
    { id: 4, name: 'iPad Air', price: 54999, originalPrice: 64999, category: 'Phones', rating: 4.6, stock: 80, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80' },
    { id: 34, name: 'Samsung Galaxy S24 Ultra', price: 124999, originalPrice: 134999, category: 'Phones', rating: 4.8, stock: 95, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
    { id: 35, name: 'Google Pixel 8 Pro', price: 99999, originalPrice: 109999, category: 'Phones', rating: 4.7, stock: 55, image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },
    { id: 36, name: 'OnePlus 12', price: 64999, originalPrice: 69999, category: 'Phones', rating: 4.6, stock: 110, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
    { id: 37, name: 'iPhone 15 Plus', price: 89900, originalPrice: 94900, category: 'Phones', rating: 4.7, stock: 70, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80' },
    { id: 38, name: 'Samsung Galaxy Z Fold5', price: 154999, originalPrice: 164999, category: 'Phones', rating: 4.5, stock: 20, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
    { id: 39, name: 'Google Pixel 8a', price: 52999, originalPrice: 59999, category: 'Phones', rating: 4.4, stock: 85, image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },
    { id: 40, name: 'Xiaomi 14 Ultra', price: 99999, originalPrice: 119999, category: 'Phones', rating: 4.7, stock: 40, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
    { id: 41, name: 'Nothing Phone (2)', price: 39999, originalPrice: 44999, category: 'Phones', rating: 4.5, stock: 130, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
    { id: 42, name: 'OnePlus Open', price: 139999, originalPrice: 149999, category: 'Phones', rating: 4.6, stock: 25, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
    { id: 43, name: 'Motorola Edge 50 Ultra', price: 59999, originalPrice: 64999, category: 'Phones', rating: 4.3, stock: 65, image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },
    { id: 44, name: 'Samsung Galaxy S24+', price: 99999, originalPrice: 104999, category: 'Phones', rating: 4.6, stock: 80, image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' },
    { id: 45, name: 'iPhone 13', price: 52900, originalPrice: 59900, category: 'Phones', rating: 4.8, stock: 150, image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80' },
    { id: 46, name: 'Google Pixel Fold', price: 149999, originalPrice: 159999, category: 'Phones', rating: 4.2, stock: 15, image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },

    // --- Electronics (20 items) ---
    { id: 3, name: 'Sony Headphones', price: 14999, originalPrice: 19999, category: 'Electronics', rating: 4.7, stock: 200, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    { id: 7, name: 'Apple Watch Ultra 2', price: 69999, originalPrice: 79999, category: 'Electronics', rating: 4.7, stock: 60, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
    { id: 8, name: 'AirPods Pro 2', price: 19999, originalPrice: 24999, category: 'Electronics', rating: 4.8, stock: 300, image_url: 'https://images.unsplash.com/photo-1588449668338-d15168822481?auto=format&fit=crop&w=800&q=80' },
    { id: 9, name: 'Logitech MX Master 3S', price: 7999, originalPrice: 9999, category: 'Electronics', rating: 4.7, stock: 400, image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80' },
    { id: 10, name: 'Keychron Q1 Pro', price: 15999, originalPrice: 19999, category: 'Electronics', rating: 4.6, stock: 150, image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80' },
    { id: 11, name: 'Dell Monitor 27"', price: 24999, originalPrice: 29999, category: 'Electronics', rating: 4.5, stock: 100, image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },
    { id: 12, name: 'HP Laser Printer', price: 12999, originalPrice: 15999, category: 'Electronics', rating: 4.4, stock: 75, image_url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80' },
    { id: 47, name: 'Sony WH-1000XM5', price: 29999, originalPrice: 34999, category: 'Electronics', rating: 4.8, stock: 180, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    { id: 48, name: 'Bose QuietComfort Ultra', price: 35900, originalPrice: 39900, category: 'Electronics', rating: 4.7, stock: 95, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    { id: 49, name: 'Apple Watch Series 9', price: 41900, originalPrice: 45900, category: 'Electronics', rating: 4.7, stock: 130, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
    { id: 50, name: 'Samsung Galaxy Watch6', price: 29999, originalPrice: 32999, category: 'Electronics', rating: 4.5, stock: 160, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
    { id: 51, name: 'Sonos Era 300 Speaker', price: 44999, originalPrice: 49999, category: 'Electronics', rating: 4.6, stock: 45, image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80' },
    { id: 52, name: 'DJI Mini 4 Pro', price: 79999, originalPrice: 89999, category: 'Electronics', rating: 4.9, stock: 22, image_url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80' },
    { id: 53, name: 'GoPro Hero 12 Black', price: 37999, originalPrice: 42999, category: 'Electronics', rating: 4.6, stock: 80, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    { id: 54, name: 'Kindle Paperwhite 16GB', price: 17999, originalPrice: 19999, category: 'Electronics', rating: 4.8, stock: 250, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80' },
    { id: 55, name: 'Razer DeathAdder V3 Pro', price: 13999, originalPrice: 15999, category: 'Electronics', rating: 4.7, stock: 120, image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80' },
    { id: 56, name: 'Elgato Stream Deck MK.2', price: 14999, originalPrice: 16999, category: 'Electronics', rating: 4.8, stock: 60, image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80' },
    { id: 57, name: 'SteelSeries Arctis Nova Pro', price: 32999, originalPrice: 36999, category: 'Electronics', rating: 4.7, stock: 50, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    { id: 58, name: 'Anker 737 Power Bank', price: 9999, originalPrice: 11999, category: 'Electronics', rating: 4.6, stock: 300, image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80' },
    { id: 59, name: 'ASUS ROG Swift OLED', price: 89999, originalPrice: 99999, category: 'Electronics', rating: 4.9, stock: 15, image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },

    // --- Home & Living (15 items) ---
    { id: 5, name: 'Samsung TV 55"', price: 49999, originalPrice: 59999, category: 'Home & Living', rating: 4.8, stock: 25, image_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80' },
    { id: 13, name: 'Dyson V15 Detect', price: 42999, originalPrice: 52999, category: 'Home & Living', rating: 4.7, stock: 35, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
    { id: 14, name: 'Instant Pot Duo 7-in-1', price: 8999, originalPrice: 11999, category: 'Home & Living', rating: 4.6, stock: 90, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { id: 60, name: 'Dyson Purifier Hot+Cool', price: 56900, originalPrice: 62900, category: 'Home & Living', rating: 4.8, stock: 20, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
    { id: 61, name: 'Philips Hue Starter Kit', price: 14999, originalPrice: 17999, category: 'Home & Living', rating: 4.7, stock: 110, image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' },
    { id: 62, name: 'Nespresso Vertuo Pop', price: 15999, originalPrice: 18999, category: 'Home & Living', rating: 4.6, stock: 85, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { id: 63, name: 'iRobot Roomba j7+', price: 69999, originalPrice: 79999, category: 'Home & Living', rating: 4.5, stock: 15, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
    { id: 64, name: 'KitchenAid Stand Mixer', price: 55000, originalPrice: 59999, category: 'Home & Living', rating: 4.9, stock: 30, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { id: 65, name: 'Le Creuset Dutch Oven', price: 28000, originalPrice: 32000, category: 'Home & Living', rating: 4.8, stock: 40, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { id: 66, name: 'Ember Smart Travel Mug', price: 12999, originalPrice: 15999, category: 'Home & Living', rating: 4.4, stock: 60, image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' },
    { id: 67, name: 'Marshall Stanmore III', price: 41999, originalPrice: 45999, category: 'Home & Living', rating: 4.7, stock: 24, image_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80' },
    { id: 68, name: 'Blueair Blue Pure 411', price: 9999, originalPrice: 12999, category: 'Home & Living', rating: 4.3, stock: 130, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
    { id: 69, name: 'Breville Barista Express', price: 72000, originalPrice: 79999, category: 'Home & Living', rating: 4.9, stock: 12, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { id: 70, name: 'Fellow Stagg EKG Kettle', price: 18999, originalPrice: 21999, category: 'Home & Living', rating: 4.8, stock: 55, image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' },
    { id: 71, name: 'Herman Miller Aeron Chair', price: 125000, originalPrice: 145000, category: 'Home & Living', rating: 4.9, stock: 10, image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80' },

    // --- Fashion (20 items) ---
    { id: 15, name: 'Merino Wool Crewneck', price: 4999, originalPrice: 6999, category: 'Fashion', rating: 4.7, stock: 180, image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
    { id: 16, name: 'Premium Leather Jacket', price: 12999, originalPrice: 17999, category: 'Fashion', rating: 4.5, stock: 45, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
    { id: 17, name: 'Slim Fit Linen Trousers', price: 2999, originalPrice: 3999, category: 'Fashion', rating: 4.4, stock: 220, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
    { id: 18, name: 'Classic Canvas Sneakers', price: 3499, originalPrice: 4499, category: 'Fashion', rating: 4.6, stock: 310, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
    { id: 72, name: 'Cashmere Cable Knit Sweater', price: 8999, originalPrice: 11999, category: 'Fashion', rating: 4.8, stock: 60, image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
    { id: 73, name: 'Italian Leather Chelsea Boots', price: 14999, originalPrice: 18999, category: 'Fashion', rating: 4.7, stock: 35, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
    { id: 74, name: 'Tailored Wool Blend Blazer', price: 11999, originalPrice: 14999, category: 'Fashion', rating: 4.6, stock: 40, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
    { id: 75, name: 'Organic Cotton Denim Jacket', price: 4999, originalPrice: 5999, category: 'Fashion', rating: 4.5, stock: 95, image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
    { id: 76, name: 'Premium Silk Button-Up Shirt', price: 6499, originalPrice: 7999, category: 'Fashion', rating: 4.6, stock: 75, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
    { id: 77, name: 'Classic Double-Breasted Trench', price: 15999, originalPrice: 19999, category: 'Fashion', rating: 4.8, stock: 28, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
    { id: 78, name: 'Minimalist Leather Backpack', price: 9999, originalPrice: 12999, category: 'Fashion', rating: 4.7, stock: 50, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
    { id: 79, name: 'Pima Cotton Crewneck 3-Pack', price: 3499, originalPrice: 3999, category: 'Fashion', rating: 4.4, stock: 190, image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
    { id: 80, name: 'Waterproof Active Shell Jacket', price: 12999, originalPrice: 14999, category: 'Fashion', rating: 4.6, stock: 80, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
    { id: 81, name: 'French Terry Relaxed Hoodie', price: 4500, originalPrice: 5500, category: 'Fashion', rating: 4.5, stock: 120, image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
    { id: 82, name: 'Stretch Slim-Fit Chino Pants', price: 3999, originalPrice: 4999, category: 'Fashion', rating: 4.3, stock: 140, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
    { id: 83, name: 'Premium Wool Cashmere Scarf', price: 2999, originalPrice: 3999, category: 'Fashion', rating: 4.7, stock: 200, image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
    { id: 84, name: 'Linen Casual Short Sleeve', price: 2799, originalPrice: 3499, category: 'Fashion', rating: 4.4, stock: 160, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
    { id: 85, name: 'Suede Zip Bomber Jacket', price: 18999, originalPrice: 22999, category: 'Fashion', rating: 4.8, stock: 15, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
    { id: 86, name: 'Lightweight Daily Runners', price: 5999, originalPrice: 7999, category: 'Fashion', rating: 4.5, stock: 85, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
    { id: 87, name: 'Tailored Flat-Front Trousers', price: 4999, originalPrice: 5999, category: 'Fashion', rating: 4.6, stock: 110, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },

    // --- Beauty (20 items) ---
    { id: 19, name: 'Vitamin C Brightening Serum', price: 1299, originalPrice: 1799, category: 'Beauty', rating: 4.8, stock: 500, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 20, name: 'Luxury Rose Eau de Parfum', price: 3999, originalPrice: 5499, category: 'Beauty', rating: 4.7, stock: 140, image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=800&q=80' },
    { id: 88, name: 'Hyaluronic Acid Hydrating Gel', price: 1599, originalPrice: 1999, category: 'Beauty', rating: 4.7, stock: 320, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 89, name: 'Retinol Youth Renewal Cream', price: 4800, originalPrice: 5800, category: 'Beauty', rating: 4.8, stock: 110, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 90, name: 'Exfoliating BHA Liquid 2%', price: 2990, originalPrice: 3490, category: 'Beauty', rating: 4.6, stock: 150, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 91, name: 'Niacinamide Glow Serum 10%', price: 1899, originalPrice: 2299, category: 'Beauty', rating: 4.6, stock: 240, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 92, name: 'SPF 50 Mineral Tinted Shield', price: 1499, originalPrice: 1899, category: 'Beauty', rating: 4.5, stock: 400, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 93, name: 'Hydrating Milky Jelly Cleanser', price: 1299, originalPrice: 1599, category: 'Beauty', rating: 4.4, stock: 350, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 94, name: 'Luxury Oud Wood Scent Extra', price: 12500, originalPrice: 14500, category: 'Beauty', rating: 4.9, stock: 30, image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=800&q=80' },
    { id: 95, name: 'Lip Renewal Hydrating Balm', price: 899, originalPrice: 1199, category: 'Beauty', rating: 4.3, stock: 500, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 96, name: 'Vitamin E Hydrating Eye Cream', price: 1799, originalPrice: 2199, category: 'Beauty', rating: 4.5, stock: 180, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 97, name: 'Smoothing Keratin Hair Serum', price: 1499, originalPrice: 1899, category: 'Beauty', rating: 4.6, stock: 220, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 98, name: 'Charcoal Deep Detox Mask', price: 1199, originalPrice: 1499, category: 'Beauty', rating: 4.4, stock: 260, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 99, name: 'Rosewater Soothing Face Mist', price: 999, originalPrice: 1299, category: 'Beauty', rating: 4.5, stock: 310, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 100, name: 'Rejuvenating Jade Roller Set', price: 1599, originalPrice: 1999, category: 'Beauty', rating: 4.6, stock: 150, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 101, name: 'French Lavender Body Wash', price: 1299, originalPrice: 1599, category: 'Beauty', rating: 4.6, stock: 400, image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=800&q=80' },
    { id: 102, name: 'Organic Argan Hair Repair Oil', price: 1999, originalPrice: 2499, category: 'Beauty', rating: 4.8, stock: 190, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 103, name: 'Brightening Kaolin Clay Mask', price: 1399, originalPrice: 1799, category: 'Beauty', rating: 4.4, stock: 210, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 104, name: 'Peptide Barrier Recovery Cream', price: 3200, originalPrice: 3800, category: 'Beauty', rating: 4.7, stock: 120, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { id: 105, name: 'Nourishing Shea Butter Hand Cream', price: 799, originalPrice: 999, category: 'Beauty', rating: 4.6, stock: 450, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },

    // --- Accessories (15 items) ---
    { id: 106, name: 'Polarized Wayfarer Sunglasses', price: 4999, originalPrice: 5999, category: 'Accessories', rating: 4.6, stock: 150, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
    { id: 107, name: 'Minimalist Matte Slim Wallet', price: 2499, originalPrice: 2999, category: 'Accessories', rating: 4.5, stock: 240, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 108, name: 'Leather Travel Watch Roll', price: 5999, originalPrice: 7499, category: 'Accessories', rating: 4.7, stock: 60, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
    { id: 109, name: 'Premium Leather Key Organizer', price: 1899, originalPrice: 2499, category: 'Accessories', rating: 4.4, stock: 180, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 110, name: 'Solid Brass Cuff Bracelet', price: 3499, originalPrice: 4200, category: 'Accessories', rating: 4.3, stock: 95, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
    { id: 111, name: 'Wool Felt Laptop Sleeve', price: 2999, originalPrice: 3499, category: 'Accessories', rating: 4.6, stock: 130, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 112, name: 'Titanium Frame Reading Glasses', price: 4200, originalPrice: 4999, category: 'Accessories', rating: 4.5, stock: 80, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
    { id: 113, name: 'Premium Woven Canvas Belt', price: 1599, originalPrice: 1999, category: 'Accessories', rating: 4.2, stock: 210, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 114, name: 'Merino Wool Beanie Hat', price: 2199, originalPrice: 2799, category: 'Accessories', rating: 4.6, stock: 150, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
    { id: 115, name: 'Stainless Insulated Water Bottle', price: 2499, originalPrice: 2999, category: 'Accessories', rating: 4.7, stock: 320, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
    { id: 116, name: 'Leather Luggage Tag Set', price: 1299, originalPrice: 1599, category: 'Accessories', rating: 4.3, stock: 110, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 117, name: 'Solid Silver Signet Ring', price: 4500, originalPrice: 5500, category: 'Accessories', rating: 4.5, stock: 75, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' },
    { id: 118, name: 'Heavyweight Canvas Tote Bag', price: 1999, originalPrice: 2499, category: 'Accessories', rating: 4.4, stock: 280, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 119, name: 'Cashmere Travel Sleep Mask', price: 2799, originalPrice: 3299, category: 'Accessories', rating: 4.6, stock: 90, image_url: 'https://images.unsplash.com/photo-1627124765138-b64ec17730e5?auto=format&fit=crop&w=800&q=80' },
    { id: 120, name: 'Premium Windproof Umbrella', price: 3200, originalPrice: 3999, category: 'Accessories', rating: 4.5, stock: 115, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80' }
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
      21: [22, 23], 22: [21, 24], 34: [35, 36],
      35: [34, 37], 47: [48, 49], 48: [47, 50],
      60: [61, 62], 72: [73, 74], 88: [89, 90],
      106: [107, 108]
    }
    const ids = edges[productId] || [1, 2, 3, 4]
    return MOCK.products.filter(p => ids.includes(p.id))
  },

  lruStats: { hits: 847, misses: 153, ratio: 84.7, capacity: 100, size: 87 },
  trieStats: { words: 1247, nodes: 4832, avg_search_ms: 0.12, sql_baseline_ms: 6.4 },
  bloomStats: { size: 95850, hash_count: 4, queries_blocked: 9524, total_queries: 10000 },
  heapStats: { size: 23, min_priority: 1, operations: 1892 },
  segmentStats: { data_points: 1000, range_queries: 4521, avg_query_ms: 0.08 },
}
