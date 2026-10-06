/**
 * Modal.jsx — Pillar Unified Modal / Bottom-Drawer System
 *
 * A single overlay primitive that adapts to the screen:
 *   ≥ 768px  → centered dialog (scale + fade animation)
 *   < 768px  → bottom sheet   (slide-up animation)
 *
 * Built with React.createPortal so it always renders at
 * document.body root — bypassing any overflow:hidden or
 * z-index stacking context on ancestor elements.
 *
 * ── Exports ──────────────────────────────────────────────────
 *   Modal           Root portal wrapper + backdrop + dialog
 *   Modal.Header    Title, optional subtitle, close button slot
 *   Modal.Body      Scrollable content area
 *   Modal.Footer    Action-button row (justify-end by default)
 *
 * ── Modal Props ──────────────────────────────────────────────
 *   isOpen    boolean   Controls AnimatePresence mount/unmount
 *   onClose   function  Called on Escape, backdrop click, or ✕ btn
 *   children  ReactNode Compose with Modal.Header/Body/Footer
 *   className string    Extra classes on the dialog panel
 *
 * ── Modal.Header Props ───────────────────────────────────────
 *   title           ReactNode   Main heading (string or JSX)
 *   subtitle        ReactNode   Optional secondary line
 *   showCloseButton boolean     Renders an IconButton ✕  default true
 *   className       string
 *
 * ── Modal.Body Props ─────────────────────────────────────────
 *   className string
 *   children  ReactNode
 *   …rest     forwarded to <div>
 *
 * ── Modal.Footer Props ───────────────────────────────────────
 *   spread    boolean   justify-content: space-between
 *   className string
 *   children  ReactNode
 *   …rest     forwarded to <div>
 *
 * ── Accessibility ────────────────────────────────────────────
 *   • role="dialog" + aria-modal="true" on the dialog panel
 *   • aria-labelledby wired to Modal.Header's title element
 *   • Focus is trapped inside the dialog while open
 *   • Escape closes the modal
 *   • Body scroll is locked while open (overflow:hidden on <body>)
 */

import {
  useEffect,
  useRef,
  useCallback,
  useId,
  createContext,
  useContext,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import IconButton from './IconButton'
import './Modal.css'

/* ── Context — shares the title-id with sub-components ─────── */
const ModalCtx = createContext({ titleId: '' })

/* ── Animation variants ────────────────────────────────────── */

// Check once at module load — mediaQueryList is stable for the
// lifetime of the app so we don't need to observe it per-render.
const getMobileVariants = () => {
  const isMobile = window.matchMedia('(max-width: 767px)').matches

  if (isMobile) {
    // Bottom sheet: slides up from below
    return {
      hidden:  { y: '100%', opacity: 0 },
      visible: { y: 0,      opacity: 1 },
      exit:    { y: '100%', opacity: 0 },
    }
  }
  // Centered dialog: scale up from 94% + fade in
  return {
    hidden:  { scale: 0.94, opacity: 0, y: 8  },
    visible: { scale: 1,    opacity: 1, y: 0  },
    exit:    { scale: 0.96, opacity: 0, y: -4 },
  }
}

const BACKDROP_VARIANTS = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
}

const DIALOG_TRANSITION = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.8,
}

const BACKDROP_TRANSITION = { duration: 0.2, ease: 'easeOut' }

/* ── Focus trap helper ─────────────────────────────────────── */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function useFocusTrap(ref, isOpen) {
  // Stash the element that had focus before the modal opened
  const previousFocus = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    previousFocus.current = document.activeElement

    // Auto-focus the first focusable element inside the dialog
    const firstFocusable = ref.current?.querySelector(FOCUSABLE)
    firstFocusable?.focus()

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return
      const focusables = Array.from(ref.current?.querySelectorAll(FOCUSABLE) ?? [])
      if (!focusables.length) return

      const first = focusables[0]
      const last  = focusables[focusables.length - 1]

      if (e.shiftKey) {
        // Shift+Tab — wrap forward
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab — wrap backward
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus when modal closes
      previousFocus.current?.focus()
    }
  }, [isOpen, ref])
}

/* ── Body scroll lock ──────────────────────────────────────── */
function useScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [isOpen])
}

/* ═══════════════════════════════════════════════════════════
   Modal — root component
   ════════════════════════════════════════════════════════ */
function Modal({ isOpen, onClose, className = '', backdropClassName = '', container, children }) {
  const dialogRef  = useRef(null)
  const titleId    = useId()        // unique aria-labelledby id

  useFocusTrap(dialogRef, isOpen)
  useScrollLock(isOpen)

  // Escape key — close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  // Backdrop click — close (stopPropagation on dialog prevents bubbling)
  const handleBackdropClick = useCallback(() => onClose(), [onClose])

  const dialogClasses = [
    'pil-modal__dialog',
    className,
  ].filter(Boolean).join(' ')

  const portalTarget = container || (typeof document !== 'undefined' ? (document.fullscreenElement || document.body) : null)

  if (!portalTarget) return null

  return createPortal(
    <ModalCtx.Provider value={{ titleId, onClose }}>
      <AnimatePresence>
        {isOpen && (
          /* ── Backdrop ── */
          <motion.div
            className={`pil-modal__backdrop fixed inset-0 bg-black/40 backdrop-blur-sm z-50 ${backdropClassName}`.trim()}
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={BACKDROP_TRANSITION}
            onClick={handleBackdropClick}
            aria-hidden="true"
          >
            {/* ── Dialog ── */}
            <motion.div
              ref={dialogRef}
              className={dialogClasses}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              variants={getMobileVariants()}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={DIALOG_TRANSITION}
              // Stop backdrop click from propagating through the panel
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalCtx.Provider>,
    document.body
  )
}

Modal.displayName = 'Modal'

/* ═══════════════════════════════════════════════════════════
   Modal.Header
   ════════════════════════════════════════════════════════ */
function ModalHeader({
  title,
  subtitle,
  showCloseButton = true,
  className = '',
  ...rest
}) {
  const { titleId, onClose } = useContext(ModalCtx)

  return (
    <div
      className={['pil-modal__header', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <div className="pil-modal__header-text">
        {title && (
          <h2 id={titleId} className="pil-modal__title">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="pil-modal__subtitle">{subtitle}</p>
        )}
      </div>

      {showCloseButton && (
        <div className="pil-modal__close">
          <IconButton
            icon={
              /* Simple ✕ rendered inline — no extra dep needed */
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            }
            ariaLabel="Close modal"
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </div>
      )}
    </div>
  )
}

ModalHeader.displayName = 'Modal.Header'

/* ═══════════════════════════════════════════════════════════
   Modal.Body
   ════════════════════════════════════════════════════════ */
function ModalBody({ className = '', children, ...rest }) {
  return (
    <div
      className={['pil-modal__body', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}

ModalBody.displayName = 'Modal.Body'

/* ═══════════════════════════════════════════════════════════
   Modal.Footer
   ════════════════════════════════════════════════════════ */
function ModalFooter({ spread = false, className = '', children, ...rest }) {
  const classes = [
    'pil-modal__footer',
    spread ? 'pil-modal__footer--spread' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

ModalFooter.displayName = 'Modal.Footer'

/* ── Attach sub-components ─────────────────────────────────── */
Modal.Header = ModalHeader
Modal.Body   = ModalBody
Modal.Footer = ModalFooter

export default Modal
