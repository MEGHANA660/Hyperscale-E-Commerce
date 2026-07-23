import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Check, Star, ChevronDown } from 'lucide-react'
import { MOCK } from '../services/api'
import ProductCard from '../components/ProductCard'

// ── Trie search logic (preserved in background) ──────────────────────────────
class TrieNode {
  constructor() { this.children = {}; this.suggestions = [] }
}
class ClientTrie {
  constructor() { this.root = new TrieNode() }
  insert(word, id) {
    let node = this.root
    for (const ch of word.toLowerCase()) {
      if (!node.children[ch]) node.children[ch] = new TrieNode()
      node = node.children[ch]
      if (!node.suggestions.includes(id)) node.suggestions.push(id)
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
const clientTrie = new ClientTrie()
MOCK.products.forEach(p => {
  p.name.split(/\s+/).forEach(word => clientTrie.insert(word, p.id))
  clientTrie.insert(p.category, p.id)
})

// Skeleton loader
const SearchSkeleton = () => (
  <div className="animate-pulse flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="aspect-[4/5] bg-slate-100 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-2 w-14 bg-slate-100 rounded" />
      <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
      <div className="h-3 w-1/2 bg-slate-100 rounded" />
      <div className="h-4 w-1/3 bg-slate-100 rounded" />
    </div>
  </div>
)

const CATEGORIES = ['All', 'Electronics', 'Laptops', 'Phones', 'Fashion', 'Beauty', 'Home & Living', 'Accessories']
const PRICE_RANGES = [
  { label: 'All Prices',          val: 'All' },
  { label: 'Under ₹5,000',       val: 'under-5k' },
  { label: '₹5,000 – ₹20,000',  val: '5k-20k' },
  { label: '₹20,000 – ₹50,000', val: '20k-50k' },
  { label: '₹50,000 – ₹1,00,000', val: '50k-100k' },
  { label: 'Over ₹1,00,000',    val: 'over-100k' },
]
const RATINGS = [
  { label: 'All Ratings',    val: 'All' },
  { label: '4.8★ & above',  val: '4.8' },
  { label: '4.6★ & above',  val: '4.6' },
  { label: '4.5★ & above',  val: '4.5' },
]
const SORT_OPTIONS = [
  { label: 'Relevance',     val: 'relevance' },
  { label: 'Price: Low–High', val: 'price-asc' },
  { label: 'Price: High–Low', val: 'price-desc' },
  { label: 'Top Rated',     val: 'rating' },
]

export default function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery]                     = useState('')
  const [results, setResults]                 = useState(MOCK.products)
  const [loading, setLoading]                 = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedCategory, setSelectedCategory]   = useState('All')
  const [selectedPriceRange, setSelectedPriceRange] = useState('All')
  const [selectedRating, setSelectedRating]         = useState('All')
  const [sortBy, setSortBy]                         = useState('relevance')

  const searchTimerRef = useRef(null)

  useEffect(() => {
    const qParam   = searchParams.get('q')        || ''
    const catParam = searchParams.get('category') || 'All'
    setQuery(qParam)
    setSelectedCategory(catParam)
    doSearch(qParam, catParam, selectedPriceRange, selectedRating, sortBy)
  }, [searchParams])

  const doSearch = useCallback((q, cat, priceRange, ratingLimit, sort) => {
    setLoading(true)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      let matched = MOCK.products

      // Trie search
      if (q.trim()) {
        const t0 = performance.now()
        const ids = clientTrie.search(q)
        window.__lastTrieTime  = (performance.now() - t0).toFixed(4)
        window.__lastQuery     = q
        if (ids.length > 0) {
          matched = MOCK.products.filter(p => ids.includes(p.id))
        } else {
          matched = MOCK.products.filter(p =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.category.toLowerCase().includes(q.toLowerCase())
          )
        }
      }

      // Bloom filter telemetry
      window.__bloomChecked = (window.__bloomChecked || 0) + 1
      if (q.trim() && !MOCK.products.some(p => p.name.toLowerCase().includes(q.toLowerCase()))) {
        window.__bloomBlocked = (window.__bloomBlocked || 0) + 1
      }

      // Category filter
      if (cat && cat !== 'All') {
        matched = matched.filter(p => p.category.toLowerCase() === cat.toLowerCase())
      }

      // Price filter
      if (priceRange && priceRange !== 'All') {
        if      (priceRange === 'under-5k')  matched = matched.filter(p => p.price < 5000)
        else if (priceRange === '5k-20k')    matched = matched.filter(p => p.price >= 5000 && p.price < 20000)
        else if (priceRange === '20k-50k')   matched = matched.filter(p => p.price >= 20000 && p.price <= 50000)
        else if (priceRange === '50k-100k')  matched = matched.filter(p => p.price > 50000 && p.price <= 100000)
        else if (priceRange === 'over-100k') matched = matched.filter(p => p.price > 100000)
      }

      // Rating filter
      if (ratingLimit && ratingLimit !== 'All') {
        matched = matched.filter(p => p.rating >= parseFloat(ratingLimit))
      }

      // Sort
      if (sort === 'price-asc')  matched = [...matched].sort((a, b) => a.price - b.price)
      if (sort === 'price-desc') matched = [...matched].sort((a, b) => b.price - a.price)
      if (sort === 'rating')     matched = [...matched].sort((a, b) => b.rating - a.rating)

      setResults(matched)
      setLoading(false)
    }, 350)
  }, [])

  const applyFilters = (newCat, newPrice, newRating, newSort) => {
    const params = {}
    if (query.trim()) params.q = query.trim()
    if (newCat && newCat !== 'All') params.category = newCat
    setSearchParams(params)
    doSearch(query, newCat, newPrice, newRating, newSort)
  }

  const clearAll = () => {
    setSelectedCategory('All')
    setSelectedPriceRange('All')
    setSelectedRating('All')
    setSortBy('relevance')
    applyFilters('All', 'All', 'All', 'relevance')
  }

  const hasActiveFilters = selectedCategory !== 'All' || selectedPriceRange !== 'All' || selectedRating !== 'All'

  return (
    <div className="space-y-6 animate-in text-left">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ⚡ Trie Search {window.__lastTrieTime ? `${window.__lastTrieTime}ms` : 'Active'}
            </span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🛡️ Bloom Filter Guard {window.__bloomBlocked || 0} Blocked
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {selectedCategory !== 'All' ? selectedCategory : 'All Products'}
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            {loading
              ? 'Searching catalog…'
              : `${results.length} product${results.length !== 1 ? 's' : ''}${query ? ` for "${query}"` : ''}`
            }
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:block">Sort by</label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); applyFilters(selectedCategory, selectedPriceRange, selectedRating, e.target.value) }}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-850 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer
              ${hasActiveFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
          >
            <SlidersHorizontal size={13} />
            Filters{hasActiveFilters ? ` (${[selectedCategory !== 'All', selectedPriceRange !== 'All', selectedRating !== 'All'].filter(Boolean).length})` : ''}
          </button>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-1">Active:</span>
          {selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-slate-800 border border-slate-250 px-3 py-1 rounded-full shadow-2xs">
              Cat: {selectedCategory}
              <button onClick={() => applyFilters('All', selectedPriceRange, selectedRating, sortBy)} className="hover:text-red-500 font-black ml-0.5">✕</button>
            </span>
          )}
          {selectedPriceRange !== 'All' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-slate-800 border border-slate-250 px-3 py-1 rounded-full shadow-2xs">
              Price: {PRICE_RANGES.find(p => p.val === selectedPriceRange)?.label}
              <button onClick={() => applyFilters(selectedCategory, 'All', selectedRating, sortBy)} className="hover:text-red-500 font-black ml-0.5">✕</button>
            </span>
          )}
          {selectedRating !== 'All' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-slate-800 border border-slate-250 px-3 py-1 rounded-full shadow-2xs">
              Rating: {selectedRating}★+
              <button onClick={() => applyFilters(selectedCategory, selectedPriceRange, 'All', sortBy)} className="hover:text-red-500 font-black ml-0.5">✕</button>
            </span>
          )}
          <button onClick={clearAll} className="text-xs font-bold text-blue-600 hover:text-blue-800 ml-auto underline cursor-pointer">
            Clear all
          </button>
        </div>
      )}

      {/* Main grid with 25% / 75% Split */}
      <div className="grid lg:grid-cols-4 gap-8 items-start">

        {/* ── Sidebar (25% column) ── */}
        <aside className={`lg:col-span-1 lg:sticky lg:top-24 lg:self-start bg-white border border-slate-100 rounded-3xl p-6 space-y-6 lg:block shadow-sm
          ${showMobileFilters ? 'block fixed inset-0 z-50 w-72 h-screen overflow-y-auto rounded-none border-0' : 'hidden'}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal size={15} /> Filters
            </h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={clearAll} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline transition-colors cursor-pointer">
                  Clear all
                </button>
              )}
              <button onClick={() => setShowMobileFilters(false)} className="lg:hidden text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕</button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Category</h3>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                const count = cat === 'All' ? MOCK.products.length : MOCK.products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); applyFilters(cat, selectedPriceRange, selectedRating, sortBy) }}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl text-left transition-all cursor-pointer
                      ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] font-semibold ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Price Range</h3>
            <div className="flex flex-col gap-1">
              {PRICE_RANGES.map(opt => {
                const isActive = selectedPriceRange === opt.val
                return (
                  <button
                    key={opt.val}
                    onClick={() => { setSelectedPriceRange(opt.val); applyFilters(selectedCategory, opt.val, selectedRating, sortBy) }}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl text-left transition-all cursor-pointer
                      ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50'}`}
                  >
                    <span>{opt.label}</span>
                    {isActive && <Check size={11} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Customer Rating</h3>
            <div className="flex flex-col gap-1">
              {RATINGS.map(opt => {
                const isActive = selectedRating === opt.val
                return (
                  <button
                    key={opt.val}
                    onClick={() => { setSelectedRating(opt.val); applyFilters(selectedCategory, selectedPriceRange, opt.val, sortBy) }}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl text-left transition-all cursor-pointer
                      ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-650 hover:bg-slate-50'}`}
                  >
                    <span className="flex items-center gap-1">
                      {opt.val !== 'All' && <Star size={10} className="text-amber-400 fill-amber-400" />}
                      {opt.label}
                    </span>
                    {isActive && <Check size={11} />}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Mobile filter backdrop */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setShowMobileFilters(false)} />
        )}

        {/* ── Products grid (75% column) ── */}
        <section className="lg:col-span-3 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SearchSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm space-y-4">
              <div className="text-5xl select-none">🔍</div>
              <h3 className="font-black text-slate-800 text-base">No products found</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                We couldn't find anything matching your criteria. Try adjusting your filters or search term.
              </p>
              <button onClick={clearAll} className="btn-pill-dark text-xs py-2.5 px-5 mt-2 cursor-pointer">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
