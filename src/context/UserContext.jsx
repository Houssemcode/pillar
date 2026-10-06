import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

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
  root.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    root.classList.add('dark')
    document.body.classList.add('dark')
  } else {
    root.classList.remove('dark')
    document.body.classList.remove('dark')
  }
  const accent = ACCENT_COLORS.find(a => a.key === accentKey) || ACCENT_COLORS[0]
  root.style.setProperty('--color-primary',        accent.color)
  root.style.setProperty('--color-primary-subtle', accent.subtle)
  root.style.setProperty('--color-primary-muted',  accent.muted)
  root.style.setProperty('--color-primary-glow',   accent.glow)
}

export const DEFAULT_PREFERENCES = {
  weekStart: 'monday',
  timeFormat: '12h',
  prayerMethod: 'MWL',
  asrMethod: 'standard',
  hijriAdjustment: 0,
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  soundEnabled: true,
  autoStartBreaks: false,
  notifications: {
    tasks: true,
    habits: true,
    prayers: true,
  },
  defaultTaskPriority: 'medium',
}

export function UserProvider({ children }) {
  const { updateMe } = useAuth()

  // ── User identity — seeded from AuthContext user on login ──
  const [gender,    setGenderRaw]    = useState(() => read('pillar_gender', null))
  const [userName,  setUserNameRaw]  = useState(() => read('pillar_userName', ''))
  const [firstName, setFirstNameRaw] = useState(() => read('pillar_firstName', ''))
  const [lastName,  setLastNameRaw]  = useState(() => read('pillar_lastName', ''))
  const [isExcused, setIsExcusedRaw] = useState(() => read('pillar_isExcused', false))
  const [headline,  setHeadlineRaw]  = useState(() => read('pillar_headline', ''))
  const [bio,       setBioRaw]       = useState(() => read('pillar_bio', ''))
  const [avatar,    setAvatarRaw]    = useState(() => read('pillar_avatar', 'avatar-1'))

  // ── Appearance ────────────────────────────────────────────
  const [colorTheme,  setColorThemeRaw]  = useState(() => read('pillar_colorTheme',  'dark'))
  const [accentColor, setAccentColorRaw] = useState(() => read('pillar_accentColor', 'blue'))

  // ── Preferences ───────────────────────────────────────────
  const [preferences, setPreferencesRaw] = useState(() => {
    const saved = read('pillar_preferences', {})
    return { ...DEFAULT_PREFERENCES, ...saved }
  })

  // Apply appearance on mount + changes
  useEffect(() => { applyAppearance(colorTheme, accentColor) }, [colorTheme, accentColor])

  // Persisted setters
  const setGender    = useCallback((v) => { setGenderRaw(v);    write('pillar_gender', v) }, [])
  const setUserName  = useCallback((v) => { setUserNameRaw(v);  write('pillar_userName', v) }, [])
  const setFirstName = useCallback((v) => { setFirstNameRaw(v); write('pillar_firstName', v) }, [])
  const setLastName  = useCallback((v) => { setLastNameRaw(v);  write('pillar_lastName', v) }, [])
  const setIsExcused = useCallback((v) => {
    setIsExcusedRaw(v)
    write('pillar_isExcused', v)
    updateMe({ is_excused: v }).catch(() => {})
  }, [updateMe])
  const setHeadline  = useCallback((v) => { setHeadlineRaw(v);  write('pillar_headline', v) }, [])
  const setBio       = useCallback((v) => { setBioRaw(v);       write('pillar_bio', v) }, [])
  const setAvatar    = useCallback((v) => {
    setAvatarRaw(v)
    write('pillar_avatar', v)
    updateMe({ avatar: v }).catch(() => {})
  }, [updateMe])
  const setColorTheme  = useCallback((v) => { setColorThemeRaw(v);  write('pillar_colorTheme', v) }, [])
  const setAccentColor = useCallback((v) => { setAccentColorRaw(v); write('pillar_accentColor', v) }, [])

  const toggleTheme = useCallback(() => {
    setColorTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [setColorTheme])

  // Update preferences helper: local state + localStorage + backend sync
  const updatePreferences = useCallback((patch) => {
    setPreferencesRaw(prev => {
      const merged = { ...prev, ...patch }
      write('pillar_preferences', merged)
      updateMe({ preferences: merged }).catch(() => {})
      return merged
    })
  }, [updateMe])

  // Update profile helper: name, email, bio, headline, etc.
  const updateProfile = useCallback(async (data) => {
    if (data.first_name !== undefined) setFirstName(data.first_name)
    if (data.last_name !== undefined)  setLastName(data.last_name)
    if (data.username !== undefined)   setUserName(data.username)
    if (data.headline !== undefined)   setHeadline(data.headline)
    if (data.bio !== undefined)        setBio(data.bio)
    if (data.gender !== undefined)     setGender(data.gender)
    if (data.avatar !== undefined)     setAvatar(data.avatar)
    return await updateMe(data)
  }, [updateMe, setFirstName, setLastName, setUserName, setHeadline, setBio, setGender, setAvatar])

  // Safely hydrate context & localStorage from server user without re-triggering API calls
  const syncUserFromServer = useCallback((serverUser) => {
    if (!serverUser) return
    if (serverUser.gender) { setGenderRaw(serverUser.gender); write('pillar_gender', serverUser.gender) }
    if (serverUser.username) { setUserNameRaw(serverUser.username); write('pillar_userName', serverUser.username) }
    if (serverUser.first_name) { setFirstNameRaw(serverUser.first_name); write('pillar_firstName', serverUser.first_name) }
    if (serverUser.last_name) { setLastNameRaw(serverUser.last_name); write('pillar_lastName', serverUser.last_name) }
    if (serverUser.headline) { setHeadlineRaw(serverUser.headline); write('pillar_headline', serverUser.headline) }
    if (serverUser.bio) { setBioRaw(serverUser.bio); write('pillar_bio', serverUser.bio) }
    if (serverUser.avatar) { setAvatarRaw(serverUser.avatar); write('pillar_avatar', serverUser.avatar) }

    const excused = typeof serverUser.isExcused === 'boolean'
      ? serverUser.isExcused
      : (typeof serverUser.is_excused === 'boolean' ? serverUser.is_excused : null)
    if (excused !== null) {
      setIsExcusedRaw(excused)
      write('pillar_isExcused', excused)
    }

    if (serverUser.preferences && typeof serverUser.preferences === 'object') {
      setPreferencesRaw(prev => {
        const merged = { ...DEFAULT_PREFERENCES, ...prev, ...serverUser.preferences }
        write('pillar_preferences', merged)
        return merged
      })
    }
  }, [])

  return (
    <UserContext.Provider value={{
      // Identity
      gender, setGender,
      userName, setUserName,
      firstName, setFirstName,
      lastName, setLastName,
      isExcused, setIsExcused,
      headline, setHeadline,
      bio, setBio,
      avatar, setAvatar,
      updateProfile,
      syncUserFromServer,
      // Appearance
      colorTheme, setColorTheme, toggleTheme,
      accentColor, setAccentColor,
      ACCENT_COLORS,
      // Workspace Preferences
      preferences: preferences || DEFAULT_PREFERENCES,
      updatePreferences,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}

/**
 * Companion hook: sync identity & preferences from server-side user on load
 */
export function useSyncUserFromAuth() {
  const { user } = useAuth()
  const { syncUserFromServer } = useContext(UserContext)

  useEffect(() => {
    if (!user) return
    syncUserFromServer(user)
  }, [user, syncUserFromServer])
}

