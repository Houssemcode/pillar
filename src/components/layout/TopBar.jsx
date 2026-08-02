import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { MODULE_THEMES } from '../../theme/moduleThemes'

const PAGE_TITLES = {
  '/':         'Today',
  '/tasks':    'Tasks',
  '/habits':   'Habits',
  '/calendar': 'Calendar',
  '/faith':    'Faith',
  '/focus':    'Focus',
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

export default function TopBar() {
  const location = useLocation()
  const time     = useLiveClock()
  const dropdown = useDropdown()

  const pathname  = location.pathname
  const moduleKey = pathname.replace('/', '') || 'today'
  const theme     = MODULE_THEMES[moduleKey]
  const accent    = theme?.color ?? 'var(--color-primary)'

  const hours   = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const seconds = time.getSeconds().toString().padStart(2, '0')

  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header className="topbar">
      {/* Left: current page breadcrumb */}
      <div className="topbar-page">
        <span className="topbar-page-dot" style={{ background: accent }} />
        <span className="topbar-page-name">
          {PAGE_TITLES[pathname] ?? 'Pillar'}
        </span>
      </div>

      {/* Right: clock + profile */}
      <div className="topbar-right">

        {/* Live clock */}
        <div className="topbar-clock">
          <span className="topbar-clock-time">
            {hours}<span className="topbar-clock-colon">:</span>{minutes}
          </span>
          <span className="topbar-clock-seconds">{seconds}</span>
          <span className="topbar-clock-date">{dateStr}</span>
        </div>

        {/* Profile dropdown */}
        <div className="topbar-profile-root" ref={dropdown.ref}>
          <button
            className="topbar-avatar"
            onClick={() => dropdown.setOpen(o => !o)}
            aria-label="Profile menu"
            style={{ borderColor: dropdown.open ? accent : 'var(--color-border)' }}
          >
            {/* Default avatar initials */}
            <span className="topbar-avatar-initials" style={{ color: accent }}>HM</span>
          </button>

          {dropdown.open && (
            <div className="topbar-dropdown">
              {/* Profile header */}
              <div className="topbar-dropdown-profile">
                <div className="topbar-dropdown-avatar" style={{ borderColor: accent }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>HM</span>
                </div>
                <div>
                  <div className="topbar-dropdown-name">Houssem M.</div>
                  <div className="topbar-dropdown-email">houssem@pillar.app</div>
                </div>
              </div>

              <div className="topbar-dropdown-divider" />

              {/* Menu items */}
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: 'Profile' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2"/></svg>, label: 'Preferences' },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, label: 'Privacy' },
              ].map(item => (
                <button key={item.label} className="topbar-dropdown-item">
                  <span className="topbar-dropdown-item-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div className="topbar-dropdown-divider" />

              <button className="topbar-dropdown-item topbar-dropdown-item--danger">
                <span className="topbar-dropdown-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
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
