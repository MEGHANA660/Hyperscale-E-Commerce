import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Heart, MessageSquare, List } from 'lucide-react'
import { productApi, recApi, MOCK } from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'
import { productImage, onImgError } from '../services/productImage'

// Map products to premium design brand names
const BRAND_MAP = {
  'Laptops': 'NORD & VALE',
  'Phones': 'KESTREL',
  'Electronics': 'AURALIS',
  'Home & Living': 'HEARTHSIDE',
  'Home': 'HEARTHSIDE',
  'Fashion': 'ATELIER',
  'Beauty': 'LUMIÈRE',
  'Accessories': 'EQUINOX',
}


// Generate dynamic review count based on product ID
const REVIEW_COUNT_MAP = {
  1: 1240, 2: 642, 3: 318, 4: 982, 5: 540, 6: 2104, 7: 311, 8: 1450, 9: 220, 10: 178, 11: 450, 12: 129
}

// Facts about this product, taken from its own data (no invented specifications).
const getSpecsList = (product) => {
  const rows = [{ key: 'Category', val: product.category }]
  if (product.description) rows.push({ key: 'About', val: product.description })
  if (product.originalPrice > product.price) {
    rows.push({ key: 'MRP', val: `₹${product.originalPrice.toLocaleString('en-IN')}` })
  }
  rows.push({ key: 'Availability', val: product.stock > 0 ? `In stock (${product.stock} units)` : 'Out of stock' })
  rows.push({ key: 'Returns', val: '7 day replacement' })
  return rows
}

// Product graph for the BFS recommender: products in the same category are neighbours
// (each one linked to the next 3 in its category), built from the catalog.
const GRAPH = (() => {
  const byCat = {}
  MOCK.products.forEach(p => { (byCat[p.category] ||= []).push(p.id) })
  const g = {}
  Object.values(byCat).forEach(ids => {
    ids.forEach((id, i) => {
      g[id] = [1, 2, 3].map(k => ids[(i + k) % ids.length]).filter(x => x !== id)
    })
  })
  return g
})()

function bfsRecommend(startId, depth = 2) {
  const visited = new Set([startId])
  const queue = [[startId, 0]]
  const results = []
  while (queue.length) {
    const [cur, d] = queue.shift()
    if (d > 0) results.push(cur)
    if (d < depth) {
      for (const neighbor of (GRAPH[cur] || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push([neighbor, d + 1])
        }
      }
    }
  }
  return results
}

// Client-side LRU Cache logic preserved in background
const lruCache = new Map()
const LRU_CAPACITY = 10

function lruGet(id) {
  const numId = parseInt(id)
  if (lruCache.has(numId)) {
    // Record hit globally for the performance dashboard
    window.__lruHits = (window.__lruHits || 0) + 1
    const val = lruCache.get(numId)
    lruCache.delete(numId)
    lruCache.set(numId, val)
    return { data: val, hit: true }
  }
  
  window.__lruMisses = (window.__lruMisses || 0) + 1
  const product = MOCK.products.find(p => p.id === numId)
  if (product) {
    if (lruCache.size >= LRU_CAPACITY) {
      lruCache.delete(lruCache.keys().next().value)
    }
    lruCache.set(numId, product)
  }
  return { data: product, hit: false }
}

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  
  const [product, setProduct] = useState(null)
  const [recs, setRecs] = useState([])
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    setFetching(true)
    const numId = parseInt(id)

    // Call real backend Product Service (Bloom filter guarded + Redis cached)
    productApi.getById(numId)
      .then(data => {
        setProduct(data)
        // Call real backend Recommendation Service (Graph BFS)
        recApi.getRecommendations(numId, 2)
          .then(recData => {
            const recIds = recData.recommended_ids || []
            if (recIds.length > 0) {
              setRecs(MOCK.products.filter(p => recIds.includes(p.id)).slice(0, 4))
            } else {
              setRecs(MOCK.products.filter(p => p.id !== numId && p.category === data.category).slice(0, 4))
            }
          })
          .catch(() => {
            const fallbackIds = bfsRecommend(numId, 2)
            setRecs(MOCK.products.filter(p => fallbackIds.includes(p.id)).slice(0, 4))
          })
      })
      .catch(err => {
        console.warn("Backend product service unavailable, using local cache:", err.message)
        const { data } = lruGet(id)
        setProduct(data)
        const fallbackIds = bfsRecommend(numId, 2)
        setRecs(MOCK.products.filter(p => fallbackIds.includes(p.id)).slice(0, 4))
      })
      .finally(() => {
        setQty(1)
        setFetching(false)
      })
  }, [id])

  if (fetching || !product) {
    return (
      <div className="space-y-8 animate-pulse text-left">
        <div className="h-4 w-32 bg-slate-200 rounded-md" />
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-10 shadow-xs grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[4/3] rounded-[24px] bg-slate-100" />
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-8 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
            </div>
            <div className="h-px bg-slate-100" />
            <div className="h-10 w-24 bg-slate-200 rounded" />
            <div className="h-20 w-full bg-slate-200 rounded" />
            <div className="h-12 w-full bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  const brand = BRAND_MAP[product.category] || 'MERIDIAN'
  const imageUrl = productImage(product)
  const reviewsCount = REVIEW_COUNT_MAP[product.id] || 450
  const inStock = product.stock > 0
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null
  
  const isFav = isInWishlist(product.id)
  const specs = getSpecsList(product)

  return (
    <div className="space-y-8 sm:space-y-10 animate-in text-left">
      
      {/* Back navigation */}
      <Link 
        to="/search" 
        id="back-to-search" 
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-wider"
      >
        <ArrowLeft size={14} /> Back to Search
      </Link>

      {/* Main product card details */}
      <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-10 shadow-xs grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* Left Side: Product Image */}
        <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-105 border border-slate-200/50 relative">
          <img 
            src={imageUrl}
            onError={onImgError(product)}
            alt={product.name} 
            className="w-full h-full object-contain bg-white"
          />
        </div>

        {/* Right Side: Product Details Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              {brand}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight pt-1">
              {product.name}
            </h1>
            
            {/* Rating summary */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14}
                    className={i < Math.floor(product.rating) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} 
                  />
                ))}
              </div>
              <span className="text-xs text-slate-700 font-bold">{Number(product.rating).toFixed(1)} Rating</span>
              <span className="text-slate-350">|</span>
              <span className="text-xs text-slate-455 font-semibold">{(product.sold ?? reviewsCount).toLocaleString('en-IN')} sold</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Pricing Details */}
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {discountPercent && (
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <span>Save {discountPercent}% today</span>
                <span className="bg-emerald-50 text-emerald-600 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold">
                  Special Offer
                </span>
              </div>
            )}
          </div>

          {/* Premium Tab Bar for Details */}
          <div className="border-b border-slate-200">
            <div className="flex gap-6 -mb-px" role="tablist">
              {[
                { id: 'description', label: 'Description', icon: MessageSquare },
                { id: 'specifications', label: 'Specifications', icon: List },
                { id: 'reviews', label: 'Reviews', icon: Star }
              ].map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 pb-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all
                    ${activeTab === tab.id
                      ? 'border-slate-800 text-slate-900 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-750'}`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="min-h-24">
            {activeTab === 'description' && (
              <p className="text-sm text-slate-650 leading-relaxed font-medium">
                {product.description || `${product.name} from our ${product.category} range.`}
              </p>
            )}

            {activeTab === 'specifications' && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 text-xs">
                {specs.map((item, idx) => (
                  <div key={idx} className="flex border-b border-slate-200 last:border-0">
                    <span className="w-1/3 bg-slate-100/60 p-2.5 font-bold text-slate-500 border-r border-slate-200">{item.key}</span>
                    <span className="w-2/3 p-2.5 font-semibold text-slate-800">{item.val}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-slate-50/60 border border-slate-200 p-5 rounded-2xl flex items-center gap-4">
                <div className="text-3xl font-black text-slate-900 tabular-nums">{product.rating != null ? Number(product.rating).toFixed(1) : '–'}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < Math.round(product.rating ?? 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Average rating. Written reviews from verified buyers will appear here once customers post them.
                  </p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Stock Info */}
          <div>
            {inStock ? (
              <span className="text-xs text-emerald-600 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                ✓ In Stock (Ready to dispatch)
              </span>
            ) : (
              <span className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-105">
                ✗ Temporarily Out of Stock
              </span>
            )}
          </div>

          {/* Quantity and Actions */}
          <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center border border-slate-300 rounded-full overflow-hidden bg-slate-50">
              <button 
                onClick={() => setQty(q => Math.max(1, q - 1))} 
                id="qty-decrease"
                disabled={!inStock}
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 font-bold transition-colors disabled:opacity-50 text-sm"
              >
                −
              </button>
              <span className="px-3 py-2 text-slate-800 font-mono w-10 text-center text-xs font-bold select-none">
                {qty}
              </span>
              <button 
                onClick={() => setQty(q => Math.min(product.stock, q + 1))} 
                id="qty-increase"
                disabled={!inStock}
                className="px-4 py-2 hover:bg-slate-200 text-slate-800 font-bold transition-colors disabled:opacity-50 text-sm"
              >
                +
              </button>
            </div>

            <button 
              id="detail-add-to-cart" 
              onClick={() => addToCart(product, qty)}
              disabled={!inStock}
              className="btn-pill-dark flex items-center gap-2 flex-1 justify-center py-3 text-xs sm:text-sm"
            >
              <ShoppingCart size={15} /> 
              Add to Cart {qty > 1 ? `(${qty})` : ''}
            </button>

            {/* Wishlist toggle button */}
            <button
              onClick={() => toggleWishlist(product)}
              disabled={!inStock}
              className={`p-3 rounded-full border transition-all flex items-center justify-center active:scale-90 duration-200 shrink-0
                ${isFav 
                  ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100 shadow-xs' 
                  : 'border-slate-300 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : "fill-transparent"} />
            </button>
          </div>

          {/* Delivery & Warranty Features */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs sm:text-xs text-slate-500 border-t border-slate-100 font-bold">
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Truck size={18} className="text-slate-400" />
              <span>Free Delivery Available</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 border-x border-slate-100">
              <ShieldCheck size={18} className="text-slate-400" />
              <span>Secure Payments</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <RotateCcw size={18} className="text-slate-400" />
              <span>7 Day Replacement</span>
            </div>
          </div>

        </div>
      </div>

      {/* Recommendations - Customers Also Bought */}
      {recs.length > 0 && (
        <section className="space-y-6 pt-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Customers also bought
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recs.map(p => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
