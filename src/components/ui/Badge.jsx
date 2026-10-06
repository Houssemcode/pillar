/**
 * Badge.jsx — Pillar Badge Component
 *
 * A small status/label indicator used for priorities, streaks,
 * counts, and module tags across all pages.
 *
 * ── Props ─────────────────────────────────────────────────────
 *   variant   'default' | 'primary' | 'success' | 'warning' | 'danger'
 *             default 'default'
 *             • 'primary' uses var(--color-primary) — shifts with
 *               the active module (Chameleon theme).
 *   size      'sm' | 'md'     default 'md'
 *   icon      ReactNode       optional leading icon/emoji
 *   className string          extra classes appended
 *   children  ReactNode       badge label
 *   …rest     forwarded to the underlying <span>
 *
 * ── Design Rationale ─────────────────────────────────────────
 *   Translucent tinted background + vivid text of the same family
 *   gives strong semantic legibility on dark surfaces (default) and
 *   light surfaces alike (overrides live in Badge.css).
 *   Zero motion is used intentionally — badges are static labels,
 *   not interactive affordances.
 */

import './Badge.css'

export default function Badge({
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'pil-badge',
    `pil-badge--${variant}`,
    `pil-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {icon && (
        <span className="pil-badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}
