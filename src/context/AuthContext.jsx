import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authApi } from '../api/auth'
import { clearTokens, hasTokens, getAccessToken } from '../api/axiosInstance'

const AuthContext = createContext(null)

/**
 * Parses JWT payload safely without requiring external library
 */
function parseJwt(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const toastRef = useRef(null)

  /* ── Bootstrap: Restore session from stored token ── */
  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      if (!hasTokens()) {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      // Optimistically decode stored token for instant identity
      const token = getAccessToken()
      const payload = parseJwt(token)
      if (payload && payload.username && isMounted) {
        setUser((prev) => prev || { id: payload.user_id, username: payload.username })
      }

      try {
        const fullUser = await authApi.me()
        if (isMounted) {
          setUser(fullUser)
        }
      } catch (err) {
        // If 401 and refresh also fails, clearTokens & nullify
        if (isMounted) {
          clearTokens()
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  /* ── Listen for forced logout (401 with failed refresh) ── */
  useEffect(() => {
    const handleLogout = () => {
      clearTokens()
      setUser(null)
    }

    window.addEventListener('pillar:logout', handleLogout)
    return () => window.removeEventListener('pillar:logout', handleLogout)
  }, [])

  /* ── Listen for session expiry notification ── */
  useEffect(() => {
    const handleExpired = (e) => {
      if (toastRef.current) {
        toastRef.current(e.detail?.message || 'Your session has expired. Please log in again.')
      }
    }

    window.addEventListener('pillar:session-expired', handleExpired)
    return () => window.removeEventListener('pillar:session-expired', handleExpired)
  }, [])

  /* ── Auth Actions ── */
  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)
    if (data.user) {
      setUser(data.user)
    } else {
      // If endpoint returned only tokens, fetch user
      const meData = await authApi.me().catch(() => null)
      if (meData) setUser(meData)
      else {
        const payload = parseJwt(data.access)
        setUser({ id: payload?.user_id, username: credentials.username })
      }
    }
    return data
  }, [])

  const register = useCallback(
    async (credentials) => {
      const data = await authApi.register(credentials)
      if (data.access && data.user) {
        setUser(data.user)
      } else {
        // If register only created user without returning tokens, login automatically
        await login({ username: credentials.username, password: credentials.password })
      }
      return data
    },
    [login]
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const updateMe = useCallback(async (patch) => {
    const updated = await authApi.updateMe(patch)
    setUser(updated)
    return updated
  }, [])

  const setSessionExpiredToast = useCallback((fn) => {
    toastRef.current = fn
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateMe,
        setSessionExpiredToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
