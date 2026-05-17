import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, ShoppingCart, ArrowLeft, GitBranch, Cpu } from 'lucide-react'
import { MOCK } from '../services/api'
import { useCart } from '../context/CartContext'
import DsaBadge from '../components/DsaBadge'
import ProductCard from '../components/ProductCard'

const EMOJI_MAP = {
  'Laptops': '💻', 'Smartphones': '📱', 'Audio': '🎧',
  'Tablets': '📱', 'GPU': '🖥️', 'TVs': '📺',
  'Peripherals': '⌨️', 'Wearables': '⌚',
}

// BFS on client-side product graph
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

// LRU Cache simulation
const lruCache = new Map()
const LRU_CAPACITY = 10
let cacheHits = 0, cacheMisses = 0

function lruGet(id) {
  if (lruCache.has(id)) {
    cacheHits++
    const val = lruCache.get(id)
    lruCache.delete(id)
    lruCache.set(id, val)
    return { data: val, hit: true }
  }
  cacheMisses++
  const product = MOCK.products.find(p => p.id === parseInt(id))
  if (product) {
    if (lruCache.size >= LRU_CAPACITY) {
      lruCache.delete(lruCache.keys().next().value)
    }
    lruCache.set(id, product)
  }
  return { data: product, hit: false }
}

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [recs, setRecs] = useState([])
  const [cacheHit, setCacheHit] = useState(null)
  const [bfsSteps, setBfsSteps] = useState([])
  const [qty, setQty] = useState(1)

  useEffect(() => {
    window.scrollTo(0, 0)
    const { data, hit } = lruGet(id)
    setProduct(data)
    setCacheHit(hit)

    const pid = parseInt(id)
    const recIds = bfsRecommend(pid, 2)
    const recProducts = MOCK.products.filter(p => recIds.includes(p.id)).slice(0, 4)
    setRecs(recProducts)

    // Show BFS steps
    const steps = []
    steps.push(`Start: Product #${pid}`)
    const level1 = GRAPH[pid] || []
    steps.push(`Depth 1: [${level1.join(', ')}]`)
    const level2 = [...new Set(level1.flatMap(n => (GRAPH[n] || []).filter(x => x !== pid && !level1.includes(x))))]
    steps.push(`Depth 2: [${level2.slice(0, 5).join(', ')}...]`)
    setBfsSteps(steps)
  }, [id])

  if (!product) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="loader" />
      </div>
    )
  }

  const emoji = EMOJI_MAP[product.category] || '📦'

  return (
    <div className="space-y-8 animate-in">
      <Link to="/search" id="back-to-search" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} />Back to Search
      </Link>

      {/* Product Info */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 flex items-center justify-center text-8xl min-h-64 relative">
          {emoji}
          {/* LRU Cache Hit Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
            ${cacheHit ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                       : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'}`}>
            <Cpu size={11} />
            {cacheHit ? '⚡ LRU Cache HIT' : '💾 LRU Cache MISS'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <DsaBadge name="LRU Cache" color="blue" description="O(1) product fetch" />
            <DsaBadge name="Graph BFS" color="yellow" description="Recommendation engine" />
          </div>
          <h1 className="text-3xl font-black text-white">{product.name}</h1>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16}
                className={i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
            ))}
            <span className="text-slate-400">{product.rating} / 5.0</span>
          </div>
          <p className="text-4xl font-black gradient-text">${product.price.toLocaleString()}</p>
          <div className="text-sm text-emerald-400">In Stock: {product.stock} units</div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} id="qty-decrease"
                className="px-4 py-2 hover:bg-white/10 text-white transition-colors">−</button>
              <span className="px-4 py-2 text-white font-mono w-12 text-center">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} id="qty-increase"
                className="px-4 py-2 hover:bg-white/10 text-white transition-colors">+</button>
            </div>
            <button id="detail-add-to-cart" onClick={() => addToCart(product, qty)}
              className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <ShoppingCart size={18} /> Add {qty > 1 ? `${qty}×` : ''} to Cart
            </button>
          </div>

          {/* LRU Stats */}
          <div className="glass-card p-4 mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LRU Cache Stats (This Session)</p>
            <div className="flex gap-4">
              <div>
                <div className="text-xl font-bold text-emerald-400">{cacheHits}</div>
                <div className="text-xs text-slate-500">Hits</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-400">{cacheMisses}</div>
                <div className="text-xs text-slate-500">Misses</div>
              </div>
              <div>
                <div className="text-xl font-bold text-primary-400">
                  {cacheHits + cacheMisses > 0
                    ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-xs text-slate-500">Hit Ratio</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graph BFS Visualization */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch size={20} className="text-amber-400" />
          <div>
            <h3 className="text-white font-bold">Graph BFS — Recommendation Engine</h3>
            <p className="text-xs text-slate-400">BFS traversal finds related products within 2 degrees</p>
          </div>
          <DsaBadge name="Graph BFS" color="yellow" />
        </div>
        <div className="space-y-2 mb-4">
          {bfsSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">{i}</span>
              <code className="font-mono text-amber-300">{step}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">
            Customers Also Bought
            <span className="ml-2 text-xs font-normal text-slate-400">(Graph BFS, depth=2)</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recs.map(p => <ProductCard key={p.id} product={p} compact />)}
          </div>
        </section>
      )}
    </div>
  )
}
