import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULE_THEMES } from '../../theme/moduleThemes'

const NAV_ITEMS = [
  {
    to: '/today',
    labelKey: 'nav.today',
    exact: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    to: '/tasks',
    labelKey: 'nav.tasks',
    moduleKey: 'tasks',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9,11 12,14 22,4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    to: '/habits',
    labelKey: 'nav.habits',
    moduleKey: 'habits',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    ),
  },
  {
    to: '/calendar',
    labelKey: 'nav.calendar',
    moduleKey: 'calendar',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/faith',
    labelKey: 'nav.faith',
    moduleKey: 'faith',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    to: '/focus',
    labelKey: 'nav.focus',
    moduleKey: 'focus',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (item) => {
    if (item.exact) return location.pathname === '/today' || location.pathname === '/'
    return location.pathname.startsWith(item.to)
  }

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item)
        const moduleTheme = item.moduleKey ? MODULE_THEMES[item.moduleKey] : null
        const activeColor = moduleTheme ? moduleTheme.color : 'var(--color-primary)'
        const label = t(item.labelKey)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            style={active ? { color: activeColor } : {}}
            title={label}
          >
            <span
              className="bottom-nav-icon"
              style={active ? { background: `${activeColor}18` } : {}}
            >
              {item.icon}
            </span>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
