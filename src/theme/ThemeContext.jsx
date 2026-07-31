import { createContext, useContext, useState } from 'react'
import { MODULE_THEMES } from './moduleThemes'

const ThemeContext = createContext({
  moduleKey: 'today',
  theme: MODULE_THEMES.today,
  setModuleKey: () => {},
})

export function ThemeProvider({ children }) {
  const [moduleKey, setModuleKey] = useState('today')
  const theme = MODULE_THEMES[moduleKey] || MODULE_THEMES.today

  return (
    <ThemeContext.Provider value={{ moduleKey, theme, setModuleKey }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
