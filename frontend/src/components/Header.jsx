import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Search, X, User, Heart, Menu } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { MOCK } from '../services/api'

// Simple Trie client-side for Header autocomplete
class TrieNode {
  constructor() {
    this.children = {}
    this.suggestions = []
  }
}

class HeaderTrie {
  constructor() {
    this.root = new TrieNode()
  }
  insert(word, id) {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode()
      }
      node = node.children[ch]
      if (!node.suggestions.includes(id)) {
        node.suggestions.push(id)
      }
    }
  }
  search(prefix) {
    let node = this.root
    for (const ch of prefix.toLowerCase()) {
      if (!node.children[ch]) return []
      node = node.children[ch]
    }
    return node.suggestions
  }
}

// Seed the Trie for the Header search bar
const headerTrie = new HeaderTrie()
MOCK.products.forEach(p => {
  p.name.split(/\s+/).forEach(word => headerTrie.insert(word, p.id))
  headerTrie.insert(p.category, p.id)
})

export default function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { count } = useCart()
  const { count: wishlistCount } = useWishlist()
  
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const containerRef = useRef(null)

  // Sync query state with URL search param if on the search page
  useEffect(() => {
    const qParam = searchParams.get('q') || ''
    setQuery(qParam)
  }, [searchParams])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)

    if (!val.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Trie suggestion fetch
    const matchedIds = headerTrie.search(val.trim())
    const matchedProducts = MOCK.products.filter(p => matchedIds.includes(p.id))
    
    // Create direct prefix matches first
    const directMatches = MOCK.products.filter(p =>
      p.name.toLowerCase().startsWith(val.toLowerCase()) ||
      p.category.toLowerCase().startsWith(val.toLowerCase())
    )

    const uniqueSuggestions = Array.from(
      new Set([...directMatches, ...matchedProducts])
    ).slice(0, 5)

    setSuggestions(uniqueSuggestions)
    setShowSuggestions(uniqueSuggestions.length > 0)
  }

  const handleSuggestionClick = (prod) => {
    setQuery(prod.name)
    setShowSuggestions(false)
    navigate(`/product/${prod.id}`)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="w-full bg-slate-900 text-white text-[10px] sm:text-xs py-1 px-4 text-center tracking-wide font-medium">
        Free 2-day shipping on orders over ₹5,000 · 60-day returns · Members earn 2× points
      </div>

      {/* Main Navbar */}
      <div className="max-w-full w-full mx-auto px-6 sm:px-12 lg:px-16 xl:px-24 h-14 sm:h-16 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo and Categories Links */}
        <div className="flex items-center gap-6 sm:gap-8 shrink-0">
          <Link to="/" className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter select-none flex items-center gap-1">
            aeterna<span className="text-blue-600 font-extrabold">.</span>
          </Link>
          <nav className="hidden xl:flex items-center gap-5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
            <Link to="/search" className="hover:text-blue-600 transition-colors">Shop All</Link>
            <Link to="/search?category=Fashion" className="hover:text-blue-600 transition-colors">Fashion</Link>
            <Link to="/search?category=Electronics" className="hover:text-blue-600 transition-colors">Electronics</Link>
            <Link to="/search?category=Laptops" className="hover:text-blue-600 transition-colors">Laptops</Link>
            <Link to="/search?category=Phones" className="hover:text-blue-600 transition-colors">Phones</Link>
            <Link to="/search?category=Home%20%26%20Living" className="hover:text-blue-600 transition-colors">Home & Living</Link>
            <Link to="/search?category=Beauty" className="hover:text-blue-600 transition-colors">Beauty</Link>
            <Link to="/search?category=Accessories" className="hover:text-blue-600 transition-colors">Accessories</Link>
          </nav>
        </div>

        {/* Center Search Bar */}
        <form 
          ref={containerRef}
          onSubmit={handleSearchSubmit} 
          className="relative flex-1 max-w-sm mx-auto hidden md:block"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search products, categories..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full py-1.5 pl-4 pr-10 text-slate-800 text-xs font-semibold focus:outline-none focus:border-slate-850 focus:bg-white transition-all placeholder-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-8 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-0 h-full px-3 text-slate-500 hover:text-slate-800 rounded-r-md cursor-pointer"
            >
              <Search size={14} />
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-50 py-1">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-between border-b border-slate-100 last:border-b-0 cursor-pointer"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="text-[9px] text-slate-450 font-mono capitalize bg-slate-100 px-2 py-0.5 rounded">{item.category}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Right Side Links & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-slate-800">
          {/* Mobile Search Link */}
          <Link 
            to="/search" 
            className="p-1.5 hover:text-blue-600 transition-colors md:hidden"
            title="Search"
          >
            <Search size={16} />
          </Link>

          {/* User Icon -> Profile */}
          <Link 
            to="/profile" 
            className="p-1.5 hover:text-blue-600 transition-colors flex items-center justify-center rounded-full hover:bg-slate-100/60"
            title="User Profile"
          >
            <User size={16} />
          </Link>

          {/* Heart Icon -> Wishlist */}
          <Link 
            to="/wishlist"
            className="relative p-1.5 hover:text-blue-600 transition-colors flex items-center justify-center rounded-full hover:bg-slate-100/60"
            title="Wishlist"
          >
            <Heart size={16} className={wishlistCount > 0 ? 'text-red-500 fill-red-500 animate-pulse' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>
          
          {/* Cart Icon */}
          <Link 
            to="/cart" 
            className="relative p-1.5 hover:text-blue-600 transition-colors flex items-center justify-center rounded-full hover:bg-slate-100/60"
            title="Shopping Cart"
          >
            <ShoppingCart size={16} />
            {count > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-slate-900 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:text-blue-600 hover:bg-slate-100/60 rounded-full xl:hidden flex items-center justify-center cursor-pointer"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md animate-in py-4 px-6 space-y-4 shadow-lg absolute left-0 right-0 top-full">
          <nav className="flex flex-col gap-3 text-sm font-bold text-slate-800 text-left">
            <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Shop All</Link>
            <Link to="/search?category=Fashion" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Fashion</Link>
            <Link to="/search?category=Electronics" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Electronics</Link>
            <Link to="/search?category=Laptops" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Laptops</Link>
            <Link to="/search?category=Phones" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Phones</Link>
            <Link to="/search?category=Home%20%26%20Living" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Home & Living</Link>
            <Link to="/search?category=Beauty" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Beauty</Link>
            <Link to="/search?category=Accessories" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">Accessories</Link>
            <hr className="border-slate-100" />
            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>My Wishlist</span>
              {wishlistCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{wishlistCount}</span>}
            </Link>
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-blue-600 transition-colors">My Account</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
