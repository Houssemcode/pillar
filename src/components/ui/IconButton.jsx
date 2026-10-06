/**
 * IconButton.jsx — Pillar Icon-Only Button Component
 *
 * A specialised wrapper around Button for icon-only actions.
 * Enforces a minimum 44×44 px touch target (WCAG 2.5.5 / Apple HIG),
 * keeps the icon perfectly centred, and requires an `ariaLabel` for
 * full accessibility.
 *
 * Props
 * ─────
 * icon        React node (required)  — the icon to display
 * ariaLabel   string     (required)  — aria-label for screen-readers
 * variant     'primary' | 'secondary' | 'ghost' | 'danger'  default 'ghost'
 * size        'sm' | 'md' | 'lg'                            default 'md'
 * isLoading   boolean                                        default false
 * disabled    boolean                                        default false
 * className   string — extra classes appended after base set
 * …rest       forwarded to the underlying Button / motion.button
 *
 * Why a separate component and not just <Button icon={…} />?
 * ──────────────────────────────────────────────────────────
 * IconButton strips `children`, forces square sizing, and makes
 * `ariaLabel` mandatory at the prop level (enforced by propTypes
 * comment below).  This prevents accidental omission of accessible
 * labels and avoids size/padding conflicts with labelled buttons.
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import './Button.css'

const TAP = { scale: 0.92 }
const TRANSITION = { type: 'spring', stiffness: 700, damping: 28 }

const IconButton = forwardRef(function IconButton(
  {
    icon,
    ariaLabel,                // required — enforced via console.error below
    variant = 'ghost',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    ...rest
  },
  ref
) {
  // Dev-time guard — ariaLabel is mandatory for accessibility
  if (process.env.NODE_ENV !== 'production' && !ariaLabel) {
    console.error(
      '[IconButton] Missing required prop `ariaLabel`. ' +
      'All icon-only buttons must have a descriptive aria-label for screen-readers.'
    )
  }

  const isDisabled = disabled || isLoading

  const classes = [
    'pil-btn',
    `pil-btn--${variant}`,
    `pil-btn--${size}`,
    'pil-btn--icon-only',
    isLoading ? 'pil-btn--loading' : '',
    isDisabled ? 'pil-btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const Spinner = () => <span className="pil-btn__spinner" aria-hidden="true" />

  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      whileTap={isDisabled ? undefined : TAP}
      transition={TRANSITION}
      {...rest}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <span className="pil-btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </motion.button>
  )
})

IconButton.displayName = 'IconButton'

export default IconButton
