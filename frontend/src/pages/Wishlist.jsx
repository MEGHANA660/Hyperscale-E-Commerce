import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()

  const handleMoveAllToCart = () => {
    wishlist.forEach(item => {
      addToCart(item)
    })
    clearWishlist()
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-20 sm:py-24 space-y-4 animate-in bg-white border border-slate-200 rounded-[32px] p-8 sm:p-12 max-w-xl mx-auto shadow-xs text-left">
        <div className="w-14 h-14 bg-slate-105 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-slate-200/50">
          <Heart size={22} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-center">Your wishlist is empty</h2>
        <p className="text-slate-500 text-xs sm:text-sm text-center leading-relaxed font-medium max-w-xs mx-auto">
          Save your favorite products here to keep track of items you love. Explore the shop to add products.
        </p>
        <div className="pt-4 flex justify-center">
          <Link to="/search" className="btn-pill-dark inline-flex items-center gap-2 text-xs sm:text-sm px-6 py-2.5">
            Discover Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">My Wishlist</h1>
          <p className="text-slate-500 text-xs mt-0.5">Keep track of items you love ({wishlist.length} item{wishlist.length !== 1 ? 's' : ''})</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={clearWishlist}
            className="btn-pill-light text-xs py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
          >
            Clear Wishlist
          </button>
          <button 
            onClick={handleMoveAllToCart}
            className="btn-pill-dark text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
          >
            <ShoppingCart size={13} />
            Move All to Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wishlist.map(product => (
          <div key={product.id} className="relative group/card animate-in">
            <ProductCard product={product} />
            {/* Quick Remove Overlay Button on Card for Wishlist page specifically */}
            <button
              onClick={() => removeFromWishlist(product.id)}
              className="absolute top-5 left-5 p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-100 hover:scale-105 transition-all shadow-xs z-10"
              title="Remove from wishlist"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
