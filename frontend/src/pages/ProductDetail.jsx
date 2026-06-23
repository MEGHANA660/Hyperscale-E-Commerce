import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Heart, MessageSquare, List } from 'lucide-react'
import { MOCK } from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'

// Map products to premium design brand names
const BRAND_MAP = {
  'Laptops': 'NORD & VALE',
  'Phones': 'KESTREL',
  'Electronics': 'AURALIS',
  'Home': 'HEARTHSIDE',
}

// Map products to high-quality Unsplash image URLs
const IMAGE_MAP = {
  1: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', // MacBook Pro
  2: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80', // iPhone 15 Pro
  3: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', // Sony Headphones
  4: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80', // iPad Air
  5: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80', // Samsung TV
  6: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80', // Dell XPS 15
  7: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', // Apple Watch Ultra 2
  8: 'https://images.unsplash.com/photo-1588449668338-d15168822481?auto=format&fit=crop&w=600&q=80', // AirPods Pro 2
  9: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80', // Logitech MX Master 3S
  10: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80', // Keychron Q1 Pro
  11: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', // Dell Monitor 27"
  12: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80', // HP Laser Printer
}

// Generate dynamic review count based on product ID
const REVIEW_COUNT_MAP = {
  1: 1240, 2: 642, 3: 318, 4: 982, 5: 540, 6: 2104, 7: 311, 8: 1450, 9: 220, 10: 178, 11: 450, 12: 129
}

// Specifications mapping based on Category
const getSpecsList = (category) => {
  if (category === 'Laptops') {
    return [
      { key: 'Processor', val: 'Intel Core i9 / Apple M3 Pro (Octa-core / Deca-core)' },
      { key: 'Memory', val: '18GB / 32GB Unified RAM High-Speed DDR5' },
      { key: 'Storage', val: '512GB / 1TB Ultra-fast PCIe Gen 4 NVMe SSD' },
      { key: 'Display', val: '16-inch Liquid Retina XDR / 120Hz OLED InfinityEdge' },
      { key: 'Graphics', val: 'Integrated 14-core GPU / NVIDIA RTX 40-Series' }
    ]
  } else if (category === 'Phones') {
    return [
      { key: 'Display Panel', val: '6.7-inch OLED Super Retina XDR / ProMotion 120Hz' },
      { key: 'Chipset Architecture', val: 'A17 Pro / Apple M2 Processor 3nm Tech' },
      { key: 'Camera Module', val: '48MP Triple-Lens system with 5x Optical Zoom' },
      { key: 'Biometric Security', val: 'Face ID Hardware Cryptographic Protection' },
      { key: 'Chassis Material', val: 'Aerospace-Grade Titanium Frame, Ceramic Shield' }
    ]
  } else if (category === 'Electronics') {
    return [
      { key: 'Driver Diameter', val: '40mm Custom Dome Type Driver (CCAW Voice Coil)' },
      { key: 'Active Noise Cancellation', val: 'Dual Noise Sensor, V1 Processor Integrated' },
      { key: 'Battery Life Span', val: 'Up to 30 Hours (ANC On) / 38 Hours (ANC Off)' },
      { key: 'Wireless Spec', val: 'Bluetooth 5.2 / LDAC High-Res Audio Wireless' },
      { key: 'Physical Weight', val: 'Approx. 250g Ultra-lightweight Design' }
    ]
  } else {
    return [
      { key: 'Power Input Range', val: 'AC 100-240V, 50/60Hz Multi-voltage Adaptive' },
      { key: 'Material Composition', val: 'Premium Grade Sandblasted Aluminum & Tempered Glass' },
      { key: 'Eco Standard', val: 'Energy Star certified high efficiency operation' },
      { key: 'Hardware Interface', val: 'Dual HDMI 2.1, DisplayPort 1.4, USB-C Power Delivery' },
      { key: 'Warranty Coverage', val: '1-Year Limited Manufacturer Warranty (Global)' }
    ]
  }
}

// Seeded reviews list
const REVIEWS = [
  { user: 'Rohan S.', rating: 5, date: 'May 10, 2026', title: 'Absolutely worth it!', comment: 'An incredibly well-crafted product. Performance is outstanding and the design aesthetics fit perfectly with my minimal workspace setup.' },
  { user: 'Ananya M.', rating: 4, date: 'May 14, 2026', title: 'Excellent, but pricey', comment: 'Quality is unmatched, although the pricing is premium. If you appreciate clean design and details, this is the one for you.' },
  { user: 'Vikram D.', rating: 5, date: 'May 20, 2026', title: 'Perfect product', comment: 'Zero issues. Fast delivery, exceptional packaging, and the product performs exactly as advertised.' }
]

// Client-side product graph BFS logic preserved in background
const GRAPH = {
  1: [3, 11, 12], 2: [7, 8, 5], 3: [7, 1, 4],
  4: [2, 7, 1], 5: [7, 8, 2], 6: [11, 12, 9],
  7: [2, 3, 8], 8: [2, 5, 7], 9: [6, 11, 12],
  10: [9], 11: [12, 6, 1], 12: [11, 6, 9],
}

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
    
    // Simulate slight API fetch loading delay to show premium skeletal loading states
    const timer = setTimeout(() => {
      const { data } = lruGet(id)
      setProduct(data)

      const pid = parseInt(id)
      const recIds = bfsRecommend(pid, 2)
      const recProducts = MOCK.products.filter(p => recIds.includes(p.id)).slice(0, 4)
      setRecs(recProducts)
      setQty(1) // Reset quantity on ID change
      setFetching(false)
    }, 500)

    return () => clearTimeout(timer)
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
  const imageUrl = IMAGE_MAP[product.id] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
  const reviewsCount = REVIEW_COUNT_MAP[product.id] || 450
  const inStock = product.stock > 0
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null
  
  const isFav = isInWishlist(product.id)
  const specs = getSpecsList(product.category)

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
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side: Product Details Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
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
              <span className="text-xs text-slate-700 font-bold">{product.rating} Rating</span>
              <span className="text-slate-350">|</span>
              <span className="text-xs text-slate-455 font-semibold">{reviewsCount.toLocaleString()} Reviews</span>
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
                <span className="bg-emerald-50 text-emerald-600 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold">
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
                Experience peak performance and incredible reliability. Designed with premium materials and engineered to exceed expectations, this {product.name.toLowerCase()} offers standard-setting quality and performance for everyday use.
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
              <div className="space-y-3.5">
                {REVIEWS.map((rev, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{rev.user}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          className={i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'} 
                        />
                      ))}
                    </div>
                    <p className="text-xs font-extrabold text-slate-800">{rev.title}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{rev.comment}"</p>
                  </div>
                ))}
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
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] sm:text-xs text-slate-500 border-t border-slate-100 font-bold">
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Truck size={18} className="text-slate-400" />
              <span>Free Delivery Available</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 border-x border-slate-100">
              <ShieldCheck size={18} className="text-slate-400" />
              <span>1 Year Warranty</span>
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
