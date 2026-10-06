// Module theme definitions — color palette for each section of the app
export const MODULE_THEMES = {
  today: {
    name: 'Today',
    color: '#a1a1aa',
    colorSubtle: 'rgba(161, 161, 170, 0.08)',
    colorMuted: 'rgba(161, 161, 170, 0.25)',
    colorGlow: 'rgba(161, 161, 170, 0.12)',
  },
  tasks: {
    name: 'Tasks',
    color: '#3B82F6',
    colorSubtle: 'rgba(59, 130, 246, 0.08)',
    colorMuted: 'rgba(59, 130, 246, 0.25)',
    colorGlow: 'rgba(59, 130, 246, 0.15)',
  },
  habits: {
    name: 'Habits',
    color: '#F59E0B',
    colorSubtle: 'rgba(245, 158, 11, 0.08)',
    colorMuted: 'rgba(245, 158, 11, 0.25)',
    colorGlow: 'rgba(245, 158, 11, 0.15)',
  },
  calendar: {
    name: 'Calendar',
    color: '#6366F1',
    colorSubtle: 'rgba(99, 102, 241, 0.08)',
    colorMuted: 'rgba(99, 102, 241, 0.25)',
    colorGlow: 'rgba(99, 102, 241, 0.15)',
  },
  faith: {
    name: 'Faith',
    color: '#10B981',
    colorSubtle: 'rgba(16, 185, 129, 0.08)',
    colorMuted: 'rgba(16, 185, 129, 0.25)',
    colorGlow: 'rgba(16, 185, 129, 0.15)',
  },
  focus: {
    name: 'Focus',
    color: '#F43F5E',
    colorSubtle: 'rgba(244, 63, 94, 0.08)',
    colorMuted: 'rgba(244, 63, 94, 0.25)',
    colorGlow: 'rgba(244, 63, 94, 0.15)',
  },
  trash: {
    name: 'Trash',
    color: '#64748B',
    colorSubtle: 'rgba(100, 116, 139, 0.08)',
    colorMuted: 'rgba(100, 116, 139, 0.25)',
    colorGlow: 'rgba(100, 116, 139, 0.15)',
  },
  preferences: {
    name: 'Preferences',
    color: '#8B5CF6',
    colorSubtle: 'rgba(139, 92, 246, 0.08)',
    colorMuted: 'rgba(139, 92, 246, 0.25)',
    colorGlow: 'rgba(139, 92, 246, 0.15)',
  },
}

// Route → module key mapping
export const ROUTE_TO_MODULE = {
  '/': 'today',
  '/tasks': 'tasks',
  '/habits': 'habits',
  '/calendar': 'calendar',
  '/faith': 'faith',
  '/focus': 'focus',
  '/settings': 'preferences',
  '/profile': 'preferences',
  '/trash': 'trash',
  '/adhkar': 'faith',
  '/faith/adhkar': 'faith',
  '/hadiths': 'faith',
}

// Apply a module theme to CSS variables on the document root
export function applyTheme(moduleKey) {
  const theme = MODULE_THEMES[moduleKey] || MODULE_THEMES.today
  const root = document.documentElement

  root.style.setProperty('--color-primary', theme.color)
  root.style.setProperty('--color-primary-subtle', theme.colorSubtle)
  root.style.setProperty('--color-primary-muted', theme.colorMuted)
  root.style.setProperty('--color-primary-glow', theme.colorGlow)
}

// Get theme for a specific module key (used for static color dots, etc.)
export function getModuleTheme(moduleKey) {
  return MODULE_THEMES[moduleKey] || MODULE_THEMES.today
}
