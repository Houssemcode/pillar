/**
 * api/client.js
 * Axios instance with JWT auto-attach and silent token refresh.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/* ── Request: attach access token ─────────────────────────── */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pillar_access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/* ── Response: auto-refresh on 401 ───────────────────────── */
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refresh = localStorage.getItem('pillar_refresh')
      if (!refresh) {
        // No refresh token → force logout
        clearTokens()
        window.dispatchEvent(new Event('pillar:logout'))
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh })
        const newAccess = res.data.access
        localStorage.setItem('pillar_access', newAccess)
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return client(original)
      } catch (refreshError) {
        processQueue(refreshError)
        clearTokens()
        window.dispatchEvent(new Event('pillar:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function saveTokens({ access, refresh }) {
  localStorage.setItem('pillar_access', access)
  localStorage.setItem('pillar_refresh', refresh)
}

export function clearTokens() {
  localStorage.removeItem('pillar_access')
  localStorage.removeItem('pillar_refresh')
}

export function hasTokens() {
  return !!localStorage.getItem('pillar_access')
}

export default client
