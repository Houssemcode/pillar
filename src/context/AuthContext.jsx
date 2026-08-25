import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'
import { clearTokens, hasTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // null = unknown, false = not logged in
  const [loading, setLoading] = useState(true)

  /* ── Bootstrap: try to restore session from stored token ── */
  useEffect(() => {
    if (!hasTokens()) { setLoading(false); setUser(false); return }
    authApi.me()
      .then(setUser)
      .catch(() => { clearTokens(); setUser(false) })
      .finally(() => setLoading(false))
  }, [])

  /* ── Listen for forced logout (401 with no refresh) ─────── */
  useEffect(() => {
    const handle = () => { setUser(false) }
    window.addEventListener('pillar:logout', handle)
    return () => window.removeEventListener('pillar:logout', handle)
  }, [])

  /* ── Auth actions ─────────────────────────────────────────── */
  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)   // saves tokens internally
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (credentials) => {
    const newUser = await authApi.register(credentials)
    // Auto-login after register
    await login({ username: credentials.username, password: credentials.password })
    return newUser
  }, [login])

  const logout = useCallback(() => {
    clearTokens()
    setUser(false)
  }, [])

  const updateMe = useCallback(async (data) => {
    const updated = await authApi.updateMe(data)
    setUser(updated)
    return updated
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
