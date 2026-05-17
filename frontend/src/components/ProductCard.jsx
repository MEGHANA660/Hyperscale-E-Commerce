import { Star, ShoppingCart, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const CATEGORY_COLORS = {
  'Laptops': 'badge-blue',
  'Smartphones': 'badge-green',
  'Audio': 'badge-purple',
  'Tablets': 'badge-yellow',
  'GPU': 'badge-red',
  'TVs': 'badge-blue',
  'Peripherals': 'badge-green',
  'Wearables': 'badge-purple',
}

const EMOJI_MAP = {
  'Laptops': '💻', 'Smartphones': '📱', 'Audio': '🎧',
  'Tablets': '📱', 'GPU': '🖥️', 'TVs': '📺',
  'Peripherals': '⌨️', 'Wearables': '⌚',
}

export default function ProductCard({ product, compact = false }) {
  const { addToCart } = useCart()

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
  }

  const emoji = EMOJI_MAP[product.category] || '📦'
  const colorClass = CATEGORY_COLORS[product.category] || 'badge-blue'
  const inStock = product.stock > 0

  return (
    <div className="glass-card-hover p-5 flex flex-col gap-3 group animate-in">
      {/* Product Image Placeholder */}
      <div className="h-40 rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 flex items-center justify-center text-5xl
                      group-hover:scale-105 transition-transform duration-300 border border-white/5">
        {emoji}
      </div>

      {/* Category + Stock */}
      <div className="flex items-center justify-between">
        <span className={colorClass}>{product.category}</span>
        {inStock ? (
          <span className="text-xs text-emerald-400 font-medium">In Stock ({product.stock})</span>
        ) : (
          <span className="text-xs text-red-400 font-medium">Out of Stock</span>
        )}
      </div>

      {/* Name */}
      <h3 className="text-white font-semibold leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors">
        {product.name}
      </h3>

      {/* Rating */}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
          />
        ))}
        <span className="text-xs text-slate-400 ml-1">{product.rating}</span>
      </div>

      {/* Price + Actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <span className="text-xl font-bold text-white">${product.price.toLocaleString()}</span>
        <div className="flex gap-2">
          <Link
            to={`/product/${product.id}`}
            id={`view-product-${product.id}`}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all"
            title="View Details"
          >
            <ExternalLink size={15} />
          </Link>
          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAdd}
            disabled={!inStock}
            className="btn-primary py-2 px-3 text-sm flex items-center gap-1.5"
          >
            <ShoppingCart size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
