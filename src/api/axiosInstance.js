import axios from 'axios'

/**
 * Single Source of Truth Axios Instance with JWT handling:
 * - Automatically attaches Authorization: Bearer <access_token>
 * - Intercepts 401 Unauthorized responses
 * - Queues concurrent requests and silently refreshes token via /api/auth/refresh/
 * - Seamlessly retries original requests with fresh token
 */

const ACCESS_TOKEN_KEY = 'pillar_access'
const REFRESH_TOKEN_KEY = 'pillar_refresh'

// Dynamic API Base URL with fallback for production (Render) and local dev
const rawBaseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim().replace(/\/+$/, '')
export const API_BASE_URL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL}/api`

export function getAccessToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('pillar_access_token') ||
    null
  )
}

export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem('refresh_token') ||
    localStorage.getItem('pillar_refresh_token') ||
    null
  )
}

export function saveTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem('access_token', access)
    localStorage.setItem('pillar_access_token', access)
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('pillar_refresh_token', refresh)
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem('access_token')
  localStorage.removeItem('pillar_access_token')
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('pillar_refresh_token')
}

export function hasTokens() {
  return Boolean(getAccessToken())
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Bearer token & normalize API path
axiosInstance.interceptors.request.use(
  (config) => {
    // Normalize relative paths so '/tasks/', '/api/tasks/', and 'tasks/' all route accurately
    if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      let relativeUrl = config.url
      if (relativeUrl.startsWith('/api/')) {
        relativeUrl = relativeUrl.slice(5)
      } else if (relativeUrl.startsWith('api/')) {
        relativeUrl = relativeUrl.slice(4)
      } else if (relativeUrl.startsWith('/')) {
        relativeUrl = relativeUrl.slice(1)
      }
      config.url = relativeUrl
    }

    const token = getAccessToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: 401 silent token refresh queue
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const requestUrl = originalRequest.url || ''
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login/') ||
      requestUrl.includes('/api/auth/register/') ||
      requestUrl.includes('/api/auth/refresh/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        window.dispatchEvent(new Event('pillar:logout'))
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshEndpoint = `${API_BASE_URL}/auth/refresh/`
        // Direct axios call without interceptors to avoid circular refresh loops
        const refreshResponse = await axios.post(refreshEndpoint, { refresh: refreshToken })
        const { access, refresh: newRefresh } = refreshResponse.data

        saveTokens({ access, refresh: newRefresh || refreshToken })
        processQueue(null, access)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${access}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.dispatchEvent(
          new CustomEvent('pillar:session-expired', {
            detail: { message: 'Your session has expired. Please log in again.' },
          })
        )
        window.dispatchEvent(new Event('pillar:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { axiosInstance }
export default axiosInstance
