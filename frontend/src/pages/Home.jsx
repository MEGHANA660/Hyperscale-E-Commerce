import { Link } from 'react-router-dom'
import { Zap, Search, BarChart3, ShoppingCart, ArrowRight, CheckCircle, Database, Cpu } from 'lucide-react'
import DsaBadge from '../components/DsaBadge'

const DSA_IMPLEMENTATIONS = [
  {
    name: 'LRU Cache',
    description: 'O(1) get/put for user sessions and product detail caching',
    color: 'blue',
    improvement: '100x faster',
    service: 'User Service',
    complexity: 'O(1)',
    icon: '⚡',
  },
  {
    name: 'Trie (Prefix Tree)',
    description: 'Instant autocomplete with O(m) search vs O(n) SQL LIKE',
    color: 'purple',
    improvement: '50x faster',
    service: 'Product Service',
    complexity: 'O(m)',
    icon: '🔍',
  },
  {
    name: 'Bloom Filter',
    description: 'Probabilistic existence check — blocks 95%+ wasteful DB queries',
    color: 'green',
    improvement: '95% query reduction',
    service: 'Product Service',
    complexity: 'O(k)',
    icon: '🛡️',
  },
  {
    name: 'Graph BFS',
    description: '"Customers also bought" via Breadth-First Search on product graph',
    color: 'yellow',
    improvement: 'Intelligent recs',
    service: 'Recommendation Service',
    complexity: 'O(V+E)',
    icon: '🕸️',
  },
  {
    name: 'Min Heap',
    description: 'Priority order queue — Express > Premium > Standard processing',
    color: 'red',
    improvement: 'O(log n) scheduling',
    service: 'Order Service',
    complexity: 'O(log n)',
    icon: '📦',
  },
  {
    name: 'Segment Tree',
    description: 'Range analytics queries in O(log n) over thousands of data points',
    color: 'cyan',
    improvement: 'O(log n) range query',
    service: 'Analytics Service',
    complexity: 'O(log n)',
    icon: '📊',
  },
  {
    name: 'Dynamic Programming',
    description: '0/1 Knapsack for optimal discount combinations to maximize conversion',
    color: 'pink',
    improvement: 'Optimal discount strategy',
    service: 'Analytics Service',
    complexity: 'O(n·W)',
    icon: '💡',
  },
]

const PAGES = [
  {
    path: '/search',
    title: 'Product Search',
    subtitle: 'Trie Autocomplete + Bloom Filter Demo',
    icon: Search,
    color: 'from-violet-600 to-blue-600',
    dsas: ['Trie', 'Bloom Filter'],
  },
  {
    path: '/performance',
    title: 'Performance Dashboard',
    subtitle: 'All 7 DSA metrics in real-time',
    icon: BarChart3,
    color: 'from-emerald-600 to-cyan-600',
    dsas: ['All 7 DSAs'],
  },
  {
    path: '/cart',
    title: 'Shopping Cart',
    subtitle: 'Min Heap orders + DP discounts',
    icon: ShoppingCart,
    color: 'from-orange-600 to-red-600',
    dsas: ['Min Heap', 'DP'],
  },
]

export default function Home() {
  return (
    <div className="space-y-16 animate-in">
      {/* Hero */}
      <section className="text-center py-16 relative">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full
                          bg-primary-600/10 blur-3xl" />
          <div className="absolute top-20 left-1/3 w-64 h-64 rounded-full
                          bg-accent-600/8 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10
                          border border-primary-500/30 text-primary-300 text-sm font-medium mb-6">
            <Cpu size={14} />
            Phase 1 — 7 DSA Implementations Active
          </div>

          <h1 className="text-5xl sm:text-6xl font-black mb-4">
            <span className="text-white">HyperScale</span>{' '}
            <span className="gradient-text">Commerce</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            A production-ready microservices e-commerce platform powered by{' '}
            <strong className="text-white">7 DSA implementations</strong> to achieve
            real measurable performance improvements.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search" id="hero-search-btn" className="btn-primary flex items-center gap-2 justify-center">
              <Search size={18} />
              Try Live Search Demo
              <ArrowRight size={16} />
            </Link>
            <Link to="/performance" id="hero-perf-btn" className="btn-secondary flex items-center gap-2 justify-center">
              <BarChart3 size={18} />
              View Performance Stats
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'DSA Implementations', value: '7', icon: Cpu },
          { label: 'Microservices', value: '5', icon: Database },
          { label: 'API Endpoints', value: '28+', icon: Zap },
          { label: 'Max Performance Gain', value: '100×', icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-card text-center">
            <Icon size={20} className="text-primary-400 mx-auto mb-2" />
            <div className="text-3xl font-black gradient-text">{value}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </section>

      {/* Quick Nav Pages */}
      <section>
        <h2 className="section-title">Explore Features</h2>
        <p className="section-subtitle">Each page demonstrates live DSA algorithms</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {PAGES.map(({ path, title, subtitle, icon: Icon, color, dsas }) => (
            <Link
              key={path}
              to={path}
              id={`home-nav-${title.toLowerCase().replace(/\s/g,'-')}`}
              className="glass-card-hover p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4
                               group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-primary-300 transition-colors">{title}</h3>
              <p className="text-slate-400 text-sm mb-4">{subtitle}</p>
              <div className="flex flex-wrap gap-2">
                {dsas.map(d => (
                  <span key={d} className="dsa-tag">{d}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DSA Implementation Grid */}
      <section>
        <h2 className="section-title">7 DSA Implementations</h2>
        <p className="section-subtitle">Production-grade algorithms powering every service</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DSA_IMPLEMENTATIONS.map((dsa) => (
            <div key={dsa.name} className="glass-card p-5 hover:border-white/20 transition-all duration-300 group">
              <div className="text-3xl mb-3">{dsa.icon}</div>
              <div className="mb-2">
                <DsaBadge name={dsa.name} color={dsa.color} />
              </div>
              <p className="text-slate-400 text-sm mb-3 leading-relaxed">{dsa.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{dsa.service}</span>
                <span className="font-mono bg-dark-800 text-emerald-400 px-2 py-0.5 rounded border border-white/5">{dsa.complexity}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">{dsa.improvement}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Overview */}
      <section>
        <h2 className="section-title">System Architecture</h2>
        <p className="section-subtitle">Microservices communicating independently</p>
        <div className="glass-card p-6">
          <pre className="code-block text-xs leading-relaxed overflow-x-auto">{`
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│              Tailwind CSS + React Router                     │
└────────────┬────────────────────────────────────────────────┘
             │  HTTP REST API calls
   ┌──────────┴───────────────────────────────────────────┐
   │                                                       │
┌──▼──────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│ User Service│  │Product Svc  │  │ Order Service        │ │
│ Port: 8002  │  │ Port: 8001  │  │ Port: 8003           │ │
│ ⚡ LRU Cache│  │🔍 Trie      │  │ 📦 Min Heap          │ │
│             │  │🛡️ BloomFltr │  │                      │ │
└──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘ │
       │                │                     │             │
   ┌───▼────────────────▼─────────────────────▼──────────┐  │
   │                  PostgreSQL DB                       │  │
   │          Shared relational data store                │  │
   └──────────────────────────────────────────────────────┘  │
                                                             │
┌──────────────────────────┐  ┌───────────────────────────┐  │
│  Recommendation Service  │  │  Analytics Service        │  │
│  Port: 8004              │  │  Port: 8005               │  │
│  🕸️  Graph BFS           │  │  📊 Segment Tree          │  │
│                          │  │  💡 Dynamic Programming   │  │
└──────────────────────────┘  └───────────────────────────┘  │
                                                             │
         Redis (Caching)  +  Elasticsearch (Search)          │
└─────────────────────────────────────────────────────────────┘
`}</pre>
        </div>
      </section>
    </div>
  )
}
