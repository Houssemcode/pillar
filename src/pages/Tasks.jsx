import { useState, useEffect, useRef } from 'react'

/* ─── Data ─────────────────────────────────────────────────── */
const INITIAL_TASKS = [
  { id: 1, text: 'Finalize design system tokens', done: false, priority: 'high', tag: 'Design', list: 'Personal', dueToday: true, notes: 'Review spacing, color, and typography scales before handoff.' },
  { id: 2, text: 'Write unit tests for auth module', done: false, priority: 'medium', tag: 'Dev', list: 'University', dueToday: false, notes: 'Cover login, logout, and token refresh edge cases.' },
  { id: 3, text: 'Review pull-requests', done: true, priority: 'low', tag: 'Dev', list: 'University', dueToday: true, notes: '' },
  { id: 4, text: 'Weekly team retrospective', done: false, priority: 'medium', tag: 'Meetings', list: 'Personal', dueToday: false, notes: 'Prepare action items from the previous sprint.' },
  { id: 5, text: 'Update roadmap Q3 milestones', done: false, priority: 'high', tag: 'Planning', list: 'Personal', dueToday: false, notes: 'Align with product goals and business KPIs.' },
  { id: 6, text: 'Ship landing page copy updates', done: false, priority: 'low', tag: 'Design', list: 'Personal', dueToday: false, notes: '' },
  { id: 7, text: 'Research competitor pricing', done: false, priority: 'medium', tag: 'Planning', list: 'University', dueToday: false, notes: 'Focus on SaaS tools in the productivity space.' },
  { id: 8, text: 'Social media content calendar', done: false, priority: 'low', tag: 'Marketing', list: 'Personal', dueToday: false, notes: 'Plan posts for the next 4 weeks across all channels.' },
]

const TAG_COLORS = {
  Design: { bg: '#3B82F618', color: '#3B82F6', border: '#3B82F640' },
  Dev: { bg: '#6366F118', color: '#6366F1', border: '#6366F140' },
  Meetings: { bg: '#F59E0B18', color: '#F59E0B', border: '#F59E0B40' },
  Planning: { bg: '#10B98118', color: '#10B981', border: '#10B98140' },
  Research: { bg: '#F43F5E18', color: '#F43F5E', border: '#F43F5E40' },
  Marketing: { bg: '#8B5CF618', color: '#8B5CF6', border: '#8B5CF640' },
  Admin: { bg: '#a1a1aa18', color: '#a1a1aa', border: '#a1a1aa40' },
  General: { bg: '#a1a1aa18', color: '#a1a1aa', border: '#a1a1aa40' },
}

const ALL_TAGS = ['Design', 'Dev', 'Meetings', 'Planning', 'Research', 'Marketing', 'Admin', 'General']

const PRIORITY_BAR = { high: '#F43F5E', medium: '#F59E0B', low: '#3f3f46' }
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' }
const LISTS = ['University', 'Personal']

/* ─── Smart Views ─────────────────────────────────────────── */
const SMART_VIEWS = [
  { key: 'all', label: 'All', filter: () => true, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { key: 'today', label: 'Today', filter: t => t.dueToday, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { key: 'next7', label: 'Next 7 days', filter: () => true, icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg> },
]
/* ─── Group / Sort / View options ─────────────────────────── */
const GROUP_OPTIONS = ['none', 'list', 'date', 'tag', 'priority']
const SORT_OPTIONS = ['none', 'list', 'date', 'tag', 'priority']
const VIEW_OPTIONS = [
  { key: 'list', label: 'List view', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg> },
  { key: 'kanban', label: 'Kanban view', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" /></svg> },
  { key: 'timeline', label: 'Timeline view', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /><polyline points="8,8 3,12 8,16" /><polyline points="16,8 21,12 16,16" /></svg> },
]

/* ─── Helpers ──────────────────────────────────────────────── */
function groupTasks(tasks, groupBy) {
  if (groupBy === 'none') return [{ key: null, label: null, tasks }]
  if (groupBy === 'date') {
    const today = tasks.filter(t => t.dueToday)
    const upcoming = tasks.filter(t => !t.dueToday)
    return [
      today.length ? { key: 'today', label: 'Today', tasks: today } : null,
      upcoming.length ? { key: 'upcoming', label: 'Upcoming', tasks: upcoming } : null,
    ].filter(Boolean)
  }
  const map = {}
  tasks.forEach(t => {
    const key = t[groupBy] ?? 'Other'
    if (!map[key]) map[key] = []
    map[key].push(t)
  })
  const keys = groupBy === 'priority'
    ? Object.keys(map).sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b])
    : Object.keys(map).sort()
  return keys.map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), tasks: map[key] }))
}

function sortTasks(tasks, sortBy) {
  if (sortBy === 'none') return tasks
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (sortBy === 'date') return (b.dueToday ? 1 : 0) - (a.dueToday ? 1 : 0)
    const aVal = (a[sortBy] ?? '').toLowerCase()
    const bVal = (b[sortBy] ?? '').toLowerCase()
    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
  })
}

/* ─── Hooks ────────────────────────────────────────────────── */
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

/* ─── Icon helpers ─────────────────────────────────────────── */
const IconChevronDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
const IconCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>

/* ─── Task Detail / Edit Modal ─────────────────────────────── */
function TaskModal({ task, onClose, onToggle, onUpdate, allTags }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ ...task })
  const titleRef = useRef(null)

  // Sync draft when task prop changes (e.g. toggle from outside)
  useEffect(() => { if (!isEditing) setDraft({ ...task }) }, [task, isEditing])

  // Close on ESC
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { isEditing ? handleCancel() : onClose() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isEditing, onClose])

  // Auto-focus title when edit mode starts
  useEffect(() => { if (isEditing) titleRef.current?.focus() }, [isEditing])

  const handleSave = () => {
    onUpdate(task.id, draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft({ ...task })
    setIsEditing(false)
  }

  const set = (field, val) => setDraft(d => ({ ...d, [field]: val }))

  const tc = TAG_COLORS[isEditing ? draft.tag : task.tag] || TAG_COLORS.General
  const displayTask = isEditing ? draft : task

  return (
    <div className="task-modal-backdrop" onClick={() => { if (!isEditing) onClose() }}>
      <div className="task-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* ── Modal header ── */}
        <div className="task-modal-header">
          <div className="task-modal-title-row">
            <div
              className={`task-checkbox ${displayTask.done ? 'task-checkbox--checked' : ''}`}
              style={{ width: 24, height: 24, flexShrink: 0 }}
              onClick={() => onToggle(task.id)}
            >
              {displayTask.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
            </div>

            {isEditing ? (
              <input
                ref={titleRef}
                className="task-modal-title-input"
                value={draft.text}
                onChange={e => set('text', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              />
            ) : (
              <h2 className={`task-modal-title ${displayTask.done ? 'task-modal-title--done' : ''}`}>
                {displayTask.text}
              </h2>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!isEditing && (
              <button className="task-modal-action-btn" onClick={() => setIsEditing(true)} title="Edit task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <button className="task-modal-close" onClick={isEditing ? handleCancel : onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* ── Metadata ── */}
        <div className="task-modal-meta">

          {/* Priority */}
          <div className="task-modal-meta-item">
            <span className="task-modal-meta-label">Priority</span>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                {['high', 'medium', 'low'].map(p => (
                  <button
                    key={p}
                    onClick={() => set('priority', p)}
                    style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: draft.priority === p ? `${PRIORITY_BAR[p]}22` : 'transparent',
                      color: draft.priority === p ? PRIORITY_BAR[p] : 'var(--color-text-muted)',
                      border: `1px solid ${draft.priority === p ? PRIORITY_BAR[p] : 'var(--color-border)'}`,
                      transition: 'all 150ms',
                    }}
                  >{PRIORITY_LABEL[p]}</button>
                ))}
              </div>
            ) : (
              <span className="task-modal-meta-value" style={{ color: PRIORITY_BAR[displayTask.priority], display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_BAR[displayTask.priority], display: 'inline-block' }} />
                {PRIORITY_LABEL[displayTask.priority]}
              </span>
            )}
          </div>

          {/* Tag */}
          <div className="task-modal-meta-item">
            <span className="task-modal-meta-label">Tag</span>
            {isEditing ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {allTags.map(t => {
                  const c = TAG_COLORS[t] || TAG_COLORS.General
                  const active = draft.tag === t
                  return (
                    <button
                      key={t}
                      onClick={() => set('tag', t)}
                      style={{
                        padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: active ? c.bg : 'transparent',
                        color: active ? c.color : 'var(--color-text-muted)',
                        border: `1px solid ${active ? c.border : 'var(--color-border)'}`,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0, display: 'inline-block' }} />
                      {t}
                    </button>
                  )
                })}
              </div>
            ) : (
              <span className="task-tag-badge" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, marginTop: 2 }}>
                {displayTask.tag}
              </span>
            )}
          </div>

          {/* List */}
          <div className="task-modal-meta-item">
            <span className="task-modal-meta-label">List</span>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                {LISTS.map(l => (
                  <button
                    key={l}
                    onClick={() => set('list', l)}
                    style={{
                      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: draft.list === l ? 'var(--color-primary-subtle)' : 'transparent',
                      color: draft.list === l ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      border: `1px solid ${draft.list === l ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
                      transition: 'all 150ms',
                    }}
                  >{l}</button>
                ))}
              </div>
            ) : (
              <span className="task-modal-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                {displayTask.list}
              </span>
            )}
          </div>

          {/* Due */}
          <div className="task-modal-meta-item">
            <span className="task-modal-meta-label">Due date</span>
            {isEditing ? (
              <button
                onClick={() => set('dueToday', !draft.dueToday)}
                style={{
                  marginTop: 2, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', width: 'fit-content',
                  background: draft.dueToday ? 'var(--color-primary-subtle)' : 'transparent',
                  color: draft.dueToday ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  border: `1px solid ${draft.dueToday ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
                  transition: 'all 150ms',
                }}
              >{draft.dueToday ? '📅 Due Today' : 'No due date — click to set Today'}</button>
            ) : (
              <span className="task-modal-meta-value" style={{ color: displayTask.dueToday ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {displayTask.dueToday ? '📅 Today' : 'No due date'}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="task-modal-meta-item" style={{ gridColumn: '1 / -1' }}>
            <span className="task-modal-meta-label">Status</span>
            <span className="task-modal-meta-value">
              {displayTask.done
                ? <span style={{ color: '#10B981' }}>✓ Completed</span>
                : <span style={{ color: 'var(--color-text-muted)' }}>● In progress</span>}
            </span>
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="task-modal-section">
          <div className="task-modal-section-label">Notes</div>
          <textarea
            className="task-modal-notes"
            placeholder="Add notes…"
            value={isEditing ? draft.notes : task.notes}
            onChange={e => isEditing ? set('notes', e.target.value) : onUpdate(task.id, { notes: e.target.value })}
            readOnly={!isEditing}
            style={{ cursor: isEditing ? 'text' : 'default', opacity: isEditing ? 1 : 0.85 }}
          />
        </div>

        {/* ── Footer ── */}
        <div className="task-modal-footer">
          {isEditing ? (
            <>
              <button
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '9px 20px' }}
                onClick={handleSave}
              >Save changes</button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <>
              <button
                className="btn"
                style={{
                  background: task.done ? 'var(--color-surface-3)' : 'var(--color-primary)',
                  color: '#fff', border: 'none', padding: '9px 20px', fontSize: 13,
                }}
                onClick={() => onToggle(task.id)}
              >
                {task.done ? 'Mark as active' : 'Mark as complete'}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Kanban Card ──────────────────────────────────────────── */
function KanbanCard({ task, onToggle, onOpen }) {
  const tc = TAG_COLORS[task.tag] || TAG_COLORS.General
  return (
    <div
      className={`task-kanban-card ${task.done ? 'task-row--done' : ''}`}
      onClick={() => onOpen(task)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div
          className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
          style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onToggle(task.id) }}
        >
          {task.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
        </div>
        <span style={{
          fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.45,
          color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>{task.text}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          className="task-tag-badge"
          style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, fontSize: 10 }}
        >{task.tag}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
          background: `${PRIORITY_BAR[task.priority]}18`,
          color: PRIORITY_BAR[task.priority],
          border: `1px solid ${PRIORITY_BAR[task.priority]}40`,
        }}>{PRIORITY_LABEL[task.priority]}</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{task.list}</span>
      </div>
      {task.dueToday && (
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-primary)', fontWeight: 500 }}>📅 Due today</div>
      )}
    </div>
  )
}

/* ─── Timeline Item ────────────────────────────────────────── */
function TimelineItem({ task, onToggle, onOpen, isLast }) {
  const tc = TAG_COLORS[task.tag] || TAG_COLORS.General
  return (
    <div className="timeline-item">
      <div className="timeline-spine">
        <div
          className={`timeline-dot ${task.done ? 'timeline-dot--done' : ''}`}
          style={{ borderColor: task.done ? '#10B981' : PRIORITY_BAR[task.priority], background: task.done ? '#10B981' : 'var(--color-surface-2)' }}
        />
        {!isLast && <div className="timeline-line" />}
      </div>
      <div
        className={`timeline-card ${task.done ? 'task-row--done' : ''}`}
        onClick={() => onOpen(task)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
            style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }}
            onClick={e => { e.stopPropagation(); onToggle(task.id) }}
          >
            {task.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 500, lineHeight: 1.4,
              color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)',
              textDecoration: task.done ? 'line-through' : 'none',
            }}>{task.text}</div>
            {task.notes && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.notes}
              </div>
            )}
            <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="task-tag-badge" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, fontSize: 10 }}>{task.tag}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
                background: `${PRIORITY_BAR[task.priority]}18`, color: PRIORITY_BAR[task.priority],
                border: `1px solid ${PRIORITY_BAR[task.priority]}40`,
              }}>{PRIORITY_LABEL[task.priority]}</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{task.list}</span>
              {task.dueToday && <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 600 }}>📅 Today</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Task Row (List view) ─────────────────────────────────── */
function TaskRow({ task, showDetails, onToggle, onOpen, groupBy }) {
  const tc = TAG_COLORS[task.tag] || TAG_COLORS.General
  return (
    <div
      id={`task-item-${task.id}`}
      className={`task-row ${task.done ? 'task-row--done' : ''} ${showDetails ? 'task-row--detailed' : ''}`}
    >
      <div className="task-priority-bar" style={{ background: PRIORITY_BAR[task.priority] }} />
      <div
        className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
        onClick={e => { e.stopPropagation(); onToggle(task.id) }}
      >
        {task.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
      </div>
      <div className="task-content" onClick={() => onOpen(task)}>
        <span className="task-text">{task.text}</span>
        {showDetails && (
          <div className="task-details-row">
            {task.dueToday && <span className="task-detail-chip task-detail-chip--due">Today</span>}
            <span className="task-detail-chip">{PRIORITY_LABEL[task.priority]}</span>
            {groupBy !== 'list' && <span className="task-detail-chip">{task.list}</span>}
            {task.notes && <span className="task-detail-notes">{task.notes}</span>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span className="task-tag-badge" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
          {task.tag}
        </span>
        <button className="task-open-btn" onClick={e => { e.stopPropagation(); onOpen(task) }} title="Open task">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ─── Group header (shared) ────────────────────────────────── */
function GroupHeader({ label, count, groupBy }) {
  const isDate = label === 'Today' || label === 'Upcoming'
  const isPriority = groupBy === 'priority'
  const priorityKey = label.toLowerCase()

  return (
    <div className="tasks-group-header">
      {isPriority && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_BAR[priorityKey], display: 'inline-block' }} />
      )}
      {isDate && <span style={{ fontSize: 12 }}>{label === 'Today' ? '📅' : '🗓️'}</span>}
      <span>{label}</span>
      <span className="tasks-group-count">{count}</span>
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */
export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [smartView, setSmartView] = useState('all')
  const [activeList, setActiveList] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  const [groupBy, setGroupBy] = useState('none')
  const [sortBy, setSortBy] = useState('none')
  const [viewMode, setViewMode] = useState('list')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showTrash, setShowTrash] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const groupDropdown = useDropdown()
  const moreDropdown = useDropdown()

  /* ── Derived ── */
  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = Math.round((done / total) * 100)
  const allTags = [...new Set(tasks.map(t => t.tag))]

  /* ── Filter + sort + group pipeline (shared by all views) ── */
  const svFilter = SMART_VIEWS.find(v => v.key === smartView)?.filter ?? (() => true)
  const filtered = tasks
    .filter(svFilter)
    .filter(t => !activeList || t.list === activeList)
    .filter(t => !activeTag || t.tag === activeTag)
    .filter(t => showCompleted ? true : !t.done)

  const sorted = sortTasks(filtered, sortBy)
  const grouped = groupTasks(sorted, groupBy)   // ← all three views use this

  /* ── Handlers ── */
  const toggle = id => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const updateTask = (id, patch) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))

  // Keep modal in sync when tasks change
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id)
      if (updated) setSelectedTask(updated)
    }
  }, [tasks])

  const addTask = () => {
    if (!newTask.trim()) { setAdding(false); return }
    setTasks(prev => [
      { id: Date.now(), text: newTask, done: false, priority: 'medium', tag: 'General', list: 'Personal', dueToday: false, notes: '' },
      ...prev,
    ])
    setNewTask('')
    setAdding(false)
  }

  const hasGroupSort = groupBy !== 'none' || sortBy !== 'none'
  const hasMoreActive = !showCompleted || showTrash || showDetails

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="page tasks-page">

      {/* ── Header ── */}
      <div className="tasks-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-subtitle">{done} of {total} completed</div>
        </div>
        <button id="tasks-new-task-btn" className="btn btn-primary" onClick={() => setAdding(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="tasks-progress-track">
        <div className="tasks-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Filter bar ── */}
      <div className="tasks-filter-bar">
        <div className="tasks-filter-section">
          <span className="tasks-filter-section-label">Views</span>
          <div className="tasks-filter-pills">
            {SMART_VIEWS.map(v => (
              <button
                key={v.key}
                id={`tasks-smart-${v.key}`}
                onClick={() => setSmartView(v.key)}
                className={`tasks-pill ${smartView === v.key ? 'tasks-pill--active' : ''}`}
              >
                <span className="tasks-pill-icon">{v.icon}</span>{v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tasks-filter-sep" />

        <div className="tasks-filter-section">
          <span className="tasks-filter-section-label">Lists</span>
          <div className="tasks-filter-pills">
            {LISTS.map(list => (
              <button
                key={list}
                id={`tasks-list-${list.toLowerCase()}`}
                onClick={() => setActiveList(prev => prev === list ? null : list)}
                className={`tasks-pill ${activeList === list ? 'tasks-pill--active' : ''}`}
              >
                <span className="tasks-pill-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </span>
                {list}
              </button>
            ))}
            <button className="tasks-pill-add" title="New list">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="tasks-filter-sep" />

        <div className="tasks-filter-section">
          <span className="tasks-filter-section-label">Tags</span>
          <div className="tasks-filter-pills">
            {allTags.map(tag => {
              const tc = TAG_COLORS[tag] || TAG_COLORS.General
              const isActive = activeTag === tag
              return (
                <button
                  key={tag}
                  id={`tasks-tag-${tag.toLowerCase()}`}
                  onClick={() => setActiveTag(prev => prev === tag ? null : tag)}
                  className="tasks-tag-pill"
                  style={{
                    background: isActive ? tc.bg : 'transparent',
                    color: isActive ? tc.color : 'var(--color-text-muted)',
                    border: `1px solid ${isActive ? tc.border : 'var(--color-border)'}`,
                  }}
                >
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
                  {tag}
                </button>
              )
            })}
            <button className="tasks-pill-add" title="New tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {(activeList || activeTag || smartView !== 'all') && (
          <button
            className="tasks-filter-clear"
            onClick={() => { setActiveList(null); setActiveTag(null); setSmartView('all') }}
            title="Clear all filters"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="tasks-toolbar">
        <div className="tasks-toolbar-info">
          <span>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
          {hasGroupSort && (
            <span className="tasks-toolbar-hint">
              {[groupBy !== 'none' && `grouped by ${groupBy}`, sortBy !== 'none' && `sorted by ${sortBy}`].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {/* Group & Sorting */}
          <div className="tasks-dropdown-root" ref={groupDropdown.ref}>
            <button
              id="tasks-group-sort-btn"
              className={`tasks-toolbar-btn ${hasGroupSort ? 'tasks-toolbar-btn--active' : ''}`}
              onClick={() => { groupDropdown.setOpen(o => !o); moreDropdown.setOpen(false) }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" />
              </svg>
              Group &amp; Sorting <IconChevronDown />
            </button>
            {groupDropdown.open && (
              <div className="tasks-dropdown">
                <div className="tasks-dropdown-section-label">Group by</div>
                {GROUP_OPTIONS.map(opt => (
                  <button key={opt} className="tasks-dropdown-item" onClick={() => setGroupBy(opt)}>
                    <span className="tasks-dropdown-item-check">{groupBy === opt && <IconCheck />}</span>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
                <div className="tasks-dropdown-divider" />
                <div className="tasks-dropdown-section-label">Sort by</div>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} className="tasks-dropdown-item" onClick={() => setSortBy(opt)}>
                    <span className="tasks-dropdown-item-check">{sortBy === opt && <IconCheck />}</span>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
                {hasGroupSort && (
                  <>
                    <div className="tasks-dropdown-divider" />
                    <button className="tasks-dropdown-item tasks-dropdown-item--danger" onClick={() => { setGroupBy('none'); setSortBy('none') }}>
                      <span className="tasks-dropdown-item-check" /> Reset all
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* More */}
          <div className="tasks-dropdown-root" ref={moreDropdown.ref}>
            <button
              id="tasks-more-btn"
              className={`tasks-toolbar-btn ${hasMoreActive ? 'tasks-toolbar-btn--active' : ''}`}
              onClick={() => { moreDropdown.setOpen(o => !o); groupDropdown.setOpen(false) }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
              </svg>
              More <IconChevronDown />
            </button>
            {moreDropdown.open && (
              <div className="tasks-dropdown tasks-dropdown--right">
                <div className="tasks-dropdown-section-label">View</div>
                {VIEW_OPTIONS.map(v => (
                  <button key={v.key} className="tasks-dropdown-item" onClick={() => setViewMode(v.key)}>
                    <span className="tasks-dropdown-item-check">{viewMode === v.key && <IconCheck />}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{v.icon}{v.label}</span>
                  </button>
                ))}
                <div className="tasks-dropdown-divider" />
                <button className="tasks-dropdown-item" onClick={() => setShowDetails(s => !s)}>
                  <span className="tasks-dropdown-item-check">{showDetails && <IconCheck />}</span>
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
                <button className="tasks-dropdown-item" onClick={() => setShowCompleted(s => !s)}>
                  <span className="tasks-dropdown-item-check">{showCompleted && <IconCheck />}</span>
                  {showCompleted ? 'Hide completed' : 'Show completed'}
                </button>
                <button className="tasks-dropdown-item" onClick={() => setShowTrash(s => !s)}>
                  <span className="tasks-dropdown-item-check">{showTrash && <IconCheck />}</span>
                  {showTrash ? 'Hide trash' : 'Show trash'}
                </button>
                <div className="tasks-dropdown-divider" />
                <button className="tasks-dropdown-item" onClick={() => window.print()}>
                  <span className="tasks-dropdown-item-check" />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6,9 6,2 18,2 18,9" />
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Inline add ── */}
      {adding && (
        <div className="tasks-add-row">
          <input
            autoFocus className="input" placeholder="What needs to be done?"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false) }}
          />
          <button className="btn btn-primary" onClick={addTask}>Add</button>
          <button className="btn btn-ghost" onClick={() => setAdding(false)}>✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          LIST VIEW  — uses grouped (respects groupBy + sortBy)
          ═══════════════════════════════════════════════════════ */}
      {viewMode === 'list' && (
        <div className="tasks-list">
          {filtered.length === 0 && <div className="tasks-empty">No tasks match this filter</div>}
          {grouped.map(group => (
            <div key={group.key ?? '_all'}>
              {group.label && <GroupHeader label={group.label} count={group.tasks.length} groupBy={groupBy} />}
              {group.tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showDetails={showDetails}
                  groupBy={groupBy}
                  onToggle={toggle}
                  onOpen={setSelectedTask}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          KANBAN VIEW — uses grouped (respects groupBy + sortBy)
          Each group = one column
          ═══════════════════════════════════════════════════════ */}
      {viewMode === 'kanban' && (
        <div className={`tasks-kanban ${grouped.length > 3 ? 'tasks-kanban--wide' : ''}`}>
          {grouped.map(group => {
            // Column accent: use group-specific color when grouped by priority/tag
            const accentColor = groupBy === 'priority'
              ? PRIORITY_BAR[group.key] ?? 'var(--color-border)'
              : groupBy === 'tag'
                ? (TAG_COLORS[group.key]?.color ?? 'var(--color-border)')
                : 'var(--color-primary)'

            return (
              <div key={group.key ?? '_all'} className="tasks-kanban-col">
                <div className="tasks-kanban-col-header" style={{ '--col-accent': accentColor }}>
                  <span className="tasks-kanban-col-accent" />
                  <span style={{ flex: 1 }}>{group.label ?? 'All Tasks'}</span>
                  <span className="tasks-group-count">{group.tasks.length}</span>
                </div>
                {group.tasks.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '12px 4px', textAlign: 'center', fontStyle: 'italic' }}>
                    No tasks
                  </div>
                )}
                {group.tasks.map(task => (
                  <KanbanCard key={task.id} task={task} onToggle={toggle} onOpen={setSelectedTask} />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TIMELINE VIEW — uses grouped (respects groupBy + sortBy)
          Each group = a section with vertical timeline
          ═══════════════════════════════════════════════════════ */}
      {viewMode === 'timeline' && (
        <div className="tasks-timeline">
          {filtered.length === 0 && <div className="tasks-empty">No tasks match this filter</div>}
          {grouped.map(group => (
            <div key={group.key ?? '_all'} className="timeline-group">
              {group.label && (
                <div className="timeline-group-header">
                  <GroupHeader label={group.label} count={group.tasks.length} groupBy={groupBy} />
                </div>
              )}
              <div className="timeline-list">
                {group.tasks.map((task, i) => (
                  <TimelineItem
                    key={task.id}
                    task={task}
                    onToggle={toggle}
                    onOpen={setSelectedTask}
                    isLast={i === group.tasks.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FAB ── */}
      <button className="fab" onClick={() => setAdding(true)} aria-label="Add task">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ── Task detail / edit modal ── */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          allTags={ALL_TAGS}
          onClose={() => setSelectedTask(null)}
          onToggle={toggle}
          onUpdate={updateTask}
        />
      )}
    </div>
  )
}
