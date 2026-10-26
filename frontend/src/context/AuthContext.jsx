import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { userApi, getStoredUser, getToken, saveSession, clearSession } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null))

  // Token rejected by a service (expired) -> api.js clears storage and fires this.
  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('hsc-logout', onLogout)
    return () => window.removeEventListener('hsc-logout', onLogout)
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await userApi.login({ username, password })
    saveSession(data.access_token, data.user)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
