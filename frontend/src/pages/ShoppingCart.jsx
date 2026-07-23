import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package, Check, ShieldCheck, CreditCard, Compass, ArrowLeft, Star } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { MOCK } from '../services/api'

// Product image map (same source as ProductCard — no backend needed)
const IMAGE_MAP = {
  1:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=200&q=80',
  2:'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=200&q=80',
  3:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80',
  4:'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=200&q=80',
  5:'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=200&q=80',
  6:'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80',
  7:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
  8:'https://images.unsplash.com/photo-1588449668338-d15168822481?auto=format&fit=crop&w=200&q=80',
  9:'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=200&q=80',
  10:'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=200&q=80',
  11:'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80',
  12:'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=200&q=80',
  13:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=200&q=80',
  14:'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=200&q=80',
  15:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=200&q=80',
  16:'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=200&q=80',
  17:'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80',
  18:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
  19:'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80',
  20:'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=200&q=80',
}

// ─── Min Heap client-side logic preserved in background ────────────────────
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

// ─── 0/1 Knapsack DP logic preserved in background ────────────────────────
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
  { label: 'Express Delivery (2hr)', priority: 1, extra: 1000, desc: 'Deliver within 2 hours' },
  { label: 'Priority Delivery (Next Day)', priority: 2, extra: 300, desc: 'Deliver by tomorrow morning' },
  { label: 'Standard Delivery (3-5 days)', priority: 3, extra: 0, desc: 'Free standard delivery' },
]

// Discounts mapped to Rupees (cost represents budget unit weight, value represents value)
const DISCOUNTS = [
  { label: '10% Multi-item Discount', type: 'percent', value: 0.10, cost: 30, minItems: 2 },
  { label: 'Free Priority Shipping', type: 'shipping', value: 1.0, cost: 20 },
  { label: '₹1,500 Festive Coupon', type: 'flat', value: 1500, cost: 50 },
  { label: 'Loyalty Bonus 5% Off', type: 'percent', value: 0.05, cost: 15 },
]

const EMOJI_MAP = {
  'Laptops': '💻', 'Phones': '📱', 'Electronics': '🎧',
  'Home': '📺',
}

export default function ShoppingCart() {
  const { cart, removeFromCart, updateQty, clearCart, total, count } = useCart()
  const [orderType, setOrderType] = useState(2) // Default to Priority Delivery
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [processingOrder, setProcessingOrder] = useState(false)
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null)
  
  // Checkout flow step: 1 = Review Cart, 2 = Shipping & Payment Info
  const [step, setStep] = useState(1)
  
  // Billing details fields
  const [fullName, setFullName] = useState('Alice Dev')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [address, setAddress] = useState('142 Premium Lane, Bangalore, KA, India')
  const [paymentMethod, setPaymentMethod] = useState('upi')

  const selectedShipping = ORDER_TYPES.find(o => o.priority === orderType)
  const subtotal = total
  const shippingCost = selectedShipping?.extra ?? 0
  
  // Execute DP discount optimization in background
  const budgetLimit = Math.min(Math.floor(subtotal / 1000), 100)
  
  // FIXME: recalculate tax & discount threshold when cart items change
  const { selected: selectedDiscounts } = optimizeDiscounts(
    DISCOUNTS.map(d => [Math.floor(d.value * 100), d.cost]), 
    budgetLimit
  )

  const activeDiscounts = selectedDiscounts.map(i => DISCOUNTS[i])

  // Calculate actual savings based on DP selected items
  let totalSavings = 0
  activeDiscounts.forEach(discount => {
    if (discount.type === 'percent') {
      if (discount.minItems && count < discount.minItems) return
      totalSavings += subtotal * discount.value
    } else if (discount.type === 'flat') {
      totalSavings += Math.min(subtotal, discount.value)
    } else if (discount.type === 'shipping') {
      totalSavings += shippingCost
    }
  })

  // Round savings
  totalSavings = Math.round(totalSavings)
  const grandTotal = Math.max(0, subtotal + shippingCost - totalSavings)

  const placeOrder = () => {
    setProcessingOrder(true)
    
    // TODO: integrate with order-service backend REST API endpoint when container is live
    // console.log("placing order for user Alice Dev", { grandTotal, count })
    
    // Simulate Min Heap queue operation in background
    const heap = new MinHeap()
    heap.push(orderType, { id: Date.now(), items: count, total: grandTotal, type: selectedShipping?.label })
    heap.push(1, { id: 1001, items: 2, total: 129999, type: 'Express Delivery (2hr)' })
    heap.push(3, { id: 1002, items: 1, total: 14999, type: 'Standard Delivery (3-5 days)' })
    
    // Save queue data into window object for the developer performance dashboard
    const queue = []
    while (heap.size()) {
      const [priority, data] = heap.pop()
      queue.push({ priority, ...data })
    }
    window.__lastHeapQueue = queue

    setTimeout(() => {
      setProcessingOrder(false)
      setPlacedOrderDetails({
        id: `CB-${Math.floor(100000 + Math.random() * 900000)}`,
        shipping: selectedShipping?.label,
        total: grandTotal,
        savings: totalSavings
      })
      setOrderPlaced(true)
      clearCart()
    }, 1500)
  }

  if (orderPlaced && placedOrderDetails) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 sm:py-20 space-y-6 animate-in bg-white border border-slate-200 p-6 sm:p-10 rounded-[32px] shadow-xs text-left">
        <div className="text-6xl text-center select-none">🎉</div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-center">Order Placed!</h1>
        <p className="text-slate-500 text-xs sm:text-sm text-center leading-relaxed font-medium">
          Thank you for shopping with aeterna. Your order is registered in our Min Heap fulfillment queue.
        </p>
        
        <div className="bg-slate-50 p-5 rounded-[20px] border border-slate-200 space-y-3.5 text-xs sm:text-sm font-semibold">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Order ID:</span>
            <span className="font-mono font-black text-slate-800">{placedOrderDetails.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Delivery Speed:</span>
            <span className="text-slate-800">{placedOrderDetails.shipping}</span>
          </div>
          {placedOrderDetails.savings > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Discount Saved:</span>
              <span className="text-emerald-600 font-extrabold">₹{placedOrderDetails.savings.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 text-sm sm:text-base font-black">
            <span>Amount Paid:</span>
            <span>₹{placedOrderDetails.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Live Min Heap Dispatch queue rendering */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-[24px] p-5 space-y-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-2">
            Min Heap Fulfillment Queue
          </h3>
          <div className="space-y-2 text-xs">
            {window.__lastHeapQueue && window.__lastHeapQueue.map((item, idx) => {
              const isUserOrder = item.total === placedOrderDetails.total && item.priority === orderType
              return (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center p-2.5 rounded-xl border transition-all
                    ${isUserOrder 
                      ? 'bg-blue-600/20 border-blue-500 font-bold text-blue-205' 
                      : 'bg-slate-850 border-slate-800 text-slate-450'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[9px]
                      ${isUserOrder ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <span>{item.type || 'Fulfillment Order'}</span>
                  </div>
                  <span className="font-mono text-[10px]">₹{item.total.toLocaleString('en-IN')}</span>
                </div>
              )
            })}
          </div>
          <p className="text-[8px] text-slate-500 text-center font-semibold italic">
            Deliveries sorted logarithmically: Priority 1 (Express) is processed first.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/search" className="btn-pill-dark w-full justify-center py-3 text-xs sm:text-sm">
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 sm:py-24 space-y-4 animate-in bg-white border border-slate-200 rounded-[32px] p-8 sm:p-12 max-w-xl mx-auto shadow-xs text-left">
        <div className="w-14 h-14 bg-slate-105 text-slate-650 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-200/50">
          <ShoppingBag size={22} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-center">Your shopping cart is empty</h2>
        <p className="text-slate-500 text-xs sm:text-sm text-center leading-relaxed font-medium max-w-xs mx-auto">
          Explore our wide collection of premium electronics, laptops, home pickings and find the best offers today!
        </p>
        <div className="pt-4 flex justify-center">
          <Link to="/search" id="cart-shop-now" className="btn-pill-dark inline-flex items-center gap-2 text-xs sm:text-sm px-6 py-2.5">
            Explore Deals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in text-left">
      <div className="flex items-center gap-3">
        {step === 2 && (
          <button 
            onClick={() => setStep(1)}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
            title="Back to Basket"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {step === 1 ? 'Shopping Cart' : 'Shipping & Payment'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {step === 1 
              ? `Manage items in your basket (${count} item${count !== 1 ? 's' : ''})`
              : 'Complete your billing details below to register the order'
            }
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Step 1: Cart Items List Column */}
        {step === 1 && (
          <div className="lg:col-span-2 space-y-3.5">
            {cart.map(item => {
              const imgSrc = item.image_url || IMAGE_MAP[item.id]
              return (
                <div key={item.id} className="bg-white border border-slate-200/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[20px] shadow-xs hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4 w-full">
                    {/* Product thumbnail */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-105 border border-slate-200/50 shrink-0">
                      {imgSrc ? (
                        <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl select-none bg-slate-50">
                          {({ 'Laptops':'💻','Phones':'📱','Electronics':'🎧','Home':'📺','Fashion':'👕','Beauty':'✨' })[item.category] || '📦'}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-slate-800 font-bold text-sm leading-tight truncate">{item.name}</p>
                      <p className="text-slate-400 text-[10px] uppercase font-extrabold tracking-wider mt-0.5">{item.category}</p>
                      <p className="text-slate-900 font-black text-sm mt-1.5">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                      {item.qty > 1 && (
                        <p className="text-[10px] text-slate-400 font-medium">₹{item.price.toLocaleString('en-IN')} each</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Qty controls + remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} id={`dec-${item.id}`}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95">
                        <Minus size={11} />
                      </button>
                      <span className="font-mono w-6 text-center text-xs font-bold text-slate-800 select-none">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} id={`inc-${item.id}`}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-all active:scale-95">
                        <Plus size={11} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} id={`remove-${item.id}`}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all border border-red-100 active:scale-95"
                      title="Remove item">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Knapsack DP coupon optimized widget */}
            {activeDiscounts.length > 0 && (
              <div className="bg-emerald-50/40 border border-emerald-150 p-5 rounded-[24px] space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                  <Compass size={14} /> Knapsack DP: Applied Vouchers
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {activeDiscounts.map((discount, i) => (
                    <div key={i} className="bg-white border border-emerald-100/60 p-3 rounded-2xl flex items-center gap-2 shadow-2xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">{discount.label}</p>
                        <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-wide mt-0.5">Budget Weight: {discount.cost} units</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                  * Dynamic Programming Knapsack algorithm has computed the mathematically optimal combination of active promotions matching your checkout budget limits (Weight cost units) to maximize your discount savings.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Shipping & Billing Form Details */}
        {step === 2 && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[28px] p-6 shadow-xs space-y-5">
            <h3 className="text-xs font-extrabold text-slate-800 tracking-tight uppercase border-b border-slate-100 pb-3">
              Delivery Destination
            </h3>
            
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full border border-slate-350 rounded-xl px-3.5 py-2.5 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-455 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full border border-slate-350 rounded-xl px-3.5 py-2.5 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Delivery Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  className="w-full border border-slate-350 rounded-xl px-3.5 py-2.5 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                />
              </div>

              <h3 className="text-xs font-extrabold text-slate-800 tracking-tight uppercase border-b border-slate-100 pt-2 pb-3">
                Payment Method
              </h3>

              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { id: 'upi', label: 'UPI / Google Pay', desc: 'Instant UPI dispatch' },
                  { id: 'card', label: 'Credit / Debit Card', desc: 'Secure gateway' },
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay on arrival' }
                ].map(pay => (
                  <button
                    key={pay.id}
                    type="button"
                    onClick={() => setPaymentMethod(pay.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all
                      ${paymentMethod === pay.id
                        ? 'border-slate-850 bg-slate-900 text-white font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`text-[10px] font-extrabold ${paymentMethod === pay.id ? 'text-white' : 'text-slate-800'}`}>
                        {pay.label}
                      </span>
                      <CreditCard size={12} className={paymentMethod === pay.id ? 'text-blue-300' : 'text-slate-400'} />
                    </div>
                    <span className={`text-[8px] font-semibold ${paymentMethod === pay.id ? 'text-slate-350' : 'text-slate-400'}`}>
                      {pay.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Checkout Summary Column */}
        <div className="space-y-4">
          
          {/* Delivery Options Selector */}
          <div className="bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Package size={15} />
              Delivery Options
            </h3>
            <div className="space-y-2">
              {ORDER_TYPES.map(opt => (
                <button 
                  key={opt.priority} 
                  id={`order-type-${opt.priority}`}
                  onClick={() => setOrderType(opt.priority)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left
                    ${orderType === opt.priority
                      ? 'border-slate-800 bg-slate-900 text-white font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'}`}
                >
                  <div className="space-y-0.5">
                    <p className={`text-xs font-bold ${orderType === opt.priority ? 'text-white' : 'text-slate-800'}`}>{opt.label}</p>
                    <p className={`text-[9px] font-semibold ${orderType === opt.priority ? 'text-slate-350' : 'text-slate-400'}`}>{opt.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {opt.extra > 0 ? (
                      <span className={`font-mono text-xs font-bold ${orderType === opt.priority ? 'text-white' : 'text-slate-800'}`}>
                        +₹{opt.extra.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Free
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Totals Summary Card */}
          <div className="bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-xs space-y-4">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight">Order Summary</h3>
            
            <div className="space-y-2 text-xs sm:text-sm font-medium text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal ({count} items)</span>
                <span className="font-mono text-slate-800 font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-mono text-slate-800 font-bold">{shippingCost === 0 ? 'Free' : `₹${shippingCost.toLocaleString('en-IN')}`}</span>
              </div>
              
              {/* DP Optimization savings display */}
              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                  <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                    <Check size={13} /> You Save (Best Offer applied)
                  </span>
                  <span className="font-mono">-₹{totalSavings.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            <div className="flex justify-between font-black text-slate-900 text-base">
              <span>Total Price</span>
              <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>

            {step === 1 ? (
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="btn-pill-dark w-full flex items-center justify-center gap-2 py-3"
              >
                Proceed to Checkout <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                id="place-order-btn" 
                onClick={placeOrder} 
                disabled={processingOrder}
                className="btn-pill-dark w-full flex items-center justify-center gap-2 py-3"
              >
                {processingOrder ? (
                  <>
                    <div className="loader w-3.5 h-3.5 border-white border-t-transparent" /> 
                    Processing Order...
                  </>
                ) : (
                  <>Place Order</>
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5 justify-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={11} />
              <span>100% Secure Checkout</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── You might also like ── */}
      {step === 1 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">You might also like</h2>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Frequently bought together</p>
            </div>
            <Link to="/search" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
              See more <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MOCK.products.filter(p => [3, 8, 15, 19].includes(p.id)).map(rec => {
              const imgSrc = rec.image_url || IMAGE_MAP[rec.id]
              return (
                <Link
                  key={rec.id}
                  to={`/product/${rec.id}`}
                  className="bg-white border border-slate-200/60 rounded-[20px] overflow-hidden shadow-xs hover:shadow-md transition-all group hover:-translate-y-0.5"
                >
                  <div className="aspect-square bg-slate-100 overflow-hidden">
                    {imgSrc && (
                      <img src={imgSrc} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">{rec.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-bold text-slate-600">{rec.rating}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 mt-1">₹{rec.price.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
