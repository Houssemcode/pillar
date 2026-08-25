import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')   // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (tab === 'register' && form.password !== form.password2) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      if (tab === 'login') {
        await login({ username: form.username, password: form.password })
      } else {
        await register({ username: form.username, email: form.email, password: form.password, password2: form.password2 })
      }
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat()
        setError(msgs[0] || 'Something went wrong.')
      } else {
        setError('Cannot reach server. Is the backend running?')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background glow */}
      <div className="auth-glow" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🏛️</div>
          <div className="auth-logo-text">Pillar</div>
          <div className="auth-logo-sub">Your productivity fortress</div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('login'); setError('') }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              className="auth-input"
              type="text"
              placeholder="yourname"
              value={form.username}
              onChange={set('username')}
              required
              autoComplete="username"
            />
          </div>

          {tab === 'register' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {tab === 'register' && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password2">Confirm Password</label>
              <input
                id="auth-password2"
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={form.password2}
                onChange={set('password2')}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            id="auth-submit"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo hint */}
        <div className="auth-hint">
          Demo: <strong>demo</strong> / <strong>pillar123</strong>
        </div>
      </div>
    </div>
  )
}
