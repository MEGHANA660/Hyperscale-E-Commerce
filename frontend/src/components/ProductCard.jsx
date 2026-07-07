import { Star, ShoppingCart, ExternalLink, Heart, Sparkles, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

// Map products to premium design brand names
const BRAND_MAP = {
  'Laptops':     'NORD & VALE',
  'Phones':      'KESTREL',
  'Electronics': 'AURALIS',
  'Home & Living': 'HEARTHSIDE',
  'Home':        'HEARTHSIDE',
  'Fashion':     'ATELIER',
  'Beauty':      'LUMIÈRE',
  'Accessories': 'EQUINOX',
}

// Fallback image map
const IMAGE_MAP = {
  1:  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',  // MacBook Pro
  2:  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',  // iPhone 15 Pro
  3:  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',  // Sony Headphones
  4:  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',  // iPad Air
  5:  'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',  // Samsung TV
  6:  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',  // Dell XPS 15
  7:  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',  // Apple Watch Ultra 2
  8:  'https://images.unsplash.com/photo-1588449668338-d15168822481?auto=format&fit=crop&w=800&q=80',  // AirPods Pro 2
  9:  'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',  // Logitech MX Master
  10: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',  // Keychron Q1 Pro
  11: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',  // Dell Monitor
  12: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',  // HP Printer
  13: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',  // Dyson V15
  14: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',  // Instant Pot
  15: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',  // Merino Crewneck
  16: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',  // Leather Jacket
  17: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',  // Linen Trousers
  18: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',  // Canvas Sneakers
  19: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',  // Vitamin C Serum
  20: 'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=800&q=80',  // Perfume
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
  }

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  const isFav = isInWishlist(product.id)
  const brand = BRAND_MAP[product.category] || 'MERIDIAN'
  const imageUrl = product.image_url || IMAGE_MAP[product.id] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
  const inStock = product.stock > 0

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  let badgeText = ''
  if (product.id % 7 === 1) badgeText = 'Bestseller'
  else if (product.id % 7 === 3) badgeText = "Editor's Choice"
  else if (product.id % 7 === 5) badgeText = 'New Arrival'
  else if (product.price > 80000) badgeText = 'Premium'

  return (
    <div className="group relative flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden select-none">
      
      {/* Product Image and Hover Actions */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges Top-Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {badgeText && (
            <span className="bg-slate-900/95 backdrop-blur-xs text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
              {badgeText}
            </span>
          )}
          {discountPercent && (
            <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-xs w-fit">
              -{discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Heart Wishlist button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md transition-all duration-350 hover:scale-110 active:scale-95 z-10 cursor-pointer
            ${isFav ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
        >
          <Heart size={16} className={isFav ? 'fill-red-500 text-red-500' : ''} />
        </button>

        {/* Hover quick add / detail buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 transition-all duration-300 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 z-10">
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className="flex-1 py-2.5 bg-slate-900 text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingCart size={12} />
            {inStock ? 'Add to Cart' : 'Sold Out'}
          </button>
          
          <Link
            to={`/product/${product.id}`}
            className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-800 rounded-xl flex items-center justify-center shadow-lg transition-colors"
            title="View Details"
          >
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 p-4.5 gap-2 text-left">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{brand}</span>
          <span className="text-[10px] text-slate-450 font-medium capitalize bg-slate-55 px-2 py-0.5 rounded-full">{product.category}</span>
        </div>

        {/* Product Name */}
        <Link
          to={`/product/${product.id}`}
          id={`view-product-${product.id}`}
          className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors"
        >
          {product.name}
        </Link>

        {/* Ratings & reviews count */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
          <div className="flex items-center text-amber-400">
            <Star size={11} className="fill-current" />
          </div>
          <span>{product.rating}</span>
          <span className="text-slate-350">|</span>
          <span className="text-slate-400">({(product.id * 17 + 89).toLocaleString()} sold)</span>
        </div>

        {/* Stock status & delivery options */}
        <div className="flex items-center justify-between text-[10px] font-bold mt-1">
          {product.stock <= 15 ? (
            <span className="text-amber-600">Only {product.stock} left in stock</span>
          ) : (
            <span className="text-emerald-600">In Stock</span>
          )}
          <span className="text-slate-400">Free Next-Day</span>
        </div>

        {/* Price Block */}
        <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-baseline gap-2">
          <span className="text-base font-black text-slate-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-slate-450 line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
