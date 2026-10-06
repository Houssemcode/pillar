import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Badge      from '../ui/Badge'
import IconButton from '../ui/IconButton'
import Checkbox   from '../ui/Checkbox'
import { formatTimeHHmm } from '../../utils/timeUtils'

/* ── Constants ──────────────────────────────────────────────── */
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

const PRIORITY_BAR   = { high: '#F43F5E', medium: '#F59E0B', low: '#3B82F6', none: '#71717a' }
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low', none: 'None' }

// Maps priority key to Badge variant
const PRIORITY_BADGE_VARIANT = { high: 'danger', medium: 'warning', low: 'primary', none: 'default' }

function buildRecurrenceSummary(rule) {
  if (!rule || !rule.freq) return null
  const { freq, interval = 1 } = rule
  if (interval > 1) return `Every ${interval} ${freq.replace('ly', 's')}`
  return freq.charAt(0).toUpperCase() + freq.slice(1)
}

function getTodayISO()    { return new Date().toISOString().split('T')[0] }
function getTomorrowISO() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

/* ── Inline SVG atoms ──────────────────────────────────────── */
const CalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
  </svg>
)
const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5"  r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
  </svg>
)

/**
 * TaskRowEnhanced — Migrated to Design System
 *
 * Changes:
 * - Custom .task-checkbox div → <Checkbox> (Framer Motion draw-on animation)
 * - .ter-tag-badge inline span  → <Badge> with dynamic colour
 * - Due/overdue/date spans      → <Badge variant="danger|default|primary">
 * - Hover quick-action .ter-qa-btn buttons → <IconButton variant="ghost" size="sm">
 * - Mobile 3-dots menu .ter-mobile-more-btn → <IconButton>
 * - All inline-style buttons removed
 */
export default function TaskRowEnhanced({
  task, groupBy, showDetails, isSelected, selectionMode,
  onToggle, onOpen, onDelete, onRestore, onSelect, onUpdate,
  userTags = [],
}) {
  const { t } = useTranslation()
  const [hovered,           setHovered]           = useState(false)
  const [showReschedule,    setShowReschedule]    = useState(false)
  const [showMobileActions, setShowMobileActions] = useState(false)

  const tagColor = task.tag_color || task.tagColor || task.tags?.[0]?.color || (Array.isArray(userTags) ? userTags.find(t => (typeof t === 'string' ? t : t?.name)?.toLowerCase() === task.tag?.toLowerCase())?.color : null) || getTagColor(task.tag).color
  const tc          = getTagColor(task.tag)
  const isTrashed   = task.in_trash || task.inTrash
  const subtasks    = task.subtasks || []
  const subtasksDone = subtasks.filter(s => s.done).length

  const todayISO    = getTodayISO()
  const dueISO      = task.due_date || task.dueDate || null
  const isOverdue   = dueISO && dueISO < todayISO && !task.done
  const isDueToday  = dueISO === todayISO || task.dueToday

  const recurrenceSummary = task.recurrence && typeof task.recurrence === 'object'
    ? buildRecurrenceSummary(task.recurrence)
    : null

  const daysDiff = dueISO && isOverdue
    ? Math.floor((new Date(todayISO) - new Date(dueISO)) / 86400000)
    : null

  /* ── Handlers ──────────────────────────────────────────── */
  const handleCheckbox = (e) => {
    e.stopPropagation()
    if (selectionMode) { onSelect(task.id); return }
    onToggle(task.id)
  }

  const cyclePriority = (e) => {
    e.stopPropagation()
    const order = ['high', 'medium', 'low', 'none']
    const next  = order[(order.indexOf(task.priority) + 1) % order.length]
    onUpdate(task.id, { priority: next })
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div
      id={`task-item-${task.id}`}
      className={`ter-row ${task.done ? 'ter-row--done' : ''} ${isTrashed ? 'ter-row--trashed' : ''} ${isSelected ? 'ter-row--selected' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowReschedule(false) }}
    >
      {/* Priority bar */}
      <div
        className="ter-priority-bar"
        style={{ background: isTrashed ? '#71717a' : PRIORITY_BAR[task.priority] }}
      />

      {/* ── Checkbox — uses Design System Checkbox with pathLength animation ── */}
      {!isTrashed && (
        <div
          className="ter-checkbox-hitbox"
          onClick={handleCheckbox}
          role="button"
          tabIndex={0}
          aria-label={selectionMode ? 'Select task' : task.done ? 'Mark active' : 'Mark complete'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCheckbox(e) }
          }}
        >
          <Checkbox
            checked={task.done || isSelected}
            onChange={handleCheckbox}
            size="sm"
            aria-label={task.done ? 'Mark active' : 'Mark complete'}
          />
        </div>
      )}

      {/* ── Main content ── */}
      <div className="ter-content" onClick={() => onOpen(task)}>
        <span
          className="ter-text"
          style={{ textDecoration: isTrashed || task.done ? 'line-through' : 'none' }}
        >
          {task.text}
        </span>

        {/* Detail badge row */}
        <div className="ter-detail-row">
          {/* Overdue */}
          {isOverdue && (
            <Badge variant="danger" size="sm">
              Overdue{daysDiff > 0 ? ` ${daysDiff}d` : ''}
            </Badge>
          )}
          {/* Due today */}
          {isDueToday && !isOverdue && (
            <Badge variant="primary" size="sm">{t('tasks.todayTag')}</Badge>
          )}
          {/* Specific date */}
          {dueISO && !isDueToday && !isOverdue && (
            <Badge variant="default" size="sm" icon={<CalIcon />}>
              {dueISO}
            </Badge>
          )}
          {/* Due time */}
          {(task.due_time || task.dueTime) && (
            <Badge variant="default" size="sm">
              🕒 {formatTimeHHmm(task.due_time || task.dueTime)}
            </Badge>
          )}
          {/* Subtask progress */}
          {subtasks.length > 0 && (
            <Badge variant="default" size="sm">
              {subtasksDone}/{subtasks.length}
            </Badge>
          )}
          {/* Recurrence */}
          {recurrenceSummary && (
            <Badge variant="default" size="sm">🔁 {recurrenceSummary}</Badge>
          )}
          {/* Notes snippet */}
          {showDetails && task.notes && (
            <span className="ter-notes-snippet">{task.notes}</span>
          )}
        </div>
      </div>

      {/* ── Tag badge with dynamic colour ── */}
      {task.tag && (
        <span
          className="ter-tag-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
          style={{
            backgroundColor: `${tagColor}20`,
            color: tagColor,
            borderColor: `${tagColor}40`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
          #{task.tag}
        </span>
      )}

      {/* ── Desktop hover quick actions — IconButton ── */}
      {hovered && !isTrashed && (
        <div className="ter-quick-actions">
          {/* Reschedule */}
          <div style={{ position: 'relative' }}>
            <IconButton
              icon={<CalIcon />}
              ariaLabel="Quick reschedule"
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowReschedule(s => !s) }}
            />
            {showReschedule && (
              <div className="ter-qs-menu">
                {[
                  { label: 'Today',    val: getTodayISO() },
                  { label: 'Tomorrow', val: getTomorrowISO() },
                  { label: 'Clear',    val: null },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    className="ter-qs-item"
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdate(task.id, { due_date: val, dueDate: val, dueToday: val === getTodayISO() })
                      setShowReschedule(false)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority cycle */}
          <IconButton
            icon={<span style={{ fontSize: 10, color: PRIORITY_BAR[task.priority] }}>🚩</span>}
            ariaLabel={`Priority: ${PRIORITY_LABEL[task.priority]} — click to cycle`}
            variant="ghost"
            size="sm"
            onClick={cyclePriority}
          />

          {/* Trash */}
          <IconButton
            icon={<TrashIcon />}
            ariaLabel="Move to trash"
            variant="ghost"
            size="sm"
            className="ter-qa-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id, false) }}
          />
        </div>
      )}

      {/* ── Mobile 3-dots menu — IconButton ── */}
      {!isTrashed && (
        <div className="ter-mobile-action-wrap" onClick={(e) => e.stopPropagation()}>
          <IconButton
            icon={<DotsIcon />}
            ariaLabel="More task actions"
            variant="ghost"
            size="sm"
            className="ter-mobile-more-btn"
            onClick={() => setShowMobileActions(s => !s)}
          />
          {showMobileActions && (
            <div className="ter-mobile-popover">
              <button
                className="ter-mobile-pop-item"
                onClick={() => {
                  cyclePriority({ stopPropagation: () => {} })
                  setShowMobileActions(false)
                }}
              >
                <span style={{ color: PRIORITY_BAR[task.priority] }}>🚩</span>
                <span>Priority: <b>{PRIORITY_LABEL[task.priority]}</b></span>
              </button>
              <button
                className="ter-mobile-pop-item"
                onClick={() => {
                  onUpdate(task.id, { due_date: getTodayISO(), dueDate: getTodayISO(), dueToday: true })
                  setShowMobileActions(false)
                }}
              >
                <span>📅</span><span>Due Today</span>
              </button>
              <button
                className="ter-mobile-pop-item"
                onClick={() => {
                  onUpdate(task.id, { due_date: getTomorrowISO(), dueDate: getTomorrowISO(), dueToday: false })
                  setShowMobileActions(false)
                }}
              >
                <span>🌅</span><span>Due Tomorrow</span>
              </button>
              <div className="ter-mobile-pop-divider" />
              <button
                className="ter-mobile-pop-item ter-mobile-pop-item--danger"
                onClick={() => { onDelete(task.id, false); setShowMobileActions(false) }}
              >
                <TrashIcon />
                <span>Move to trash</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Trash restore/delete actions ── */}
      {isTrashed && (
        <div className="ter-trash-actions">
          <IconButton
            icon={<span style={{ fontSize: 12 }}>↩</span>}
            ariaLabel="Restore task"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRestore(task.id) }}
          />
          <IconButton
            icon={<span style={{ fontSize: 12 }}>🗑️</span>}
            ariaLabel="Permanently delete task"
            variant="ghost"
            size="sm"
            className="ter-qa-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id, true) }}
          />
        </div>
      )}
    </div>
  )
}
