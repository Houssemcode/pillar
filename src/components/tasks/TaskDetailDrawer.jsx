import { useState, useEffect, useRef, useCallback } from 'react'
import notificationService from '../../services/notificationService'
import RecurrenceEditor from '../ui/RecurrenceEditor'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Checkbox from '../ui/Checkbox'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Badge from '../ui/Badge'
import { formatTimeHHmm, toTimeInputValue } from '../../utils/timeUtils'

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

/* ── Constants ── */
const TAG_PALETTE = [
  { bg: '#3B82F618', color: '#3B82F6', border: '#3B82F640' },
  { bg: '#6366F118', color: '#6366F1', border: '#6366F140' },
  { bg: '#F59E0B18', color: '#F59E0B', border: '#F59E0B40' },
  { bg: '#10B98118', color: '#10B981', border: '#10B98140' },
  { bg: '#F43F5E18', color: '#F43F5E', border: '#F43F5E40' },
  { bg: '#8B5CF618', color: '#8B5CF6', border: '#8B5CF640' },
]
function getTagColor(tagName) {
  if (!tagName) return { bg: '#a1a1aa18', color: '#a1a1aa', border: '#a1a1aa40' }
  let hash = 0
  for (let i = 0; i < tagName.length; i++) hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length]
}

const PRIORITY_CONFIG = {
  high:   { color: '#F43F5E', bg: '#F43F5E12', label: 'High',   icon: '🔴' },
  medium: { color: '#F59E0B', bg: '#F59E0B12', label: 'Medium', icon: '🟡' },
  low:    { color: '#3B82F6', bg: '#3B82F612', label: 'Low',    icon: '🔵' },
  none:   { color: '#71717a', bg: '#71717a12', label: 'None',   icon: '⚫' },
}

function buildRecurrenceSummary(rule) {
  if (!rule || !rule.freq) return null
  const { freq, interval = 1 } = rule
  if (interval > 1) return `Every ${interval} ${freq.replace('ly', 's')}`
  return freq.charAt(0).toUpperCase() + freq.slice(1)
}

function getTodayISO() { return new Date().toISOString().split('T')[0] }

function getTomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getNextWeekISO() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function formatDate(iso) {
  if (!iso) return null
  const today = getTodayISO()
  const d = new Date(iso + 'T00:00:00')
  const diff = Math.floor((d - new Date(today + 'T00:00:00')) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

function formatDateShort(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const hhmm = formatTimeHHmm(timeStr)
  if (!hhmm) return ''
  const parts = hhmm.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h)) return hhmm
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  const minStr = !isNaN(m) ? String(m).padStart(2, '0') : '00'
  return `${hour12}:${minStr} ${period}`
}

const TIME_PRESETS = [
  { val: '09:00', label: 'Morning', icon: '🌅', time: '9:00 AM' },
  { val: '12:00', label: 'Noon', icon: '☀️', time: '12:00 PM' },
  { val: '15:00', label: 'Afternoon', icon: '☕', time: '3:00 PM' },
  { val: '18:00', label: 'Evening', icon: '🌇', time: '6:00 PM' },
  { val: '21:00', label: 'Night', icon: '🌙', time: '9:00 PM' },
]

/* ── Auto-save indicator ── */
function SaveStatus({ status }) {
  return (
    <span className="tdd2-save-status" data-status={status}>
      {status === 'saving' && <><span className="tdd2-save-dot tdd2-save-dot--pulse" />Saving…</>}
      {status === 'saved'  && <><span className="tdd2-save-dot tdd2-save-dot--green" />Saved</>}
    </span>
  )
}

/* ── Property Row (clickable, opens inline editor) ── */
function PropRow({ icon, label, value, muted, children, active, onClick }) {
  return (
    <div className={`tdd2-prop-row ${active ? 'tdd2-prop-row--active' : ''}`} onClick={onClick}>
      <span className="tdd2-prop-icon">{icon}</span>
      <span className="tdd2-prop-label">{label}</span>
      <span className={`tdd2-prop-value ${muted ? 'tdd2-prop-value--muted' : ''}`}>
        {value}
      </span>
      {children}
    </div>
  )
}

/* ── Inline popover ── */
function InlinePop({ children, className = '', onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return <div className={`tdd2-inline-pop ${className}`} ref={ref}>{children}</div>
}

/* ═══════════════════════════════════════════════════
   TOPBAR ACTIONS COMPONENT
═══════════════════════════════════════════════════ */
function TopbarActions({ task, draft, isTrashed, onToggle, onDelete, onRestore, onClose }) {
  const moreMenu = useDropdown()
  const [trashHover, setTrashHover] = useState(false)

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?task=${task.id}`
    navigator.clipboard?.writeText(url).then(() => {}).catch(() => {})
    moreMenu.setOpen(false)
  }

  const copyTitle = () => {
    navigator.clipboard?.writeText(draft.text || task.text || '').catch(() => {})
    moreMenu.setOpen(false)
  }

  const handlePrint = () => {
    window.print()
    moreMenu.setOpen(false)
  }

  return (
    <div className="tdd2-topbar-actions" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

      {/* ── Complete / Done button ── */}
      {!isTrashed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(task.id)}
          title={draft.done ? 'Mark as active' : 'Mark as complete'}
          icon={
            <div style={{
              width: 14, height: 14, borderRadius: 4, border: '2px solid currentColor',
              background: draft.done ? 'currentColor' : 'transparent', color: draft.done ? 'var(--color-primary)' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {draft.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>}
            </div>
          }
        >
          {draft.done ? 'Completed' : 'Mark done'}
        </Button>
      )}

      {/* ── Restore (trashed) ── */}
      {isTrashed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onRestore(task.id); onClose() }}
          title="Restore this task"
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9,14 4,9 9,4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
            </svg>
          }
        >
          Restore
        </Button>
      )}

      {/* ── Separator ── */}
      <div className="tdd2-topbar-sep" style={{ width: 1, height: 16, background: 'var(--color-border-subtle)', margin: '0 4px' }} />

      {/* ── More actions (⋯) ── */}
      <div className="tdd2-more-wrap" ref={moreMenu.ref} style={{ position: 'relative' }}>
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => moreMenu.setOpen(o => !o)}
          title="More actions"
          ariaLabel="More actions"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
            </svg>
          }
        />

        {moreMenu.open && (
          <div className="tdd2-more-menu">
            <button className="tdd2-more-item" onClick={copyTitle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy task title
            </button>
            <button className="tdd2-more-item" onClick={copyLink}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              Copy link
            </button>
            <button className="tdd2-more-item" onClick={handlePrint}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print task
            </button>

            {!isTrashed && (
              <>
                <div className="tdd2-more-divider" />
                <button
                  className="tdd2-more-item tdd2-more-item--danger"
                  onClick={() => { onDelete(task.id, false); onClose(); moreMenu.setOpen(false) }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  Move to trash
                </button>
              </>
            )}

            {isTrashed && (
              <>
                <div className="tdd2-more-divider" />
                <button
                  className="tdd2-more-item tdd2-more-item--danger"
                  onClick={() => { onDelete(task.id, true); onClose(); moreMenu.setOpen(false) }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  </svg>
                  Delete permanently
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN DRAWER COMPONENT
═══════════════════════════════════════════════════ */
export default function TaskDetailDrawer({ task, tasks = [], userLists = [], userTags = [], onClose, onToggle, onUpdate, onDelete, onRestore, onNavigate }) {
  const [draft, setDraft] = useState({ ...task })
  const [subtaskInput, setSubtaskInput] = useState('')
  const [attachName, setAttachName] = useState('')
  const [attachUrl, setAttachUrl] = useState('')
  const [showAttachForm, setShowAttachForm] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved'
  const [openProp, setOpenProp] = useState(null) // which prop popover is open
  const autoSaveRef = useRef(null)

  const drawerRef = useRef(null)
  const isTrashed = task?.in_trash || task?.inTrash

  /* ── Sync draft when task changes ── */
  useEffect(() => {
    setDraft({ ...task })
    setSubtaskInput('')
    setShowAttachForm(false)
    setOpenProp(null)
  }, [task?.id])

  /* ── Save and close ── */
  const handleClose = useCallback(() => {
    clearTimeout(autoSaveRef.current)
    const changed = Object.keys(draft).some(k => JSON.stringify(draft[k]) !== JSON.stringify(task[k]))
    if (changed) {
      onUpdate(task.id, draft)
    }
    onClose()
  }, [draft, task, onUpdate, onClose])

  const updateDueDate = useCallback((val) => {
    const dVal = val || null
    setDraft(d => ({ ...d, due_date: dVal, dueDate: dVal, dueToday: dVal === getTodayISO() }))
    onUpdate(task.id, { due_date: dVal, dueDate: dVal, dueToday: dVal === getTodayISO() })
  }, [task?.id, onUpdate])

  const updateDueTime = useCallback((val) => {
    const tVal = val || ''
    setDraft(d => ({ ...d, due_time: tVal, dueTime: tVal }))
    onUpdate(task.id, { due_time: tVal, dueTime: tVal })
  }, [task?.id, onUpdate])

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        if (openProp) {
          setOpenProp(null)
        } else {
          handleClose()
        }
      }
      if (e.altKey && e.key === 'ArrowDown') navigateTask(1)
      if (e.altKey && e.key === 'ArrowUp') navigateTask(-1)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [task, tasks, openProp, handleClose])

  const set = useCallback((field, val) => setDraft(d => ({ ...d, [field]: val })), [])

  /* ── Debounced auto-save ── */
  useEffect(() => {
    if (!task?.id) return
    clearTimeout(autoSaveRef.current)
    const changed = Object.keys(draft).some(k => JSON.stringify(draft[k]) !== JSON.stringify(task[k]))
    if (!changed) return

    setSaveStatus('saving')
    autoSaveRef.current = setTimeout(async () => {
      await onUpdate(task.id, draft)
      setSaveStatus('saved')
      // Notification scheduling
      const dueDate = draft.due_date || draft.dueDate
      const dueTime = draft.due_time || draft.dueTime
      const offset = draft.reminder_offset
      if (offset != null && dueDate && dueTime) {
        const fireAt = notificationService.reminderDate(dueDate, dueTime, offset)
        if (fireAt && fireAt > new Date())
          notificationService.scheduleNotification(`task-${task.id}`, `✅ ${draft.text}`, notificationService.reminderLabel(offset), fireAt)
      } else {
        notificationService.cancelNotification(`task-${task.id}`)
      }
      setTimeout(() => setSaveStatus(null), 2000)
    }, 800)
    return () => clearTimeout(autoSaveRef.current)
  }, [draft])

  /* ── Navigation ── */
  const taskIndex = tasks.findIndex(t => t.id === task?.id)
  const navigateTask = (dir) => {
    const next = tasks[taskIndex + dir]
    if (next && onNavigate) { onNavigate(next) }
  }

  /* ── Subtask handlers ── */
  const toggleSubtask = (stId) => {
    const updated = (draft.subtasks || []).map(st => {
      if (st.id === stId) {
        const isDone = !(st.done ?? st.is_completed)
        return { ...st, done: isDone, is_completed: isDone }
      }
      return st
    })
    set('subtasks', updated)
    onUpdate(task.id, { subtasks: updated })
  }
  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    const textVal = subtaskInput.trim()
    const updated = [...(draft.subtasks || []), { id: `tmp-${Date.now()}`, title: textVal, text: textVal, is_completed: false, done: false }]
    set('subtasks', updated)
    setSubtaskInput('')
    onUpdate(task.id, { subtasks: updated })
  }
  const removeSubtask = (stId) => {
    const updated = (draft.subtasks || []).filter(st => st.id !== stId)
    set('subtasks', updated)
    onUpdate(task.id, { subtasks: updated })
  }

  /* ── Attachment handlers ── */
  const addAttachment = () => {
    if (!attachName.trim() || !attachUrl.trim()) return
    const updated = [...(draft.attachments || []), { id: String(Date.now()), name: attachName.trim(), url: attachUrl.trim() }]
    set('attachments', updated)
    setAttachName(''); setAttachUrl(''); setShowAttachForm(false)
    onUpdate(task.id, { attachments: updated })
  }
  const removeAttachment = (id) => {
    const updated = (draft.attachments || []).filter(a => a.id !== id)
    set('attachments', updated)
    onUpdate(task.id, { attachments: updated })
  }

  /* ── Derived ── */
  const pc = PRIORITY_CONFIG[draft.priority] || PRIORITY_CONFIG.none
  const tc = getTagColor(draft.tag)
  const subtasksList = draft.subtasks || []
  const attachList   = draft.attachments || []
  const subtasksDone = subtasksList.filter(s => s.done || s.is_completed).length
  const subtasksPct  = subtasksList.length > 0 ? Math.round((subtasksDone / subtasksList.length) * 100) : 0
  const dueISO       = draft.due_date || draft.dueDate
  const isOverdue    = dueISO && dueISO < getTodayISO() && !draft.done
  const recurrSummary = draft.recurrence && typeof draft.recurrence === 'object' ? buildRecurrenceSummary(draft.recurrence) : null

  const listOptions = (userLists.length ? userLists : ['Personal', 'Work']).map(l => typeof l === 'string' ? l : l.name)
  const tagOptions  = (userTags.length ? userTags : ['General']).map(t => typeof t === 'string' ? t : t?.name || '')

  if (!task) return null

  return (
    <Modal isOpen={true} onClose={handleClose} className="task-detail-modal">
      <Modal.Header 
        title={
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
            <div className="tdd2-nav" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <IconButton variant="ghost" size="sm" onClick={() => navigateTask(-1)} disabled={taskIndex <= 0} ariaLabel="Previous" icon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18,15 12,9 6,15"/></svg>
              } />
              <span className="tdd2-nav-pos" style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 4px' }}>{taskIndex + 1}/{tasks.length}</span>
              <IconButton variant="ghost" size="sm" onClick={() => navigateTask(1)} disabled={taskIndex >= tasks.length - 1} ariaLabel="Next" icon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6,9 12,15 18,9"/></svg>
              } />
            </div>
            {saveStatus && <SaveStatus status={saveStatus} />}
            <div style={{ marginLeft: 'auto' }}>
              <TopbarActions
                task={task}
                draft={draft}
                isTrashed={isTrashed}
                onToggle={onToggle}
                onDelete={onDelete}
                onRestore={onRestore}
                onClose={handleClose}
              />
            </div>
          </div>
        }
      />
      <Modal.Body style={{ padding: 0 }}>

        {/* ══ PRIORITY ACCENT BAR ══ */}
        <div className="tdd2-accent-bar" style={{ background: `linear-gradient(90deg, ${pc.color}CC, ${pc.color}22)` }} />

        {/* ══ SCROLLABLE BODY ══ */}
        <div className="tdd2-body">

          {/* ── Title ── */}
          <div className="tdd2-title-block" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '24px 24px 0' }}>
            <div className="tdd2-title-check-row" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ marginTop: 4 }}>
                <Checkbox
                  checked={draft.done}
                  onChange={() => onToggle(task.id)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
              <textarea
                className={`pil-input ${draft.done ? 'tdd2-title-input--done' : ''}`}
                style={{
                  flex: 1, fontSize: 24, fontWeight: 700, lineHeight: 1.3,
                  padding: 0, border: 'none', background: 'transparent', resize: 'none',
                  textDecoration: draft.done ? 'line-through' : 'none', color: draft.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                  boxShadow: 'none'
                }}
                value={draft.text}
                onChange={(e) => {
                  set('text', e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                placeholder="Task title…"
                rows={1}
              />
            </div>

            {/* Due date / overdue banner */}
            {dueISO && (
              <div
                className={`tdd2-due-banner ${isOverdue ? 'tdd2-due-banner--overdue' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenProp(p => p === 'dueDate' ? null : 'dueDate')}
                title="Click to edit due date"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {isOverdue ? `Overdue · ${formatDate(dueISO)}` : formatDate(dueISO)}
                {(draft.due_time || draft.dueTime) && ` at ${formatTime(draft.due_time || draft.dueTime)}`}
                {recurrSummary && <span className="tdd2-recur-chip">🔁 {recurrSummary}</span>}
              </div>
            )}
          </div>

          {/* ── Notes ── */}
          <div className="tdd2-section" style={{ padding: '0 24px' }}>
            <textarea
              className="pil-input"
              style={{ minHeight: 80, resize: 'vertical', width: '100%', padding: '12px 16px', background: 'transparent', border: '1px solid transparent' }}
              placeholder="Add notes, links, or markdown…"
              value={draft.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
            />
          </div>

          {/* ── Properties ── */}
          <div className="tdd2-section tdd2-props-section">
            <div className="tdd2-section-header">Properties</div>

            {/* Priority */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon={pc.icon}
                label="Priority"
                value={<Badge size="sm" style={{ color: pc.color, background: pc.bg, border: `1px solid ${pc.color}40` }}>{pc.label}</Badge>}
                active={openProp === 'priority'}
                onClick={() => setOpenProp(p => p === 'priority' ? null : 'priority')}
              />
              {openProp === 'priority' && (
                <InlinePop onClose={() => setOpenProp(null)}>
                  {Object.entries(PRIORITY_CONFIG).map(([key, p]) => (
                    <button
                      key={key}
                      className={`tdd2-pop-item ${draft.priority === key ? 'tdd2-pop-item--active' : ''}`}
                      style={{ '--item-color': p.color }}
                      onClick={() => { set('priority', key); setOpenProp(null) }}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                      {draft.priority === key && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ marginLeft: 'auto' }}><polyline points="20,6 9,17 4,12"/></svg>}
                    </button>
                  ))}
                </InlinePop>
              )}
            </div>

            {/* List */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon="📁"
                label="List"
                value={draft.list || draft.list_name || 'Personal'}
                active={openProp === 'list'}
                onClick={() => setOpenProp(p => p === 'list' ? null : 'list')}
              />
              {openProp === 'list' && (
                <InlinePop onClose={() => setOpenProp(null)}>
                  {listOptions.map(l => (
                    <button
                      key={l}
                      className={`tdd2-pop-item ${(draft.list || draft.list_name) === l ? 'tdd2-pop-item--active' : ''}`}
                      onClick={() => { set('list', l); set('list_name', l); setOpenProp(null) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                      {l}
                    </button>
                  ))}
                </InlinePop>
              )}
            </div>

            {/* Tag */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon="🏷️"
                label="Tag"
                value={
                  <Badge size="sm" style={{ color: tc.color, background: tc.bg, border: `1px solid ${tc.border}` }}>
                    #{draft.tag || 'General'}
                  </Badge>
                }
                active={openProp === 'tag'}
                onClick={() => setOpenProp(p => p === 'tag' ? null : 'tag')}
              />
              {openProp === 'tag' && (
                <InlinePop onClose={() => setOpenProp(null)}>
                  {tagOptions.map(t => {
                    const c = getTagColor(t)
                    return (
                      <button
                        key={t}
                        className={`tdd2-pop-item ${draft.tag === t ? 'tdd2-pop-item--active' : ''}`}
                        onClick={() => { set('tag', t); setOpenProp(null) }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                        #{t}
                      </button>
                    )
                  })}
                </InlinePop>
              )}
            </div>

            {/* Due Date */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon="📅"
                label="Due date"
                value={dueISO ? (
                  <span style={{ color: isOverdue ? '#F43F5E' : 'var(--color-text)', fontWeight: 500 }}>
                    {formatDate(dueISO)}
                  </span>
                ) : (
                  <span className="tdd2-prop-value--muted">No date</span>
                )}
                active={openProp === 'dueDate'}
                onClick={() => setOpenProp(p => p === 'dueDate' ? null : 'dueDate')}
              >
                {dueISO ? (
                  <button
                    type="button"
                    className="tdd2-prop-clear-btn"
                    title="Clear due date"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateDueDate(null)
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                ) : (
                  <span className="tdd2-prop-chevron">›</span>
                )}
              </PropRow>

              {openProp === 'dueDate' && (
                <InlinePop onClose={() => setOpenProp(null)} className="tdd2-inline-pop--date">
                  <div className="tdd2-pop-presets">
                    <button
                      type="button"
                      className={`tdd2-pop-item ${dueISO === getTodayISO() ? 'tdd2-pop-item--active' : ''}`}
                      onClick={() => { updateDueDate(getTodayISO()); setOpenProp(null) }}
                    >
                      <span className="tdd2-pop-preset-icon">🟢</span>
                      <span style={{ flex: 1 }}>Today</span>
                      <span className="tdd2-pop-preset-date">{formatDateShort(getTodayISO())}</span>
                    </button>
                    <button
                      type="button"
                      className={`tdd2-pop-item ${dueISO === getTomorrowISO() ? 'tdd2-pop-item--active' : ''}`}
                      onClick={() => { updateDueDate(getTomorrowISO()); setOpenProp(null) }}
                    >
                      <span className="tdd2-pop-preset-icon">🟡</span>
                      <span style={{ flex: 1 }}>Tomorrow</span>
                      <span className="tdd2-pop-preset-date">{formatDateShort(getTomorrowISO())}</span>
                    </button>
                    <button
                      type="button"
                      className={`tdd2-pop-item ${dueISO === getNextWeekISO() ? 'tdd2-pop-item--active' : ''}`}
                      onClick={() => { updateDueDate(getNextWeekISO()); setOpenProp(null) }}
                    >
                      <span className="tdd2-pop-preset-icon">🔵</span>
                      <span style={{ flex: 1 }}>Next week</span>
                      <span className="tdd2-pop-preset-date">{formatDateShort(getNextWeekISO())}</span>
                    </button>
                  </div>

                  <div className="tdd2-pop-divider" />

                  <div className="tdd2-pop-date-box">
                    <label className="tdd2-pop-field-label">Custom date</label>
                    <input
                      type="date"
                      className="tdd2-pop-date-input"
                      value={dueISO || ''}
                      onChange={(e) => {
                        updateDueDate(e.target.value)
                      }}
                      onClick={(e) => {
                        try { e.target.showPicker?.() } catch {}
                      }}
                    />
                  </div>

                  {dueISO && (
                    <>
                      <div className="tdd2-pop-divider" />
                      <button
                        type="button"
                        className="tdd2-pop-item tdd2-pop-item--danger"
                        onClick={() => { updateDueDate(null); setOpenProp(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>Clear due date</span>
                      </button>
                    </>
                  )}
                </InlinePop>
              )}
            </div>

            {/* Due Time */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon="⏰"
                label="Due time"
                value={(draft.due_time || draft.dueTime) ? (
                  <span style={{ fontWeight: 500 }}>{formatTime(draft.due_time || draft.dueTime)}</span>
                ) : (
                  <span className="tdd2-prop-value--muted">No time</span>
                )}
                active={openProp === 'dueTime'}
                onClick={() => setOpenProp(p => p === 'dueTime' ? null : 'dueTime')}
              >
                {(draft.due_time || draft.dueTime) ? (
                  <button
                    type="button"
                    className="tdd2-prop-clear-btn"
                    title="Clear due time"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateDueTime('')
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                ) : (
                  <span className="tdd2-prop-chevron">›</span>
                )}
              </PropRow>

              {openProp === 'dueTime' && (
                <InlinePop onClose={() => setOpenProp(null)} className="tdd2-inline-pop--date">
                  <div className="tdd2-pop-presets">
                    {TIME_PRESETS.map(p => {
                      const curr = (draft.due_time || draft.dueTime)
                      const isSel = curr === p.val
                      return (
                        <button
                          key={p.val}
                          type="button"
                          className={`tdd2-pop-item ${isSel ? 'tdd2-pop-item--active' : ''}`}
                          onClick={() => { updateDueTime(p.val); setOpenProp(null) }}
                        >
                          <span>{p.icon}</span>
                          <span style={{ flex: 1 }}>{p.label}</span>
                          <span className="tdd2-pop-preset-date">{p.time}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="tdd2-pop-divider" />

                  <div className="tdd2-pop-date-box">
                    <label className="tdd2-pop-field-label">Custom time</label>
                    <input
                      type="time"
                      className="tdd2-pop-date-input"
                      value={toTimeInputValue(draft.due_time || draft.dueTime || '')}
                      onChange={(e) => {
                        updateDueTime(e.target.value)
                      }}
                      onClick={(e) => {
                        try { e.target.showPicker?.() } catch {}
                      }}
                    />
                  </div>

                  {(draft.due_time || draft.dueTime) && (
                    <>
                      <div className="tdd2-pop-divider" />
                      <button
                        type="button"
                        className="tdd2-pop-item tdd2-pop-item--danger"
                        onClick={() => { updateDueTime(''); setOpenProp(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>Clear due time</span>
                      </button>
                    </>
                  )}
                </InlinePop>
              )}
            </div>

            {/* Reminder */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon="🔔"
                label="Reminder"
                value={draft.reminder_offset != null ? notificationService.reminderLabel(draft.reminder_offset) : <span className="tdd2-prop-value--muted">No reminder</span>}
                active={openProp === 'reminder'}
                onClick={() => setOpenProp(p => p === 'reminder' ? null : 'reminder')}
              />
              {openProp === 'reminder' && (
                <InlinePop onClose={() => setOpenProp(null)}>
                  {[['', 'No reminder'], ['0', 'At due time'], ['5', '5 min before'], ['15', '15 min before'], ['30', '30 min before'], ['60', '1 hour before'], ['1440', '1 day before']].map(([val, label]) => (
                    <button
                      key={val}
                      className={`tdd2-pop-item ${String(draft.reminder_offset ?? '') === val ? 'tdd2-pop-item--active' : ''}`}
                      onClick={() => { set('reminder_offset', val === '' ? null : Number(val)); setOpenProp(null) }}
                    >
                      {label}
                    </button>
                  ))}
                </InlinePop>
              )}
            </div>

            {/* Repeat */}
            <div style={{ position: 'relative' }}>
              <PropRow
                icon="🔁"
                label="Repeat"
                value={recurrSummary || <span className="tdd2-prop-value--muted">No repeat</span>}
                active={openProp === 'recur'}
                onClick={() => setOpenProp(p => p === 'recur' ? null : 'recur')}
              />
              {openProp === 'recur' && (
                <InlinePop onClose={() => setOpenProp(null)}>
                  {[['none','No repeat'],['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly'],['custom','Custom…']].map(([val, label]) => (
                    <button
                      key={val}
                      className={`tdd2-pop-item`}
                      onClick={() => {
                        if (val === 'custom') set('recurrence', { freq: 'daily', interval: 1, ends: 'never' })
                        else set('recurrence', val === 'none' ? null : { freq: val, interval: 1, ends: 'never' })
                        setOpenProp(null)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </InlinePop>
              )}
            </div>

            {/* Recurrence editor (expanded inline) */}
            {typeof draft.recurrence === 'object' && draft.recurrence?.freq && (
              <div className="tdd2-recur-editor-wrap">
                <RecurrenceEditor value={draft.recurrence} onChange={(val) => set('recurrence', val)} />
              </div>
            )}
          </div>

          {/* ── Subtasks ── */}
          <div className="tdd2-section">
            <div className="tdd2-section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="tdd2-section-header" style={{ fontSize: 13, fontWeight: 600 }}>Subtasks</span>
              {subtasksList.length > 0 && (
                <div className="tdd2-subtask-stat" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <div className="tdd2-subtask-mini-bar" style={{ width: 40, height: 4, background: 'var(--color-border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                    <div className="tdd2-subtask-mini-fill" style={{ height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease', width: `${subtasksPct}%` }} />
                  </div>
                  <span>{subtasksDone}/{subtasksList.length}</span>
                </div>
              )}
            </div>

            <div className="tdd2-subtask-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subtasksList.map((st, i) => {
                const isDone = Boolean(st.done ?? st.is_completed)
                const titleText = st.title || st.text || ''
                return (
                  <div key={st.id || i} className="tdd2-subtask-row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Checkbox
                      checked={isDone}
                      onChange={() => toggleSubtask(st.id)}
                    />
                    <span className={`tdd2-subtask-text ${isDone ? 'tdd2-subtask-text--done' : ''}`} style={{ flex: 1, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--color-text-muted)' : 'inherit' }}>
                      {titleText}
                    </span>
                    <IconButton variant="ghost" size="sm" onClick={() => removeSubtask(st.id)} ariaLabel="Remove subtask" icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    } />
                  </div>
                )
              })}
            </div>

            {/* Add subtask */}
            <div className="tdd2-subtask-add-row" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Input
                placeholder="Add subtask…"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
              />
              {subtaskInput.trim() && <Button variant="secondary" onClick={addSubtask}>Add</Button>}
            </div>
          </div>

          {/* ── Attachments ── */}
          <div className="tdd2-section" style={{ marginTop: 24 }}>
            <div className="tdd2-section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="tdd2-section-header" style={{ fontSize: 13, fontWeight: 600 }}>Attachments</span>
              <Button variant="ghost" size="sm" onClick={() => setShowAttachForm(s => !s)}>
                + Add link
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachList.map(att => (
                <div key={att.id} className="tdd2-attach-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--color-primary)', flexShrink: 0 }}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="tdd2-attach-link" style={{ flex: 1, fontSize: 13, color: 'var(--color-primary)' }}>{att.name}</a>
                  <IconButton variant="ghost" size="sm" onClick={() => removeAttachment(att.id)} ariaLabel="Remove attachment" icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  } />
                </div>
              ))}
            </div>

            {showAttachForm && (
              <div className="tdd2-attach-form" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <Input placeholder="Link title…" value={attachName} onChange={(e) => setAttachName(e.target.value)} />
                <Input placeholder="https://…" value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addAttachment() }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => setShowAttachForm(false)}>Cancel</Button>
                  <Button variant="secondary" onClick={addAttachment} disabled={!attachName.trim() || !attachUrl.trim()}>Save</Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer timestamps ── */}
          {(task.created_at || task.updated_at) && (
            <div className="tdd2-timestamps" style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
              {task.created_at && <span>Created {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
              {task.updated_at && <span>Updated {new Date(task.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  )
}
