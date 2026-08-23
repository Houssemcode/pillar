import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MODULE_THEMES } from '../../theme/moduleThemes'
import { useUser } from '../../context/UserContext'

const PAGE_TITLES = {
  '/': 'Today',
  '/tasks': 'Tasks',
  '/habits': 'Habits',
  '/calendar': 'Calendar',
  '/faith': 'Faith',
  '/focus': 'Focus',
}

const PAGE_SUB_TITLES = {
  '/': '',
  '/tasks': '',
  '/habits': 'Build consistency, day by day',
  '/calendar': '',
  '/faith': '',
  '/focus': 'Deep work, one session at a time',
}
function useLiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const time = useLiveClock()
  const dropdown = useDropdown()
  const {
    userName, colorTheme, toggleTheme,
    accentColor, setAccentColor, ACCENT_COLORS,
  } = useUser()

  const pathname = location.pathname
  const moduleKey = pathname.replace('/', '') || 'today'
  const theme = MODULE_THEMES[moduleKey]
  const accent = theme?.color ?? 'var(--color-primary)'

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'HM'

  return (
    <header className="topbar">
      {/* Left: current page breadcrumb */}
      <div className="topbar-page">
        <span className="topbar-page-dot" style={{ background: accent }} />
        <div className="topbar-page-content">
          <span className="topbar-page-name">{PAGE_TITLES[pathname] ?? 'Pillar'}</span>
          <span className="topbar-page-subtitle">{PAGE_SUB_TITLES[pathname] ?? ''}</span>
        </div>
      </div>

      {/* Right: clock + theme toggle + profile */}
      <div className="topbar-right">

        {/* Live clock */}
        <div className="topbar-clock">
          <span className="topbar-clock-time">
            {hours}<span className="topbar-clock-colon">:</span>{minutes}
          </span>
          <span className="topbar-clock-seconds">{seconds}</span>
          <span className="topbar-clock-date">{dateStr}</span>
        </div>

        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={colorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={colorTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {colorTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Profile dropdown */}
        <div className="topbar-profile-root" ref={dropdown.ref}>
          <button
            className="topbar-avatar"
            onClick={() => dropdown.setOpen(o => !o)}
            aria-label="Profile menu"
            style={{ borderColor: dropdown.open ? accent : 'var(--color-border)' }}
          >
            <span className="topbar-avatar-initials" style={{ color: accent }}>{initials}</span>
          </button>

          {dropdown.open && (
            <div className="topbar-dropdown">
              {/* Profile header */}
              <div className="topbar-dropdown-profile">
                <div className="topbar-dropdown-avatar" style={{ borderColor: accent }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>{initials}</span>
                </div>
                <div>
                  <div className="topbar-dropdown-name">{userName || 'Welcome!'}</div>
                  <div className="topbar-dropdown-email">pillar.app</div>
                </div>
              </div>

              <div className="topbar-dropdown-divider" />

              {/* Accent color picker */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  Accent Color
                </div>
                <div className="accent-picker">
                  {ACCENT_COLORS.map(a => (
                    <button
                      key={a.key}
                      className={`accent-swatch${accentColor === a.key ? ' accent-swatch--active' : ''}`}
                      style={{ background: a.color }}
                      onClick={() => setAccentColor(a.key)}
                      title={a.label}
                      aria-label={`Set accent to ${a.label}`}
                    />
                  ))}
                </div>
              </div>

              <div className="topbar-dropdown-divider" />

              {/* Menu items */}
              <button className="topbar-dropdown-item">
                <span className="topbar-dropdown-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                Profile
              </button>

              <button
                className="topbar-dropdown-item"
                onClick={() => { dropdown.setOpen(false); navigate('/preferences') }}
              >
                <span className="topbar-dropdown-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2" /></svg>
                </span>
                Preferences
              </button>

              {/* Theme toggle in dropdown too */}
              <button className="topbar-dropdown-item" onClick={toggleTheme}>
                <span className="topbar-dropdown-item-icon">
                  {colorTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </span>
                {colorTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              <div className="topbar-dropdown-divider" />

              <button className="topbar-dropdown-item topbar-dropdown-item--danger">
                <span className="topbar-dropdown-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
