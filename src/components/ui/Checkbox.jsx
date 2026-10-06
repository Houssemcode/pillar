/**
 * Checkbox.jsx — Pillar Unified Checkbox Component
 *
 * Replaces the native <input type="checkbox"> with a fully custom
 * visual control while keeping the native element in the DOM for
 * complete accessibility (keyboard, screen-reader, form submission).
 *
 * ── Rendering Structure ───────────────────────────────────────
 *   <label .pil-checkbox>                 ← clickable wrapper
 *     <input .pil-checkbox__native>       ← hidden native (a11y)
 *     <span  .pil-checkbox__box>          ← custom visual box
 *       <motion.svg .pil-checkbox__check> ← animated checkmark
 *     </span>
 *     <span  .pil-checkbox__label>        ← optional label text
 *   </label>
 *
 * ── Animation Strategy ────────────────────────────────────────
 *   The checkmark SVG path uses Framer Motion's `pathLength`
 *   variant to animate a "draw on" effect: the stroke is drawn
 *   from 0 → 1 when checked, and erased (1 → 0) when unchecked.
 *   The custom box scale-pops simultaneously via `scale` variant,
 *   giving a satisfying tactile confirmation.
 *
 *   Why Framer Motion instead of pure CSS keyframes?
 *   CSS `stroke-dashoffset` requires knowing the exact path
 *   length at build time. Framer Motion's `pathLength` normalises
 *   it to [0,1] automatically — zero configuration, any SVG path.
 *
 * ── Props ─────────────────────────────────────────────────────
 *   checked     boolean            Controlled checked state
 *   onChange    function           Native onChange handler
 *   label       string | ReactNode Optional label rendered to the right
 *   disabled    boolean            default false
 *   size        'sm' | 'md' | 'lg' default 'md'
 *   className   string             Extra classes on root <label>
 *   id          string             Forwarded to native <input>
 *   …rest       Forwarded to native <input> (name, value, form, etc.)
 */

import { forwardRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Checkbox.css'

/* ── Animation variants ─────────────────────────────────────── */

// The custom box: scale pop on check, shrink on uncheck
const BOX_VARIANTS = {
  unchecked: { scale: 1 },
  checked:   { scale: [1, 1.14, 1] }, // quick pop then settle
}

const BOX_TRANSITION = { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }

// The checkmark path: drawn in/out via pathLength
const CHECK_VARIANTS = {
  hidden:  { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 },
}

const CHECK_TRANSITION = {
  pathLength: { type: 'spring', stiffness: 500, damping: 30 },
  opacity:    { duration: 0.05 },  // appear nearly instantly, disappear fast
}

/* ── Checkmark SVG dimensions by size ──────────────────────── */
const SIZE_MAP = {
  sm: { box: 16, svg: 9,  stroke: 1.6 },
  md: { box: 20, svg: 11, stroke: 1.8 },
  lg: { box: 24, svg: 13, stroke: 2.0 },
}

/* ═══════════════════════════════════════════════════════════ */

const Checkbox = forwardRef(function Checkbox(
  {
    checked = false,
    onChange,
    label,
    disabled = false,
    size = 'md',
    className = '',
    id: idProp,
    ...rest
  },
  ref
) {
  const autoId   = useId()
  const inputId  = idProp ?? autoId
  const dims     = SIZE_MAP[size] ?? SIZE_MAP.md

  /* ── Root class list ──────────────────────────────────────── */
  const rootClasses = [
    'pil-checkbox',
    `pil-checkbox--${size}`,
    checked  ? 'pil-checkbox--checked'  : '',
    disabled ? 'pil-checkbox--disabled' : '',
    className,
  ].filter(Boolean).join(' ')

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <label htmlFor={inputId} className={rootClasses}>
      {/* ── Hidden native input (a11y anchor) ── */}
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="pil-checkbox__native"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={checked}
        {...rest}
      />

      {/* ── Custom visual box ── */}
      <motion.span
        className="pil-checkbox__box"
        variants={BOX_VARIANTS}
        animate={checked ? 'checked' : 'unchecked'}
        transition={BOX_TRANSITION}
        aria-hidden="true"
        style={{ width: dims.box, height: dims.box, minWidth: dims.box }}
      >
        {/* ── Animated checkmark SVG ── */}
        <AnimatePresence initial={false}>
          {checked && (
            <svg
              className="pil-checkbox__check"
              width={dims.svg}
              height={dims.svg}
              viewBox="0 0 12 9"
              fill="none"
              aria-hidden="true"
            >
              <motion.path
                d="M1.5 4.5L4.5 7.5L10.5 1.5"
                stroke="#ffffff"
                strokeWidth={dims.stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={CHECK_VARIANTS}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={CHECK_TRANSITION}
              />
            </svg>
          )}
        </AnimatePresence>
      </motion.span>

      {/* ── Label text ── */}
      {label && (
        <span className="pil-checkbox__label">{label}</span>
      )}
    </label>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
