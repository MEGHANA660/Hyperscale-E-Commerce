import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Lightbulb, Package } from 'lucide-react'
import { useCart } from '../context/CartContext'
import DsaBadge from '../components/DsaBadge'

// ─── Client-side Min Heap for order priority ────────────────────
class MinHeap {
  constructor() { this.heap = [] }
  push(priority, data) {
    this.heap.push([priority, data])
    this._bubbleUp(this.heap.length - 1)
  }
  pop() {
    if (!this.heap.length) return null
    if (this.heap.length === 1) return this.heap.pop()
    const root = this.heap[0]
    this.heap[0] = this.heap.pop()
    this._bubbleDown(0)
    return root
  }
  size() { return this.heap.length }
  _bubbleUp(i) {
    const p = Math.floor((i - 1) / 2)
    if (i > 0 && this.heap[i][0] < this.heap[p][0]) {
      ;[this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]]
      this._bubbleUp(p)
    }
  }
  _bubbleDown(i) {
    const l = 2 * i + 1, r = 2 * i + 2
    let s = i
    if (l < this.heap.length && this.heap[l][0] < this.heap[s][0]) s = l
    if (r < this.heap.length && this.heap[r][0] < this.heap[s][0]) s = r
    if (s !== i) {
      ;[this.heap[i], this.heap[s]] = [this.heap[s], this.heap[i]]
      this._bubbleDown(s)
    }
  }
}

// ─── 0/1 Knapsack DP for discount optimization ───────────────────
function optimizeDiscounts(discounts, budget) {
  const n = discounts.length
  const dp = Array.from({ length: n + 1 }, () => new Array(budget + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    const [inc, cost] = discounts[i - 1]
    for (let w = 0; w <= budget; w++) {
      dp[i][w] = dp[i - 1][w]
      if (cost <= w) dp[i][w] = Math.max(dp[i][w], inc + dp[i - 1][w - cost])
    }
  }
  const selected = []
  let w = budget
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(i - 1)
      w -= discounts[i - 1][1]
    }
  }
  return { maxIncrease: dp[n][budget], selected }
}

const ORDER_TYPES = [
  { label: 'Express (2hr)', priority: 1, extra: 29.99, color: 'text-red-400', badge: 'badge-red' },
  { label: 'Premium (Next Day)', priority: 2, extra: 14.99, color: 'text-amber-400', badge: 'badge-yellow' },
  { label: 'Standard (3-5 days)', priority: 3, extra: 0, color: 'text-blue-400', badge: 'badge-blue' },
]

const DISCOUNTS = [
  { label: '10% Off on 3+ items', increase: 10, cost: 50 },
  { label: 'Free Shipping', increase: 8, cost: 30 },
  { label: '$20 Coupon', increase: 15, cost: 70 },
  { label: 'Loyalty Bonus +5%', increase: 5, cost: 20 },
]

export default function ShoppingCart() {
  const { cart, removeFromCart, updateQty, clearCart, total, count } = useCart()
  const [orderType, setOrderType] = useState(2)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [processingOrder, setProcessingOrder] = useState(false)
  const [heapQueue, setHeapQueue] = useState([])

  const selected = ORDER_TYPES.find(o => o.priority === orderType)
  const subtotal = total
  const shipping = selected?.extra ?? 0
  const grandTotal = subtotal + shipping

  // DP discount optimization
  const budget = Math.floor(grandTotal)
  const { maxIncrease, selected: selectedDiscounts } = optimizeDiscounts(
    DISCOUNTS.map(d => [d.increase, d.cost]), Math.min(budget, 100)
  )
  const activeDiscounts = selectedDiscounts.map(i => DISCOUNTS[i])

  const placeOrder = () => {
    setProcessingOrder(true)
    // Simulate Min Heap queue
    const heap = new MinHeap()
    heap.push(orderType, { id: Date.now(), items: count, total: grandTotal, type: selected?.label })
    heap.push(1, { id: 1001, items: 2, total: 199, type: 'Express' })
    heap.push(3, { id: 1002, items: 1, total: 49, type: 'Standard' })
    const queue = []
    while (heap.size()) {
      const [priority, data] = heap.pop()
      queue.push({ priority, ...data })
    }
    setHeapQueue(queue)
    setTimeout(() => {
      setProcessingOrder(false)
      setOrderPlaced(true)
      clearCart()
    }, 1500)
  }

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6 animate-in">
        <div className="text-7xl">🎉</div>
        <h1 className="text-3xl font-black text-white">Order Placed!</h1>
        <p className="text-slate-400">Your order has been queued via <strong className="text-white">Min Heap</strong> and
          will be processed by priority.</p>
        <div className="glass-card p-5 text-left space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Min Heap Processing Order</p>
          {heapQueue.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-300 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-slate-300">Priority {item.priority} — {item.type}</span>
              {item.id === heapQueue.find(q => q.total === grandTotal)?.id && (
                <span className="badge-blue">Your Order</span>
              )}
            </div>
          ))}
        </div>
        <Link to="/search" className="btn-primary inline-flex items-center gap-2">
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-24 space-y-4 animate-in">
        <ShoppingBag size={64} className="text-slate-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
        <p className="text-slate-400">Add some products to see the Min Heap and DP demos!</p>
        <Link to="/search" id="cart-shop-now" className="btn-primary inline-flex items-center gap-2 mt-4">
          <Package size={18} /> Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <DsaBadge name="Min Heap" color="red" description="O(log n) priority ordering" />
          <DsaBadge name="Dynamic Programming" color="pink" description="Optimal discount selection" />
        </div>
        <h1 className="text-3xl font-black text-white mb-1">Shopping Cart</h1>
        <p className="text-slate-400">{count} item{count !== 1 ? 's' : ''} · Min Heap order queuing + DP discount optimization</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-dark-800 flex items-center justify-center text-3xl shrink-0">
                {item.category === 'Laptops' ? '💻' : item.category === 'Smartphones' ? '📱' :
                 item.category === 'Audio' ? '🎧' : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{item.name}</p>
                <p className="text-primary-400 font-bold">${item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateQty(item.id, item.qty - 1)} id={`dec-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all">
                  <Minus size={12} />
                </button>
                <span className="text-white font-mono w-6 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} id={`inc-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-all">
                  <Plus size={12} />
                </button>
                <button onClick={() => removeFromCart(item.id)} id={`remove-${item.id}`}
                  className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all ml-2">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Order Priority */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-white">Order Priority (Min Heap)</span>
            </div>
            <div className="space-y-2">
              {ORDER_TYPES.map(opt => (
                <button key={opt.priority} id={`order-type-${opt.priority}`}
                  onClick={() => setOrderType(opt.priority)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm
                    ${orderType === opt.priority
                      ? 'border-primary-500/50 bg-primary-500/10 text-white'
                      : 'border-white/10 hover:border-white/20 text-slate-400'}`}>
                  <span>{opt.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">Priority {opt.priority}</span>
                    {opt.extra > 0 && <span className="text-emerald-400">+${opt.extra}</span>}
                    {opt.extra === 0 && <span className="badge-green">Free</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DP Discounts */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-pink-400" />
              <span className="text-sm font-semibold text-white">DP Optimal Discounts</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              0/1 Knapsack DP selected {activeDiscounts.length} discount(s) for max +{maxIncrease}% conversion
            </p>
            {activeDiscounts.length > 0 ? (
              activeDiscounts.map((d, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-400 text-xs">✓</span>
                  <span className="text-xs text-slate-300">{d.label}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Add more items to unlock discounts</p>
            )}
          </div>

          {/* Price Summary */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Subtotal ({count} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Shipping ({selected?.label})</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-white text-lg">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <button id="place-order-btn" onClick={placeOrder} disabled={processingOrder}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {processingOrder ? <><div className="loader w-4 h-4" /> Processing...</> : <>Place Order →</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
