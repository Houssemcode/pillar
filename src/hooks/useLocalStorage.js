/**
 * useLocalStorage — drop-in replacement for useState that persists to localStorage.
 * Usage: const [value, setValue] = useLocalStorage('key', defaultValue)
 */
import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) return initialValue
      return JSON.parse(item)
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`useLocalStorage: failed to set "${key}"`, error)
    }
  }, [key, storedValue])

  // Sync across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === key) {
        try { setStoredValue(JSON.parse(e.newValue)) } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  return [storedValue, setValue]
}
