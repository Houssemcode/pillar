import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULE_THEMES } from '../../theme/moduleThemes'
import { useUser } from '../../context/UserContext'
import { useAuth } from '../../context/AuthContext'
import NotificationCenter from '../ui/NotificationCenter'
import notificationService from '../../services/notificationService'
import GlobalSearchModal from './GlobalSearchModal'
import KeyboardShortcutsModal from '../ui/KeyboardShortcutsModal'

/* ─── Online status hook ───────────────────────────────────── */
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

const PAGE_TITLE_KEYS = {
  '/': 'nav.today',
  '/tasks': 'nav.tasks',
  '/habits': 'nav.habits',
  '/calendar': 'nav.calendar',
  '/faith': 'nav.faith',
  '/focus': 'nav.focus',
  '/settings': 'settings.title',
  '/profile': 'nav.profile',
  '/trash': 'nav.trash',
  '/adhkar': 'faith.title',
  '/faith/adhkar': 'faith.title',
  '/hadiths': 'faith.title',
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
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const time = useLiveClock()
  const dropdown = useDropdown()
  const { user, logout } = useAuth()
  const {
    userName, firstName, lastName,
    colorTheme, toggleTheme,
    accentColor, setAccentColor, ACCENT_COLORS,
  } = useUser()

  const pathname = location.pathname
  const moduleKey = pathname.replace('/', '') || 'today'
  const theme = MODULE_THEMES[moduleKey]
  const accent = theme?.color ?? 'var(--color-primary)'

  const isRTL = i18n.language?.startsWith('ar')
  const localeCode = isRTL ? 'ar-SA' : 'en-US'

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')
  const dateStr = time.toLocaleDateString(localeCode, { weekday: 'short', month: 'short', day: 'numeric' })

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || userName || user?.username || ''
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const [showSearch, setShowSearch] = useState(false)
  const [showNotifCenter, setShowNotifCenter] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [notifCount, setNotifCount] = useState(() => notificationService.getAll().length)
  const isOnline = useOnlineStatus()

  useEffect(() => {
    notificationService.init()
    setNotifCount(notificationService.getAll().length)
  }, [])

  /* Global keyboard shortcut for search: Ctrl+K / Cmd+K or / */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowSearch(s => !s)
      } else if (e.key === '/' && !isInput) {
        e.preventDefault()
        setShowSearch(true)
      } else if (e.key === '?' && !isInput) {
        e.preventDefault()
        setShowShortcuts(s => !s)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleLanguage = () => {
    const next = isRTL ? 'en' : 'ar'
    i18n.changeLanguage(next)
  }

  const pageTitle = PAGE_TITLE_KEYS[pathname] ? t(PAGE_TITLE_KEYS[pathname]) : t('common.appName')

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, #F43F5E, #EF4444)',
          color: '#fff', fontSize: 12, fontWeight: 700,
          padding: '6px 20px',
          paddingTop: 'calc(6px + env(safe-area-inset-top, 0px))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          boxShadow: '0 2px 12px rgba(244,63,94,0.5)',
          animation: 'slideDown 250ms ease',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
          {t('common.offlineBanner')}
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite 0.5s' }} />
        </div>
      )}
      <header className="topbar" style={{ marginTop: !isOnline ? 34 : 0, transition: 'margin-top 250ms ease' }}>
        {/* Left: current page breadcrumb */}
        <div className="topbar-page">
          <span className="topbar-page-dot" style={{ background: accent }} />
          <div className="topbar-page-content">
            <span className="topbar-page-name">{pageTitle}</span>
          </div>
        </div>

        {/* Center: Global Search Trigger */}
        <button
          className="topbar-search-trigger"
          onClick={() => setShowSearch(true)}
          aria-label={t('common.search')}
          title={`${t('common.searchPlaceholder')} (Ctrl+K)`}
        >
          <svg className="topbar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="topbar-search-placeholder">{t('common.searchPlaceholder')}</span>
          <span className="topbar-search-kbd">
            <span className="topbar-search-kbd-mod">Ctrl</span>
            <span>K</span>
          </span>
        </button>

        {/* Right: clock + notifications + ? help + profile */}
        <div className="topbar-right">

          {/* Live clock */}
          <div className="topbar-clock">
            <span className="topbar-clock-time">
              {hours}<span className="topbar-clock-colon">:</span>{minutes}
            </span>
            <span className="topbar-clock-date">{dateStr}</span>
          </div>

          {/* Notification bell */}
          <div className="topbar-notif-wrap">
            <button
              id="notification-bell-btn"
              className={`topbar-notif-btn ${showNotifCenter ? 'topbar-notif-btn--active' : ''}`}
              onClick={() => setShowNotifCenter(v => !v)}
              title="Notifications"
              aria-label="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 00 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            {notifCount > 0 && (
              <span className="topbar-notif-badge" />
            )}
          </div>

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
                    <div className="topbar-dropdown-name">{displayName || userName || 'Welcome!'}</div>
                    <div className="topbar-dropdown-email">{user?.email || 'user@pillar.app'}</div>
                  </div>
                </div>

                <div className="topbar-dropdown-divider" />

                {/* Accent color picker */}
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    {t('common.accentColor')}
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
                <button
                  className="topbar-dropdown-item"
                  onClick={() => { dropdown.setOpen(false); navigate('/profile') }}
                >
                  <span className="topbar-dropdown-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </span>
                  {t('common.profile')}
                </button>

                <button
                  className="topbar-dropdown-item"
                  onClick={() => { dropdown.setOpen(false); navigate('/settings') }}
                >
                  <span className="topbar-dropdown-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </span>
                  {t('settings.title')}
                </button>

                <button
                  className="topbar-dropdown-item"
                  onClick={() => { dropdown.setOpen(false); navigate('/trash') }}
                >
                  <span className="topbar-dropdown-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </span>
                  {t('common.trash')}
                </button>

                <div className="topbar-dropdown-divider" />

                <button
                  className="topbar-dropdown-item topbar-dropdown-item--danger"
                  onClick={() => { dropdown.setOpen(false); logout() }}
                >
                  <span className="topbar-dropdown-item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                  {t('common.signOut')}
                </button>

              </div>
            )}
          </div>
        </div>
      </header>
      {showNotifCenter && (
        <NotificationCenter onClose={() => { setShowNotifCenter(false); setNotifCount(notificationService.getAll().length) }} />
      )}
      <GlobalSearchModal open={showSearch} onClose={() => setShowSearch(false)} />
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <style>{`
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      @keyframes slideDown {
        from { transform: translateY(-100%); opacity: 0; }
        to   { transform: translateY(0);     opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `}</style>
    </>
  )
}
