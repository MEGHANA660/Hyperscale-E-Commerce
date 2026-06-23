import { Star, ShoppingCart, ExternalLink, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

// Map products to premium design brand names
const BRAND_MAP = {
  'Laptops':     'NORD & VALE',
  'Phones':      'KESTREL',
  'Electronics': 'AURALIS',
  'Home':        'HEARTHSIDE',
  'Fashion':     'ATELIER',
  'Beauty':      'LUMIÈRE',
}

// Map all 20 products to high-quality Unsplash image URLs
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

// Review counts
const REVIEW_COUNT_MAP = {
  1: 1240, 2: 642,  3: 318,  4: 982,  5: 540,
  6: 2104, 7: 311,  8: 1450, 9: 220,  10: 178,
  11: 450, 12: 129, 13: 384, 14: 591, 15: 267,
  16: 193, 17: 412, 18: 738, 19: 1102, 20: 328,
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
  const imageUrl = IMAGE_MAP[product.id] || IMAGE_MAP[1]
  const reviewsCount = REVIEW_COUNT_MAP[product.id] || 450
  const inStock = product.stock > 0

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  const savings = product.originalPrice ? product.originalPrice - product.price : 0

  let badgeText = ''
  if (product.id === 1 || product.id === 2)  badgeText = 'Bestseller'
  else if (product.id === 3 || product.id === 7)  badgeText = "Editor's Pick"
  else if (product.id === 8 || product.id === 19) badgeText = 'New'

  return (
    <div className="group relative flex flex-col bg-white rounded-[22px] border border-slate-200/70 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden select-none">

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-107"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge top-left */}
        {badgeText && (
          <span className="absolute top-3 left-3 bg-white/95 text-slate-800 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            {badgeText}
          </span>
        )}

        {/* Discount % badge top-right (only if no wishlist overlap) */}
        {discountPercent && !badgeText && (
          <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
            -{discountPercent}%
          </span>
        )}

        {/* Heart Wishlist button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all duration-200 active:scale-90
            ${isFav ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
        >
          <Heart size={15} className={isFav ? 'fill-red-500 text-red-500' : ''} />
        </button>

        {/* Quick add to cart — visible on hover on desktop, always visible on mobile */}
        <button
          onClick={handleAdd}
          disabled={!inStock}
          className="absolute bottom-3 left-3 right-3 py-2 bg-white/95 backdrop-blur-sm text-slate-900 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all duration-250 hover:bg-slate-900 hover:text-white
                     opacity-100 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
        >
          <ShoppingCart size={12} />
          {inStock ? 'Quick Add' : 'Out of Stock'}
        </button>
      </div>

      {/* Info section */}
      <div className="flex flex-col flex-1 p-4 gap-2">

        {/* Brand + category */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase">{brand}</span>
          {discountPercent && (
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Product Name */}
        <Link
          to={`/product/${product.id}`}
          id={`view-product-${product.id}`}
          className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 hover:text-slate-600 transition-colors"
        >
          {product.name}
        </Link>

        {/* Stars + reviews */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < Math.round(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
              />
            ))}
          </div>
          <span className="text-slate-700 font-bold">{product.rating}</span>
          <span className="text-slate-400">({reviewsCount.toLocaleString()})</span>
        </div>

        {/* Price block */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <Link
            to={`/product/${product.id}`}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all flex-shrink-0"
            title="View Details"
          >
            <ExternalLink size={13} />
          </Link>
        </div>

      </div>
    </div>
  )
}
