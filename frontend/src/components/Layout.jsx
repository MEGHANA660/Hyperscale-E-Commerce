import { Link, useLocation, Outlet } from 'react-router-dom'
import { ShoppingCart, Home, Search, BarChart3, Package, Zap } from 'lucide-react'
import { useCart } from '../context/CartContext'

const NAV_ITEMS = [
  { path: '/',            label: 'Home',         icon: Home },
  { path: '/search',      label: 'Search',       icon: Search },
  { path: '/cart',        label: 'Cart',         icon: ShoppingCart },
  { path: '/performance', label: 'Performance',  icon: BarChart3 },
]

export default function Layout() {
  const location = useLocation()
  const { count } = useCart()

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-lg bg-dark-950/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" id="nav-logo">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center
                            group-hover:scale-110 transition-transform duration-200 neon-blue">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">HyperScale Commerce</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
              return (
                <Link
                  key={path}
                  to={path}
                  id={`nav-${label.toLowerCase()}`}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:block">{label}</span>
                  {label === 'Cart' && count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs
                                     font-bold rounded-full flex items-center justify-center animate-pulse-slow">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Package size={14} />
          <span>HyperScale Commerce — Phase 1</span>
        </div>
        <p className="text-xs">7 DSA implementations · 5 Microservices · FastAPI + React</p>
      </footer>
    </div>
  )
}
