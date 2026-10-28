import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, CreditCard, Eye, EyeOff, Lock, Package, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// What happens to an order after you log in and check out (this is the real order flow).
const STEPS = [
  { icon: Package, title: 'Stock is held for you', text: 'Every item in your cart is reserved before you pay, so nothing sells out from under you.' },
  { icon: CreditCard, title: 'Safe, one-time payment', text: 'Retrying never charges you twice, and a failed payment releases your stock.' },
  { icon: ShieldCheck, title: 'Only you see your orders', text: 'Your order history and cancellations are tied to your login.' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Only allow redirects back into this site.
  const next = params.get('next')
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 ' +
    'placeholder:text-slate-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/15'

  return (
    <div className="mx-auto w-full max-w-5xl py-4 sm:py-8">
      <div className="grid overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] lg:grid-cols-[1.05fr_1fr]">

        {/* ── Brand panel (desktop) ─────────────────────────────────────────── */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white lg:flex xl:p-12"
          style={{
            backgroundImage:
              'radial-gradient(520px 320px at 100% 0%, rgba(59,130,246,0.35), transparent 60%),' +
              'radial-gradient(420px 300px at 0% 100%, rgba(37,99,235,0.28), transparent 60%)',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative">
            <span className="text-2xl font-black tracking-tighter">
              aeterna<span className="text-primary-500">.</span>
            </span>
            <h2 className="mt-10 max-w-sm text-4xl font-black leading-[1.05] tracking-tight xl:text-[44px]">
              Welcome back to everyday essentials.
            </h2>
            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-slate-400">
              Log in to check out faster, track your orders and keep your cart safe between visits.
            </p>
          </div>

          <ul className="relative mt-10 space-y-3">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/20 text-primary-300">
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Form panel ────────────────────────────────────────────────────── */}
        <section className="flex flex-col justify-center p-6 sm:p-10 xl:p-14">
          <span className="mb-6 text-xl font-black tracking-tighter text-slate-900 lg:hidden">
            aeterna<span className="text-primary-500">.</span>
          </span>

          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-600">Member login</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Log in to your account</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {target === '/cart' ? 'Log in to finish placing your order. Your cart is saved.' : 'Enter your details to continue.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate={false}>
            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-username" autoComplete="username" required autoFocus
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="your username" className={inputClass}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="your password" className={`${inputClass} pr-12`}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert" id="login-error"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-semibold text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={busy || !username.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3.5 text-sm font-bold text-white
                         shadow-lg shadow-slate-900/20 transition hover:bg-primary-600 hover:shadow-primary-600/30
                         focus:outline-none focus:ring-4 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="loader h-3.5 w-3.5 border-white border-t-transparent" /> Logging in...
                </>
              ) : (
                <>
                  Log in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {import.meta.env.DEV && (
            <button
              type="button" onClick={() => { setUsername('alice_dev'); setPassword('pass123'); setError(null) }}
              className="mt-4 w-full rounded-full border border-dashed border-slate-300 py-2.5 text-xs font-bold text-slate-500 transition hover:border-primary-500 hover:text-primary-600"
            >
              Fill demo account (dev only)
            </button>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-xs font-semibold text-slate-500">
            <Link to="/search" className="transition hover:text-primary-600">← Continue shopping</Link>
            <span className="flex items-center gap-1.5 text-slate-400"><ShieldCheck size={13} /> Secure login</span>
          </div>
        </section>
      </div>
    </div>
  )
}
