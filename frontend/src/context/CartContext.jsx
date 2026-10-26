import { createContext, useContext, useState, useEffect } from 'react'
import { MAX_QTY_PER_ITEM, MAX_LINE_ITEMS } from '../services/limits'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hsc_cart') || '[]')
    } catch {
      return []
    }
  })

  const [toast, setToast] = useState(null)

  useEffect(() => {
    localStorage.setItem('hsc_cart', JSON.stringify(cart))
  }, [cart])

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev))
    }, 3200)
  }

  const addToCart = (product, qty = 1) => {
    if (!product) return false
    if (product.stock !== undefined && product.stock <= 0) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error')
      return false
    }

    const existing = cart.find(i => i.id === product.id)
    const wanted = (existing?.qty || 0) + qty
    if (product.stock !== undefined && wanted > product.stock) {
      showToast(`Cannot add more than ${product.stock} units of "${product.name}".`, 'error')
      return false
    }
    if (wanted > MAX_QTY_PER_ITEM) {
      showToast(`You can order at most ${MAX_QTY_PER_ITEM} units of "${product.name}".`, 'error')
      return false
    }
    if (!existing && cart.length >= MAX_LINE_ITEMS) {
      showToast(`Your cart can hold at most ${MAX_LINE_ITEMS} different products.`, 'error')
      return false
    }

    setCart(prev => {
      const found = prev.find(i => i.id === product.id)
      return found
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
        : [...prev, { ...product, qty }]
    })

    showToast(`Added to cart: ${product.name}`, 'success')
    return true
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
    showToast('Item removed from cart', 'info')
  }

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id)
    if (qty > MAX_QTY_PER_ITEM) {
      showToast(`You can order at most ${MAX_QTY_PER_ITEM} units of one product.`, 'error')
      return
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const clearCart = () => setCart([])

  const total = cart.reduce((sum, i) => sum + (Number(i.price) || 0) * i.qty, 0)
  const count = cart.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, count, showToast }}>
      {children}
      {/* Universal Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-800'
              : toast.type === 'info'
              ? 'bg-slate-900/90 text-slate-100 border-slate-700'
              : 'bg-emerald-950/95 text-emerald-100 border-emerald-700'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
