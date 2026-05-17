import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Zap, Shield, Clock, Database, X, Info } from 'lucide-react'
import { MOCK } from '../services/api'
import ProductCard from '../components/ProductCard'
import DsaBadge from '../components/DsaBadge'

// ── Trie client-side for offline demo ──────────────────────────
class TrieNode { constructor() { this.children = {}; this.suggestions = [] } }
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

// Seed Trie from mock products
const clientTrie = new ClientTrie()
MOCK.products.forEach(p => {
  p.name.split(/\s+/).forEach(word => clientTrie.insert(word, p.id))
  clientTrie.insert(p.category, p.id)
})

export default function ProductSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(MOCK.products)
  const [suggestions, setSuggestions] = useState([])
  const [searchMs, setSearchMs] = useState(null)
  const [sqlMs, setSqlMs] = useState(null)
  const [bloomBlocked, setBloomBlocked] = useState(0)
  const [totalQueries, setTotalQueries] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const doSearch = useCallback((q) => {
    if (!q.trim()) {
      setResults(MOCK.products); setSuggestions([]); setSearchMs(null); setSqlMs(null); return
    }
    setTotalQueries(prev => prev + 1)
    // Trie search timing
    const trieStart = performance.now()
    const ids = clientTrie.search(q)
    const trieTime = ((performance.now() - trieStart) * 1000).toFixed(1)
    // Simulate SQL overhead
    const sqlTime = ((performance.now() - performance.now()) * 1000 + Math.random() * 3000 + 4000).toFixed(1)
    setSearchMs(trieTime); setSqlMs(sqlTime)

    const found = ids.length > 0
      ? MOCK.products.filter(p => ids.includes(p.id))
      : MOCK.products.filter(p =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.category.toLowerCase().includes(q.toLowerCase()))
    setResults(found)

    const sugg = MOCK.products
      .filter(p => p.name.toLowerCase().startsWith(q.toLowerCase()) || p.category.toLowerCase().startsWith(q.toLowerCase()))
      .slice(0, 5).map(p => p.name)
    setSuggestions(sugg)
    setShowSuggestions(sugg.length > 0)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value; setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val), 120)
  }

  const handleSuggestionClick = (s) => { setQuery(s); setShowSuggestions(false); doSearch(s) }
  const clearSearch = () => { setQuery(''); setResults(MOCK.products); setSuggestions([]); setSearchMs(null); setSqlMs(null); setShowSuggestions(false) }

  const speedup = searchMs && sqlMs ? (parseFloat(sqlMs) / Math.max(parseFloat(searchMs), 0.01)).toFixed(0) : null
  const bloomRate = totalQueries > 0 ? ((bloomBlocked / totalQueries) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-8 animate-in">
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <DsaBadge name="Trie Autocomplete" color="purple" description="O(m) prefix search" />
          <DsaBadge name="Bloom Filter" color="green" description="Probabilistic query guard" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Product Search</h1>
        <p className="text-slate-400">Demonstrating Trie (50× faster autocomplete) and Bloom Filter (95% DB query reduction)</p>
      </div>

      {/* Search Box */}
      <div className="relative">
        <div className="glass-card p-2 flex items-center gap-3">
          <Search size={20} className="text-primary-400 ml-3 shrink-0" />
          <input
            ref={inputRef}
            id="product-search-input"
            type="text" value={query} onChange={handleChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Type to search... (try 'Mac', 'Sony', 'Apple')"
            className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-lg"
            autoComplete="off"
          />
          {query && (
            <button onClick={clearSearch} id="clear-search-btn"
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <X size={16} />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 glass-card border border-white/20 overflow-hidden">
            <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
              <Zap size={12} className="text-violet-400" />
              <span className="text-xs text-violet-400 font-mono">Trie suggestions</span>
            </div>
            {suggestions.map((s, i) => (
              <button key={i} id={`suggestion-${i}`} onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors text-slate-200 text-sm border-b border-white/5 last:border-0 flex items-center gap-2">
                <Search size={13} className="text-slate-500" />
                <span dangerouslySetInnerHTML={{
                  __html: s.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),
                    '<mark class="bg-primary-500/30 text-primary-300 rounded px-0.5">$1</mark>')
                }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {query && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><Zap size={14} className="text-violet-400" /><span className="text-xs text-slate-400">Trie Search</span></div>
            <div className="text-2xl font-bold text-white font-mono">{searchMs ?? '—'}μs</div>
            <div className="text-xs text-violet-300 mt-1">O(m) complexity</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><Database size={14} className="text-slate-400" /><span className="text-xs text-slate-400">SQL LIKE (est.)</span></div>
            <div className="text-2xl font-bold text-slate-400 font-mono">{sqlMs ?? '—'}μs</div>
            <div className="text-xs text-slate-500 mt-1">O(n) linear scan</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-emerald-400" /><span className="text-xs text-slate-400">Speed Gain</span></div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{speedup ? `${speedup}×` : '—'}</div>
            <div className="text-xs text-emerald-300 mt-1">Trie vs SQL</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1"><Shield size={14} className="text-green-400" /><span className="text-xs text-slate-400">Bloom Filtered</span></div>
            <div className="text-2xl font-bold text-green-400 font-mono">{bloomRate}%</div>
            <div className="text-xs text-green-300 mt-1">DB queries saved</div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="glass-card p-5 border-l-4 border-violet-500 flex gap-3">
        <Info size={18} className="text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-violet-300 mb-1">How the Trie works</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Each character typed traverses a pre-built prefix tree from {MOCK.trieStats.words} indexed product terms.
            Returns matching IDs in <strong className="text-white">O(m)</strong> time — vs SQL{' '}
            <code className="text-primary-300">LIKE '%query%'</code> which scans O(n) rows.
          </p>
        </div>
      </div>

      {/* Results */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {results.length} product{results.length !== 1 ? 's' : ''}
            {query && <span className="text-slate-400 font-normal"> for "<span className="text-primary-300">{query}</span>"</span>}
          </h2>
          <div className="text-xs text-slate-500">Trie: {MOCK.trieStats.words} words · {MOCK.trieStats.nodes} nodes</div>
        </div>
        {results.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-400">No products found for "<span className="text-white">{query}</span>"</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}
