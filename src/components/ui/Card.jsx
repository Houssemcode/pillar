/**
 * Card.jsx — Pillar Unified Card Component (Compound Pattern)
 *
 * A composable, glassmorphic surface primitive that serves as the
 * base container across Today, Habits, Tasks, and all other pages.
 *
 * ── Exports ──────────────────────────────────────────────────
 *   Card            Root surface wrapper
 *   Card.Header     Title + optional subtitle + optional action slot
 *   Card.Body       Padded content area (flex: 1)
 *   Card.Footer     Pinned bottom area, optional top divider
 *
 * ── Card Props ───────────────────────────────────────────────
 *   interactive   boolean   Adds hover/tap effects; makes card clickable
 *   variant       'default' | 'accent' | 'flat'          default 'default'
 *   className     string    Extra classes appended after base set
 *   children      ReactNode
 *   …rest         Forwarded to the underlying element
 *                 (onClick, data-*, aria-*, role, etc.)
 *
 * ── Card.Header Props ────────────────────────────────────────
 *   title         ReactNode  Primary heading
 *   subtitle      ReactNode  Optional secondary line
 *   action        ReactNode  Right-aligned slot (usually <IconButton>)
 *   className     string
 *
 * ── Card.Body Props ──────────────────────────────────────────
 *   className     string
 *   children      ReactNode
 *   …rest         forwarded to <div>
 *
 * ── Card.Footer Props ────────────────────────────────────────
 *   divided       boolean   Adds a subtle top divider line
 *   className     string
 *   children      ReactNode
 *   …rest         forwarded to <div>
 *
 * ── Interactive Animation ────────────────────────────────────
 *   When `interactive` is true the card uses Framer Motion for a
 *   micro-scale + lift effect on hover and a firm press on tap.
 *   Framer Motion is already a project dep (used by Button.jsx).
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import './Card.css'

/* ── Animation presets ─────────────────────────────────────── */
const HOVER = { scale: 1.012, y: -2 }
const TAP   = { scale: 0.985 }
const SPRING = { type: 'spring', stiffness: 400, damping: 28 }

/* ═══════════════════════════════════════════════════════════
   Card — root component
   ════════════════════════════════════════════════════════ */
const Card = forwardRef(function Card(
  {
    interactive = false,
    variant = 'default',
    className = '',
    children,
    ...rest
  },
  ref
) {
  const classes = [
    'pil-card',
    variant !== 'default' ? `pil-card--${variant}` : '',
    interactive ? 'pil-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  /* Interactive cards get motion; static ones stay as plain divs
     to avoid unnecessary Framer Motion overhead. */
  if (interactive) {
    return (
      <motion.div
        ref={ref}
        className={classes}
        whileHover={HOVER}
        whileTap={TAP}
        transition={SPRING}
        {...rest}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'

/* ═══════════════════════════════════════════════════════════
   Card.Header
   ════════════════════════════════════════════════════════ */
function CardHeader({ title, subtitle, action, className = '', ...rest }) {
  return (
    <div className={['pil-card__header', className].filter(Boolean).join(' ')} {...rest}>
      {/* Text stack — flex:1 ensures the action hugs the right edge */}
      <div className="pil-card__header-text">
        {title && (
          typeof title === 'string'
            ? <span className="pil-card__title">{title}</span>
            : <div className="pil-card__title">{title}</div>
        )}
        {subtitle && (
          typeof subtitle === 'string'
            ? <span className="pil-card__subtitle">{subtitle}</span>
            : <div className="pil-card__subtitle">{subtitle}</div>
        )}
      </div>

      {/* Right-aligned action slot (e.g. <IconButton>, <Badge>, etc.) */}
      {action && (
        <div className="pil-card__action">{action}</div>
      )}
    </div>
  )
}

CardHeader.displayName = 'Card.Header'

/* ═══════════════════════════════════════════════════════════
   Card.Body
   ════════════════════════════════════════════════════════ */
function CardBody({ className = '', children, ...rest }) {
  return (
    <div
      className={['pil-card__body', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}

CardBody.displayName = 'Card.Body'

/* ═══════════════════════════════════════════════════════════
   Card.Footer
   ════════════════════════════════════════════════════════ */
function CardFooter({ divided = false, className = '', children, ...rest }) {
  const classes = [
    'pil-card__footer',
    divided ? 'pil-card__footer--divided' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

CardFooter.displayName = 'Card.Footer'

/* ── Attach sub-components ─────────────────────────────────── */
Card.Header = CardHeader
Card.Body   = CardBody
Card.Footer = CardFooter

export default Card
