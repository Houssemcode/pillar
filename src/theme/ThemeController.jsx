import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTE_TO_MODULE, applyTheme } from './moduleThemes'
import { useTheme } from './ThemeContext'

/**
 * ThemeController — Listens to the router location and dynamically
 * swaps the CSS custom properties (--color-primary etc.) on the root element.
 * This is the "chameleon" that makes the entire UI recolor on navigation.
 */
export default function ThemeController({ children }) {
  const location = useLocation()
  const { setModuleKey } = useTheme()

  useEffect(() => {
    // Find the matching module for the current path
    const exactMatch = ROUTE_TO_MODULE[location.pathname]
    const prefixMatch = Object.entries(ROUTE_TO_MODULE).find(
      ([route]) => route !== '/' && location.pathname.startsWith(route)
    )
    const moduleKey = exactMatch || (prefixMatch && prefixMatch[1]) || 'today'

    setModuleKey(moduleKey)
    applyTheme(moduleKey)
  }, [location.pathname, setModuleKey])

  return children
}
