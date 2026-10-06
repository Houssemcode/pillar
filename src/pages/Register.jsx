import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

export default function Register() {
  const { register, user } = useAuth()
  const { colorTheme, toggleTheme } = useUser()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/today', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim()
    if (!cleanUsername) {
      setError('Please choose a username.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== password2) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register({
        username: cleanUsername,
        email: email.trim(),
        password,
        password2,
      })
      navigate('/today', { replace: true })
    } catch (err) {
      const resp = err.response?.data
      if (resp?.detail) {
        setError(resp.detail)
      } else if (resp?.username) {
        setError(Array.isArray(resp.username) ? resp.username[0] : String(resp.username))
      } else if (resp?.password) {
        setError(Array.isArray(resp.password) ? resp.password[0] : String(resp.password))
      } else if (typeof resp === 'object' && resp !== null) {
        const firstVal = Object.values(resp).flat()[0]
        setError(typeof firstVal === 'string' ? firstVal : 'Registration failed. Please try again.')
      } else {
        setError('Cannot reach server. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-[#0a0a0a] relative transition-colors duration-200">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 shadow-sm transition-all focus:outline-none"
          aria-label={colorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={colorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {colorTheme === 'dark' ? (
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-[#121212] rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl transition-colors">
        {/* Header with Centered Logo & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-2xl mb-3 shadow-sm">
            🏛️
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
            Start organizing your tasks, habits, and faith today
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
            <svg
              className="w-4 h-4 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reg-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoComplete="username"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Email <span className="text-gray-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-11 bg-white dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-password2"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <input
              id="reg-password2"
              type={showPassword ? 'text' : 'password'}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-zinc-800">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-sm text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
