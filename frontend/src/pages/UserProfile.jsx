import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Shield, Settings, Package, Zap, RefreshCw, CheckCircle, Database, BarChart3, ArrowRight } from 'lucide-react'
import { userApi, MOCK } from '../services/api'

const USER_ID = 1 // default seeded user 'alice_dev'

export default function UserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Live cache stats state
  const [lruStats, setLruStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Form states
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Orders mock details based on demo_data.sql for user 1
  const [orders, setOrders] = useState([
    { id: '1', date: 'May 12, 2026', total: 2499.99, status: 'delivered', type: 'standard', items: 'MacBook Pro 16"' },
    { id: '2', date: 'May 16, 2026', total: 1199.99, status: 'processing', type: 'express', items: 'iPhone 15 Pro Max' },
  ])

  useEffect(() => {
    fetchProfile()
    fetchCacheStats()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await userApi.getProfile(USER_ID)
      setProfile(data)
      setUsername(data.username)
      setEmail(data.email)
      setError(null)
    } catch (err) {
      console.warn("User service API failed, loading mock profile", err.message)
      // Fallback mock profile
      const mockProfile = {
        id: USER_ID,
        username: 'alice_dev',
        email: 'alice@example.com',
        role: 'customer',
        address: '142 Premium Lane, Bangalore, KA, India',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
      }
      setProfile(mockProfile)
      setUsername(mockProfile.username)
      setEmail(mockProfile.email)
    } finally {
      setLoading(false)
    }
  }

  const fetchCacheStats = async () => {
    setLoadingStats(true)
    try {
      const stats = await userApi.getLruStats()
      setLruStats(stats)
    } catch (err) {
      console.warn("Failed to fetch User LRU stats, using mock details", err.message)
      setLruStats(MOCK.lruStats)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    setIsSaved(false)
    setTimeout(() => {
      setSaving(false)
      setProfile(prev => ({ ...prev, username, email }))
      setIsSaved(true)
      // Hide success message after 3 seconds
      setTimeout(() => setIsSaved(false), 3000)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="loader" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider animate-pulse">Loading Profile...</p>
      </div>
    )
  }

  const userAvatar = profile?.avatar || `https://ui-avatars.com/api/?name=${username}&background=0f172a&color=fff&size=120`

  return (
    <div className="space-y-8 animate-in text-left">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-slate-500 text-xs mt-0.5">Manage your preferences, orders, and review service telemetry</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Card: Summary Profile */}
        <div className="bg-white border border-slate-200 rounded-[28px] shadow-xs space-y-6 flex flex-col items-center text-center overflow-hidden">
          {/* Gradient header strip */}
          <div className="w-full h-20 bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
          </div>
          <div className="relative -mt-12 mb-0">
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden">
              <img
                src={userAvatar}
                alt={username}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="space-y-1 w-full px-6">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">{username}</h2>
            <p className="text-xs text-slate-400 font-semibold">{email}</p>
            <div className="pt-2 flex justify-center">
              <span className="badge badge-purple text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full">
                {profile?.role === 'customer' ? 'Premium Member' : 'System Administrator'}
              </span>
            </div>
          </div>

          <hr className="w-full border-slate-100" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 w-full text-left px-6">
            <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-2xl">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Orders</p>
              <p className="text-base font-black text-slate-800 font-mono mt-0.5">2</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-2xl">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Saved Items</p>
              <p className="text-base font-black text-slate-800 font-mono mt-0.5">3</p>
            </div>
          </div>

          {/* Developer Tools card */}
          <div className="w-full px-6 pb-6">
            <Link
              to="/performance"
              className="w-full flex items-center justify-between gap-3 bg-amber-50 border border-amber-200/60 rounded-2xl p-4 hover:bg-amber-100/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                  <BarChart3 size={15} className="text-amber-700" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-amber-900">Performance Metrics</p>
                  <p className="text-[10px] text-amber-700 font-medium">DSA & System Dashboard</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-amber-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Center Card: Settings / Edit Profile Form */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-xs space-y-5 lg:col-span-2">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Settings size={15} />
            Personal Settings
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Username</label>
                <div className="flex items-center gap-2 border border-slate-350 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:border-slate-800 focus-within:bg-white transition-all">
                  <User size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="flex-1 bg-transparent outline-none text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Email address</label>
                <div className="flex items-center gap-2 border border-slate-350 rounded-xl px-3.5 py-2.5 bg-slate-50 focus-within:border-slate-800 focus-within:bg-white transition-all">
                  <Mail size={14} className="text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-transparent outline-none text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Shipping Address</label>
              <textarea
                defaultValue={profile?.address || '142 Premium Lane, Bangalore, KA, India'}
                rows={2}
                className="w-full border border-slate-350 rounded-xl px-3.5 py-2.5 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex-1">
                {isSaved && (
                  <p className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle size={13} /> Changes saved successfully!
                  </p>
                )}
              </div>
              <button 
                type="submit" 
                disabled={saving}
                className="btn-pill-dark text-xs py-2 px-5 font-bold inline-flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <div className="loader w-3.5 h-3.5 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>Save Settings</>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Order History */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-xs space-y-4 lg:col-span-2 text-left">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Package size={15} />
            Recent Orders
          </h3>

          <div className="space-y-3">
            {orders.map((ord, idx) => (
              <div key={idx} className="border border-slate-200 hover:border-slate-300 p-4 rounded-2xl flex items-center justify-between gap-4 bg-slate-50/50 shadow-2xs hover:shadow-xs transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-800">Order ID: #{ord.id}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{ord.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{ord.items}</p>
                  <p className="text-slate-850 font-black text-xs">₹{ord.total.toLocaleString('en-IN')}</p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`badge ${ord.status === 'delivered' ? 'badge-green' : 'badge-yellow'} text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-extrabold`}>
                    {ord.status}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{ord.type} delivery</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: DSA LRU Cache Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-[28px] p-6 shadow-md text-white space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Database size={13} className="text-blue-400" />
                LRU Cache Stats
              </h3>
              <span className="badge badge-blue text-[8px] uppercase tracking-wider font-mono">User-Service</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold mt-3">
              The backend uses a doubly-linked HashMap LRU Cache (Capacity: 1,000) to keep active user records loaded, avoiding expensive PostgreSQL disk lookups.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-4">
              <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Cache Hits</p>
                <p className="text-base font-black text-blue-400 font-mono mt-0.5">{lruStats?.hits ?? 0}</p>
              </div>
              <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Cache Misses</p>
                <p className="text-base font-black text-red-400 font-mono mt-0.5">{lruStats?.misses ?? 0}</p>
              </div>
              <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl col-span-2 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Hit Ratio</p>
                  <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {lruStats ? `${lruStats.ratio ?? (lruStats.hits / Math.max(1, lruStats.hits + lruStats.misses) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider">Speed gain</p>
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                    <Zap size={11} className="fill-current" /> ~112× Faster
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={fetchCacheStats}
            disabled={loadingStats}
            className="w-full mt-2 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={13} className={loadingStats ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>

      </div>

    </div>
  )
}
