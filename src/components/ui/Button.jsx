/**
 * Button.jsx — Pillar Unified Button Component
 *
 * A single, composable button primitive that drives all button-like
 * interactions across the app.  Styling lives in Button.css and
 * consumes only global CSS variables so the Chameleon theme colours
 * update automatically with zero JS changes.
 *
 * Props
 * ─────
 * variant      'primary' | 'secondary' | 'ghost' | 'danger'   default 'primary'
 * size         'sm' | 'md' | 'lg' | 'full'                    default 'md'
 * icon         React node  — optional leading/trailing icon
 * iconPosition 'left' | 'right'                               default 'left'
 * isLoading    boolean — replaces content with a spinner       default false
 * disabled     boolean                                         default false
 * className    string — extra classes appended after base set
 * children     React node — button label
 * …rest        forwarded to the underlying <motion.button>
 *              (onClick, type, aria-*, data-*, etc.)
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import './Button.css'

// Tap animation is intentionally subtle — just enough tactile feedback.
const TAP = { scale: 0.96 }
const TRANSITION = { type: 'spring', stiffness: 600, damping: 30 }

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    isLoading = false,
    disabled = false,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || isLoading

  // Build BEM-style class list
  const classes = [
    'pil-btn',
    `pil-btn--${variant}`,
    `pil-btn--${size}`,
    isLoading ? 'pil-btn--loading' : '',
    isDisabled ? 'pil-btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  /* ── Content helpers ──────────────────────────────────── */
  const Spinner = () => <span className="pil-btn__spinner" aria-hidden="true" />

  const IconNode = icon ? (
    <span className="pil-btn__icon" aria-hidden="true">
      {icon}
    </span>
  ) : null

  /* ── Render ───────────────────────────────────────────── */
  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : TAP}
      transition={TRANSITION}
      {...rest}
    >
      {isLoading ? (
        <>
          <Spinner />
          {/* Keep label readable for screen-readers even while loading */}
          {children && (
            <span style={{ opacity: 0.6 }}>{children}</span>
          )}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && IconNode}
          {children && <span className="pil-btn__label">{children}</span>}
          {icon && iconPosition === 'right' && IconNode}
        </>
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button
