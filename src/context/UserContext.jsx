import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const UserContext = createContext()

/* ── Accent Color Presets ─────────────────────────────────── */
export const ACCENT_COLORS = [
  { key: 'blue',    label: 'Ocean',   color: '#3B82F6', subtle: 'rgba(59,130,246,0.08)',  muted: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.15)'  },
  { key: 'emerald', label: 'Sage',    color: '#10B981', subtle: 'rgba(16,185,129,0.08)',  muted: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.15)'  },
  { key: 'purple',  label: 'Violet',  color: '#8B5CF6', subtle: 'rgba(139,92,246,0.08)',  muted: 'rgba(139,92,246,0.25)',  glow: 'rgba(139,92,246,0.15)'  },
  { key: 'rose',    label: 'Rose',    color: '#F43F5E', subtle: 'rgba(244,63,94,0.08)',   muted: 'rgba(244,63,94,0.25)',   glow: 'rgba(244,63,94,0.15)'   },
  { key: 'amber',   label: 'Amber',   color: '#F59E0B', subtle: 'rgba(245,158,11,0.08)',  muted: 'rgba(245,158,11,0.25)',  glow: 'rgba(245,158,11,0.15)'  },
  { key: 'teal',    label: 'Teal',    color: '#14B8A6', subtle: 'rgba(20,184,166,0.08)',  muted: 'rgba(20,184,166,0.25)',  glow: 'rgba(20,184,166,0.15)'  },
]

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

function applyAppearance(theme, accentKey) {
  const root = document.documentElement
  // Dark / Light
  root.setAttribute('data-theme', theme)

  // Accent
  const accent = ACCENT_COLORS.find(a => a.key === accentKey) || ACCENT_COLORS[0]
  root.style.setProperty('--color-primary',        accent.color)
  root.style.setProperty('--color-primary-subtle', accent.subtle)
  root.style.setProperty('--color-primary-muted',  accent.muted)
  root.style.setProperty('--color-primary-glow',   accent.glow)
}

export function UserProvider({ children }) {
  // ── User identity ──────────────────────────────────────────
  const [gender,    setGenderRaw]    = useState(() => read('pillar_gender', null))
  const [userName,  setUserNameRaw]  = useState(() => read('pillar_userName', ''))
  const [isExcused, setIsExcusedRaw] = useState(() => read('pillar_isExcused', false))

  // ── Appearance ────────────────────────────────────────────
  const [colorTheme,  setColorThemeRaw]  = useState(() => read('pillar_colorTheme',  'dark'))
  const [accentColor, setAccentColorRaw] = useState(() => read('pillar_accentColor', 'blue'))

  // Apply appearance on mount + changes
  useEffect(() => { applyAppearance(colorTheme, accentColor) }, [colorTheme, accentColor])

  // Persisted setters
  const setGender    = useCallback((v) => { setGenderRaw(v);    write('pillar_gender', v) }, [])
  const setUserName  = useCallback((v) => { setUserNameRaw(v);  write('pillar_userName', v) }, [])
  const setIsExcused = useCallback((v) => { setIsExcusedRaw(v); write('pillar_isExcused', v) }, [])
  const setColorTheme  = useCallback((v) => { setColorThemeRaw(v);  write('pillar_colorTheme', v) }, [])
  const setAccentColor = useCallback((v) => { setAccentColorRaw(v); write('pillar_accentColor', v) }, [])

  const toggleTheme = useCallback(() => {
    setColorTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [setColorTheme])

  return (
    <UserContext.Provider value={{
      // Identity
      gender, setGender,
      userName, setUserName,
      isExcused, setIsExcused,
      // Appearance
      colorTheme, setColorTheme, toggleTheme,
      accentColor, setAccentColor,
      ACCENT_COLORS,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
