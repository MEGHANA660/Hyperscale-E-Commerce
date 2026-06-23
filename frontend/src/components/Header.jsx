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
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="w-full bg-slate-900 text-white text-[10px] sm:text-xs py-1.5 px-4 text-center tracking-wide font-medium">
        Free 2-day shipping on orders over ₹5,000 · 60-day returns · Members earn 2× points
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo and Categories Links */}
        <div className="flex items-center gap-6 sm:gap-10 shrink-0">
          <Link to="/" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter select-none flex items-center gap-2">
            aeterna<span className="text-slate-900">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-800">
            <Link to="/search" className="hover:text-slate-500 transition-colors">Shop</Link>
            <Link to="/search" className="hover:text-slate-500 transition-colors">New In</Link>
            <Link to="/search?category=Fashion" className="hover:text-slate-500 transition-colors">Fashion</Link>
            <Link to="/search?category=Electronics" className="hover:text-slate-500 transition-colors">Electronics</Link>
            <Link to="/search?category=Beauty" className="hover:text-slate-500 transition-colors">Beauty</Link>
          </nav>
        </div>

        {/* Center Search Bar */}
        <form 
          ref={containerRef}
          onSubmit={handleSearchSubmit} 
          className="relative flex-1 max-w-md mx-auto hidden sm:block"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search for products, brands"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-slate-800 text-xs font-medium focus:outline-none focus:border-slate-800 focus:bg-white transition-all placeholder-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-10 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-0 h-full px-3 text-slate-500 hover:text-slate-800 rounded-r-md"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50 py-1">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-between border-b border-slate-100 last:border-b-0"
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
            className="p-2 hover:text-slate-500 transition-colors sm:hidden"
            title="Search"
          >
            <Search size={18} />
          </Link>

          {/* User Icon -> Profile */}
          <Link 
            to="/profile" 
            className="p-2 hover:text-slate-500 transition-colors flex items-center justify-center rounded-full hover:bg-slate-100/60"
            title="User Profile"
          >
            <User size={18} />
          </Link>

          {/* Heart Icon -> Wishlist */}
          <Link 
            to="/wishlist"
            className="relative p-2 hover:text-slate-500 transition-colors flex items-center justify-center rounded-full hover:bg-slate-100/60"
            title="Wishlist"
          >
            <Heart size={18} className={wishlistCount > 0 ? 'text-red-500 fill-red-500 animate-pulse-subtle' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
          </Link>
          
          {/* Cart Icon */}
          <Link 
            to="/cart" 
            className="relative p-2 hover:text-slate-500 transition-colors flex items-center justify-center rounded-full hover:bg-slate-100/60"
            title="Shopping Cart"
          >
            <ShoppingCart size={18} />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-slate-900 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:text-slate-500 hover:bg-slate-100/60 rounded-full md:hidden flex items-center justify-center"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md animate-in py-4 px-6 space-y-4 shadow-lg absolute left-0 right-0 top-full">
          <nav className="flex flex-col gap-3.5 text-sm font-bold text-slate-800 text-left">
            <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors">Shop All</Link>
            <Link to="/search?category=Fashion" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors">Fashion</Link>
            <Link to="/search?category=Electronics" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors">Electronics</Link>
            <Link to="/search?category=Beauty" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors">Beauty</Link>
            <Link to="/search?category=Home" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors">Home & Living</Link>
            <hr className="border-slate-100" />
            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors flex items-center justify-between">
              <span>My Wishlist</span>
              {wishlistCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{wishlistCount}</span>}
            </Link>
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-slate-500 transition-colors">My Account</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
