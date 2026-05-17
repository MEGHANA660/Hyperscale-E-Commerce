import { useState, useEffect } from 'react'
import { BarChart3, Zap, Shield, GitBranch, Package, TrendingUp, Cpu, RefreshCw } from 'lucide-react'
import DsaBadge from '../components/DsaBadge'
import { MOCK } from '../services/api'

const DSA_METRICS = [
  {
    id: 'lru',
    name: 'LRU Cache',
    color: 'blue',
    icon: Zap,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    stats: [
      { label: 'Cache Hits', value: '847', unit: 'req' },
      { label: 'Cache Misses', value: '153', unit: 'req' },
      { label: 'Hit Ratio', value: '84.7', unit: '%' },
      { label: 'Speedup', value: '100×', unit: '' },
    ],
    comparison: { baseline: 'DB Query: ~45ms', optimized: 'Cache Hit: ~0.4ms', gain: '100×' },
    complexity: { time: 'O(1)', space: 'O(n)' },
    description: 'Doubly-linked list + HashMap. Evicts Least Recently Used on capacity overflow.',
    bar: 99,
  },
  {
    id: 'trie',
    name: 'Trie Search',
    color: 'purple',
    icon: TrendingUp,
    iconColor: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    stats: [
      { label: 'Words Indexed', value: '1,247', unit: '' },
      { label: 'Trie Search', value: '0.12', unit: 'ms' },
      { label: 'SQL LIKE', value: '6.4', unit: 'ms' },
      { label: 'Speedup', value: '53×', unit: '' },
    ],
    comparison: { baseline: 'SQL LIKE: 6.4ms', optimized: 'Trie: 0.12ms', gain: '53×' },
    complexity: { time: 'O(m)', space: 'O(ALPHABET×N)' },
    description: 'Prefix tree where each edge is a character. O(m) search independent of dataset size.',
    bar: 98,
  },
  {
    id: 'bloom',
    name: 'Bloom Filter',
    color: 'green',
    icon: Shield,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    stats: [
      { label: 'Bit Array Size', value: '95,850', unit: 'bits' },
      { label: 'Hash Functions', value: '4', unit: 'k' },
      { label: 'Queries Blocked', value: '9,524', unit: '' },
      { label: 'DB Load Reduced', value: '95.2', unit: '%' },
    ],
    comparison: { baseline: 'Without: 10,000 DB hits', optimized: 'With: 476 DB hits', gain: '95%' },
    complexity: { time: 'O(k)', space: 'O(m)' },
    description: 'Probabilistic data structure using k hash functions. Zero false negatives.',
    bar: 95,
  },
  {
    id: 'bfs',
    name: 'Graph BFS',
    color: 'yellow',
    icon: GitBranch,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    stats: [
      { label: 'Product Nodes', value: '12', unit: '' },
      { label: 'Graph Edges', value: '28', unit: '' },
      { label: 'BFS Depth', value: '2', unit: '' },
      { label: 'Avg Recs', value: '4.2', unit: '/product' },
    ],
    comparison: { baseline: 'Manual join: O(E×V)', optimized: 'BFS: O(V+E)', gain: 'Intelligent' },
    complexity: { time: 'O(V+E)', space: 'O(V)' },
    description: 'Adjacency list graph of products. BFS at depth=2 finds 2nd-degree related products.',
    bar: 88,
  },
  {
    id: 'heap',
    name: 'Min Heap',
    color: 'red',
    icon: Package,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    stats: [
      { label: 'Queue Size', value: '23', unit: 'orders' },
      { label: 'Min Priority', value: '1', unit: '(Express)' },
      { label: 'Operations', value: '1,892', unit: '' },
      { label: 'Push/Pop Time', value: 'O(log n)', unit: '' },
    ],
    comparison: { baseline: 'FIFO Queue: No priority', optimized: 'Min Heap: Express first', gain: 'O(log n)' },
    complexity: { time: 'O(log n)', space: 'O(n)' },
    description: 'Binary heap ensures highest priority orders (lowest priority number) processed first.',
    bar: 82,
  },
  {
    id: 'segment',
    name: 'Segment Tree',
    color: 'cyan',
    icon: BarChart3,
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    stats: [
      { label: 'Data Points', value: '1,000', unit: '' },
      { label: 'Range Queries', value: '4,521', unit: '' },
      { label: 'Avg Query Time', value: '0.08', unit: 'ms' },
      { label: 'vs Naive O(n)', value: '125×', unit: 'faster' },
    ],
    comparison: { baseline: 'Linear scan: O(n)', optimized: 'Segment Tree: O(log n)', gain: '125×' },
    complexity: { time: 'O(log n)', space: 'O(n)' },
    description: 'Tree structure enabling range sum/min/max queries and point updates in O(log n).',
    bar: 92,
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    color: 'pink',
    icon: Cpu,
    iconColor: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    stats: [
      { label: 'Algorithm', value: '0/1', unit: 'Knapsack' },
      { label: 'Discount Options', value: '4', unit: '' },
      { label: 'Max Conversion', value: '+23', unit: '%' },
      { label: 'Memoized States', value: 'O(n·W)', unit: '' },
    ],
    comparison: { baseline: 'Greedy: suboptimal', optimized: 'DP: optimal combination', gain: 'Optimal' },
    complexity: { time: 'O(n·W)', space: 'O(n·W)' },
    description: 'Bottom-up knapsack selects optimal discounts to maximize conversion rate within budget.',
    bar: 75,
  },
]

// Segment Tree range query demo
class SegmentTree {
  constructor(data) {
    this.n = data.length
    this.tree = new Array(4 * this.n).fill(0)
    if (this.n > 0) this._build(data, 1, 0, this.n - 1)
  }
  _build(data, node, start, end) {
    if (start === end) { this.tree[node] = data[start]; return }
    const mid = Math.floor((start + end) / 2)
    this._build(data, 2 * node, start, mid)
    this._build(data, 2 * node + 1, mid + 1, end)
    this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1]
  }
  query(L, R) { return this._query(1, 0, this.n - 1, L, R) }
  _query(node, start, end, L, R) {
    if (R < start || end < L) return 0
    if (L <= start && end <= R) return this.tree[node]
    const mid = Math.floor((start + end) / 2)
    return this._query(2 * node, start, mid, L, R) + this._query(2 * node + 1, mid + 1, end, L, R)
  }
}

const salesData = [120, 85, 200, 150, 300, 250, 180, 95, 320, 410, 290, 175]
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const segTree = new SegmentTree(salesData)

export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('lru')
  const [rangeL, setRangeL] = useState(2)
  const [rangeR, setRangeR] = useState(7)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100)
  }, [])

  const active = DSA_METRICS.find(d => d.id === activeTab)
  const rangeSum = segTree.query(rangeL, rangeR)

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Performance Dashboard</h1>
        <p className="text-slate-400">Real-time metrics for all 7 DSA implementations</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-2xl font-black text-emerald-400">100×</div>
          <div className="text-xs text-slate-400">LRU Cache Speedup</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-black text-violet-400">53×</div>
          <div className="text-xs text-slate-400">Trie vs SQL LIKE</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-black text-emerald-400">95.2%</div>
          <div className="text-xs text-slate-400">Bloom DB Reduction</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl font-black text-cyan-400">125×</div>
          <div className="text-xs text-slate-400">Segment Tree Query</div>
        </div>
      </div>

      {/* Bar Chart — All DSAs */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-6">Performance Improvement by DSA</h2>
        <div className="space-y-4">
          {DSA_METRICS.map(dsa => (
            <div key={dsa.id} className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <DsaBadge name={dsa.name} color={dsa.color} />
              </div>
              <div className="flex-1 h-8 bg-dark-900 rounded-lg overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-lg perf-bar flex items-center justify-end pr-3 text-xs font-bold text-white"
                  style={{ width: animated ? `${dsa.bar}%` : '0%' }}
                >
                  {dsa.bar}%
                </div>
              </div>
              <div className="w-24 text-right text-sm font-bold text-white shrink-0">{dsa.comparison.gain}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DSA Tabs */}
      <div>
        <div className="flex flex-wrap gap-2 mb-6" role="tablist">
          {DSA_METRICS.map(dsa => (
            <button
              key={dsa.id}
              id={`tab-${dsa.id}`}
              role="tab"
              aria-selected={activeTab === dsa.id}
              onClick={() => setActiveTab(dsa.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === dsa.id
                  ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : 'text-slate-400 hover:text-white glass-card'}`}
            >
              <dsa.icon size={14} />
              {dsa.name}
            </button>
          ))}
        </div>

        {/* Detail Card */}
        {active && (
          <div className={`glass-card p-6 border ${active.borderColor} animate-in`}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className={`w-12 h-12 rounded-xl ${active.bgColor} flex items-center justify-center mb-3`}>
                  <active.icon size={24} className={active.iconColor} />
                </div>
                <h3 className="text-xl font-bold text-white">{active.name}</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-lg">{active.description}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="font-mono text-emerald-400 font-bold">{active.complexity.time}</div>
                  <div className="text-xs text-slate-500">Time</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-blue-400 font-bold">{active.complexity.space}</div>
                  <div className="text-xs text-slate-500">Space</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {active.stats.map(s => (
                <div key={s.label} className="bg-dark-900 rounded-xl p-4 border border-white/5">
                  <div className="text-xl font-bold text-white font-mono">{s.value}<span className="text-xs text-slate-500 ml-1">{s.unit}</span></div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Comparison */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-xs text-red-400 mb-1 font-semibold">Without DSA</div>
                <div className="text-white font-mono text-sm">{active.comparison.baseline}</div>
              </div>
              <div className="flex items-center justify-center text-2xl font-black text-emerald-400 px-2">→</div>
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="text-xs text-emerald-400 mb-1 font-semibold">With DSA ({active.name})</div>
                <div className="text-white font-mono text-sm">{active.comparison.optimized}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Segment Tree Interactive Demo */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={20} className="text-cyan-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Segment Tree — Live Range Query Demo</h3>
            <p className="text-xs text-slate-400">Query monthly sales sum in O(log n)</p>
          </div>
          <DsaBadge name="Segment Tree" color="cyan" />
        </div>

        {/* Sales Bars */}
        <div className="flex items-end gap-1 h-32 mb-4">
          {salesData.map((v, i) => {
            const inRange = i >= rangeL && i <= rangeR
            const height = (v / Math.max(...salesData)) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    inRange ? 'bg-gradient-to-t from-cyan-600 to-cyan-400' : 'bg-dark-700'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-slate-500">{months[i]}</span>
              </div>
            )
          })}
        </div>

        {/* Range Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">From:</label>
            <select id="range-start" value={rangeL} onChange={e => setRangeL(parseInt(e.target.value))}
              className="input-field text-sm py-2">
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">To:</label>
            <select id="range-end" value={rangeR} onChange={e => setRangeR(parseInt(e.target.value))}
              className="input-field text-sm py-2">
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="glass-card px-5 py-3 flex items-center gap-2">
            <span className="text-slate-400 text-sm">Range Sum ({months[rangeL]}–{months[rangeR]}):</span>
            <span className="text-2xl font-bold text-cyan-400 font-mono">{rangeSum.toLocaleString()}</span>
            <span className="text-slate-500 text-xs">units sold</span>
          </div>
        </div>
      </div>
    </div>
  )
}
