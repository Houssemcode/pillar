/**
 * Input.jsx — Pillar Unified Input Component
 *
 * A fully accessible text input wrapper that places leading and
 * trailing icons *inside* the visible border — making the whole
 * element feel like a single cohesive control.
 *
 * ── Architecture ──────────────────────────────────────────────
 *   .pil-input-group           (optional — wraps label + wrap + error)
 *     .pil-input-label         (optional)
 *     .pil-input-wrap          ← the visual "box"; holds the focus ring
 *       .pil-input-icon--leading
 *       <input .pil-input>
 *       .pil-input-icon--trailing
 *     .pil-input-error-msg     (optional)
 *
 * ── Props ─────────────────────────────────────────────────────
 *   label         string/node  Optional visible label above the input
 *   leadingIcon   ReactNode    Optional icon on the left
 *   trailingIcon  ReactNode    Optional icon/action on the right
 *   isError       boolean      Applies error border & shows errorMessage
 *   errorMessage  string       Text shown below on error
 *   size          'sm'|'md'|'lg'   default 'md'
 *   wrapClassName string       Extra class on the .pil-input-wrap
 *   className     string       Extra class on the <input> itself
 *   id            string       Links <label> to <input>; auto-generated if omitted
 *   disabled      boolean
 *   …rest         Forwarded to the underlying <input>
 *                 (type, placeholder, value, onChange, onBlur, etc.)
 *
 * ── Why forwardRef? ───────────────────────────────────────────
 *   Parent components need to programmatically focus the input:
 *     const ref = useRef(); ref.current.focus()
 *   forwardRef passes the ref directly to the native <input>,
 *   not the wrapper div, so .focus() / .select() / .value work.
 *
 * ── iOS Zoom Prevention ───────────────────────────────────────
 *   Safari on iOS zooms the viewport if an input's font-size is
 *   < 16px. Input.css sets font-size: 16px on mobile breakpoints
 *   to prevent this without disabling user-scalable zoom globally.
 */

import { forwardRef, useId } from 'react'
import './Input.css'

const Input = forwardRef(function Input(
  {
    label,
    leadingIcon,
    trailingIcon,
    isError = false,
    errorMessage,
    size = 'md',
    wrapClassName = '',
    className = '',
    id: idProp,
    disabled = false,
    ...rest
  },
  ref
) {
  // Auto-generate a stable id if none is provided —
  // React.useId() guarantees uniqueness per component instance
  const autoId = useId()
  const inputId = idProp ?? autoId

  /* ── Build class lists ──────────────────────────────────── */
  const wrapClasses = [
    'pil-input-wrap',
    size !== 'md' ? `pil-input-wrap--${size}` : '',
    isError          ? 'pil-input-wrap--error'    : '',
    disabled         ? 'pil-input-wrap--disabled' : '',
    leadingIcon      ? 'pil-input-wrap--has-leading'  : '',
    trailingIcon     ? 'pil-input-wrap--has-trailing' : '',
    wrapClassName,
  ].filter(Boolean).join(' ')

  const inputClasses = [
    'pil-input',
    className,
  ].filter(Boolean).join(' ')

  /* ── Icon sizing by size variant ────────────────────────── */
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  /* ── Render ─────────────────────────────────────────────── */
  const wrap = (
    <div className={wrapClasses}>
      {/* Leading icon */}
      {leadingIcon && (
        <span
          className="pil-input-icon pil-input-icon--leading"
          style={{ width: iconSize, height: iconSize }}
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      )}

      {/* Native input — ref forwarded here */}
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        disabled={disabled}
        aria-invalid={isError || undefined}
        aria-describedby={isError && errorMessage ? `${inputId}-error` : undefined}
        {...rest}
      />

      {/* Trailing icon/action */}
      {trailingIcon && (
        <span
          className="pil-input-icon pil-input-icon--trailing"
          style={{ width: iconSize, height: iconSize }}
          // trailing icon may be a button — keep aria-hidden off
        >
          {trailingIcon}
        </span>
      )}
    </div>
  )

  /* ── If no label and no error: return just the wrap ──────── */
  if (!label && !isError) return wrap

  /* ── Full group layout (label + wrap + error) ────────────── */
  return (
    <div className="pil-input-group">
      {label && (
        <label htmlFor={inputId} className="pil-input-label">
          {label}
        </label>
      )}

      {wrap}

      {isError && errorMessage && (
        <span
          id={`${inputId}-error`}
          className="pil-input-error-msg"
          role="alert"
          aria-live="polite"
        >
          {/* Inline warning icon — no extra dep needed */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5.5" stroke="#F43F5E" strokeWidth="1.1" />
            <path d="M6 3.5V6.5" stroke="#F43F5E" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.6" fill="#F43F5E" />
          </svg>
          {errorMessage}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
