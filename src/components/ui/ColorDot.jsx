import { getModuleTheme } from '../../theme/moduleThemes'

/**
 * ColorDot — a small colored circle representing a module.
 * Used in the Today timeline to tag events by source module.
 */
export default function ColorDot({ moduleKey, size = 8 }) {
  const theme = getModuleTheme(moduleKey)
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: theme.color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${theme.colorGlow || theme.color}`,
      }}
    />
  )
}
