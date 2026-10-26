import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  return (
    <div className="max-w-sm mx-auto py-16">
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-[28px] p-8 space-y-4 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">Log in</h1>
        <p className="text-xs text-slate-500 text-center">Log in to place orders and see your order history.</p>
        <input
          id="login-username" aria-label="Username" autoComplete="username" required
          value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        <input
          id="login-password" aria-label="Password" type="password" autoComplete="current-password" required
          value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        {error && (
          <div role="alert" id="login-error" className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}
        <button type="submit" disabled={busy} className="btn-pill-dark w-full py-3">
          {busy ? 'Logging in...' : 'Log in'}
        </button>
        {import.meta.env.DEV && (
          <p className="text-[11px] text-slate-400 text-center">Demo user (from seed_db.py): alice_dev / pass123</p>
        )}
      </form>
    </div>
  )
}
