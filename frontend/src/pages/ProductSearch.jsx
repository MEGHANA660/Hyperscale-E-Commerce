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
  <div className="animate-pulse flex flex-col bg-white rounded-[22px] border border-slate-200/50 shadow-sm overflow-hidden">
    <div className="aspect-square bg-slate-150 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-2 w-14 bg-slate-150 rounded" />
      <div className="h-3.5 w-3/4 bg-slate-150 rounded" />
      <div className="h-3 w-1/2 bg-slate-150 rounded" />
      <div className="h-4 w-1/3 bg-slate-150 rounded" />
    </div>
  </div>
)

const CATEGORIES = ['All', 'Electronics', 'Laptops', 'Phones', 'Fashion', 'Beauty', 'Home']
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
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
              ${hasActiveFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
          >
            <SlidersHorizontal size={13} />
            Filters{hasActiveFilters ? ` (${[selectedCategory !== 'All', selectedPriceRange !== 'All', selectedRating !== 'All'].filter(Boolean).length})` : ''}
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className={`w-56 shrink-0 bg-white border border-slate-200/60 rounded-[20px] shadow-xs p-5 space-y-6 lg:block
          ${showMobileFilters ? 'block fixed inset-0 z-50 w-72 h-screen overflow-y-auto rounded-none border-0' : 'hidden'}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <SlidersHorizontal size={15} /> Filters
            </h2>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button onClick={clearAll} className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline transition-colors">
                  Clear all
                </button>
              )}
              <button onClick={() => setShowMobileFilters(false)} className="lg:hidden text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Category</h3>
            <div className="flex flex-col gap-0.5">
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
                const count = cat === 'All' ? MOCK.products.length : MOCK.products.filter(p => p.category.toLowerCase() === cat.toLowerCase()).length
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); applyFilters(cat, selectedPriceRange, selectedRating, sortBy) }}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl text-left transition-all
                      ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] font-semibold ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Price Range</h3>
            <div className="flex flex-col gap-0.5">
              {PRICE_RANGES.map(opt => {
                const isActive = selectedPriceRange === opt.val
                return (
                  <button
                    key={opt.val}
                    onClick={() => { setSelectedPriceRange(opt.val); applyFilters(selectedCategory, opt.val, selectedRating, sortBy) }}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl text-left transition-all
                      ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>{opt.label}</span>
                    {isActive && <Check size={11} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2 border-t border-slate-100 pt-5">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Customer Rating</h3>
            <div className="flex flex-col gap-0.5">
              {RATINGS.map(opt => {
                const isActive = selectedRating === opt.val
                return (
                  <button
                    key={opt.val}
                    onClick={() => { setSelectedRating(opt.val); applyFilters(selectedCategory, selectedPriceRange, opt.val, sortBy) }}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl text-left transition-all
                      ${isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
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

        {/* ── Products grid ── */}
        <section className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {[...Array(8)].map((_, i) => <SearchSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[24px] p-16 text-center shadow-xs space-y-3">
              <div className="text-5xl select-none">🔍</div>
              <h3 className="font-bold text-slate-800 text-base">No products found</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                We couldn't find anything matching your criteria. Try adjusting your filters or search term.
              </p>
              <button onClick={clearAll} className="btn-pill-dark text-xs py-2 px-5 mt-2">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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
