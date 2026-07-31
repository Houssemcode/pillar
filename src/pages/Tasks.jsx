import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Data ─────────────────────────────────────────────────── */
const INITIAL_TASKS = [
  { id: 1, text: 'Finalize design system tokens', done: false, priority: 'high', tag: 'Design', list: 'Personal', dueToday: true },
  { id: 2, text: 'Write unit tests for auth module', done: false, priority: 'medium', tag: 'Dev', list: 'University', dueToday: false },
  { id: 3, text: 'Review pull-requests', done: true, priority: 'low', tag: 'Dev', list: 'University', dueToday: true },
  { id: 4, text: 'Weekly team retrospective', done: false, priority: 'medium', tag: 'Meetings', list: 'Personal', dueToday: false },
  { id: 5, text: 'Update roadmap Q3 milestones', done: false, priority: 'high', tag: 'Planning', list: 'Personal', dueToday: false },
  { id: 6, text: 'Ship landing page copy updates', done: false, priority: 'low', tag: 'Design', list: 'Personal', dueToday: false },
  { id: 7, text: 'Research competitor pricing', done: false, priority: 'medium', tag: 'Planning', list: 'University', dueToday: false },
  { id: 8, text: 'Ship landing page copy updates', done: false, priority: 'low', tag: 'Marketing', list: 'Personal', dueToday: false },
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

const PRIORITY_BAR = { high: '#F43F5E', medium: '#F59E0B', low: '#3f3f46' }
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const LISTS = ['University', 'Personal']

/* ─── Smart Views ─────────────────────────────────────────── */
const SMART_VIEWS = [
  {
    key: 'all', label: 'All',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    filter: () => true,
  },
  {
    key: 'today', label: 'Today',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    filter: (t) => t.dueToday,
  },
  {
    key: 'next7', label: 'Next 7 days',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>,
    filter: () => true,
  },
]

/* ─── Group / Sort options ─────────────────────────────────── */
const GROUP_OPTIONS = ['none', 'list', 'date', 'tag', 'priority']
const SORT_OPTIONS = ['none', 'list', 'date', 'tag', 'priority']
const VIEW_OPTIONS = [
  { key: 'list', label: 'List view', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg> },
  { key: 'kanban', label: 'Kanban view', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" /></svg> },
  { key: 'timeline', label: 'Timeline view', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12" /><polyline points="8,8 3,12 8,16" /><polyline points="16,8 21,12 16,16" /></svg> },
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

/* ─── Reusable dropdown hook ───────────────────────────────── */
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  return { open, setOpen, ref }
}

/* ─── Small Icon helpers ───────────────────────────────────── */
const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>
)

/* ─── Component ────────────────────────────────────────────── */
export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [smartView, setSmartView] = useState('all')
  const [activeList, setActiveList] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newTask, setNewTask] = useState('')

  // Toolbar state
  const [groupBy, setGroupBy] = useState('none')
  const [sortBy, setSortBy] = useState('none')
  const [viewMode, setViewMode] = useState('list')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showTrash, setShowTrash] = useState(false)

  const groupDropdown = useDropdown()
  const moreDropdown = useDropdown()

  /* ── Derived ── */
  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = Math.round((done / total) * 100)
  const allTags = [...new Set(tasks.map(t => t.tag))]

  /* ── Filter pipeline ── */
  const svFilter = SMART_VIEWS.find(v => v.key === smartView)?.filter ?? (() => true)
  const filtered = tasks
    .filter(svFilter)
    .filter(t => !activeList || t.list === activeList)
    .filter(t => !activeTag || t.tag === activeTag)
    .filter(t => showCompleted ? true : !t.done)

  const sorted = sortTasks(filtered, sortBy)
  const grouped = groupTasks(sorted, groupBy)

  /* ── Handlers ── */
  const toggle = (id) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const addTask = () => {
    if (!newTask.trim()) { setAdding(false); return }
    setTasks(prev => [
      { id: Date.now(), text: newTask, done: false, priority: 'medium', tag: 'General', list: 'Personal', dueToday: false },
      ...prev,
    ])
    setNewTask('')
    setAdding(false)
  }

  const handlePrint = () => window.print()

  /* ── Group/Sort labels ── */
  const groupLabel = groupBy !== 'none' ? `Group: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}` : 'Group & Sorting'
  const hasGroupSort = groupBy !== 'none' || sortBy !== 'none'

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="page tasks-page">

      {/* ── Header ── */}
      <div className="tasks-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-subtitle">{done} of {total} completed</div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="tasks-progress-track">
        <div className="tasks-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Filter panels row ── */}
      <div className="tasks-filter-row">

        {/* Smart Views */}
        <div className="tasks-filter-panel">
          <div className="tasks-filter-panel-label">Smart Views</div>
          <div className="tasks-filter-panel-pills">
            {SMART_VIEWS.map(v => (
              <button
                key={v.key}
                id={`tasks-smart-${v.key}`}
                onClick={() => setSmartView(v.key)}
                className={`tasks-pill ${smartView === v.key ? 'tasks-pill--active' : ''}`}
              >
                <span className="tasks-pill-icon">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lists */}
        <div className="tasks-filter-panel">
          <div className="tasks-filter-panel-label">Lists</div>
          <div className="tasks-filter-panel-pills">
            {LISTS.map(list => (
              <button
                key={list}
                id={`tasks-list-${list.toLowerCase()}`}
                onClick={() => setActiveList(prev => prev === list ? null : list)}
                className={`tasks-pill ${activeList === list ? 'tasks-pill--active' : ''}`}
              >
                <span className="tasks-pill-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </span>
                {list}
              </button>
            ))}
            <button className="tasks-pill-add" title="New list">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="tasks-filter-panel">
          <div className="tasks-filter-panel-label">Tags</div>
          <div className="tasks-filter-panel-pills">
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
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
                  {tag}
                </button>
              )
            })}
            <button className="tasks-pill-add" title="New tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar (Group & Sorting · More) ── */}
      <div className="tasks-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          {(groupBy !== 'none' || sortBy !== 'none') && (
            <span style={{ color: 'var(--color-primary)', marginLeft: 4 }}>
              {[groupBy !== 'none' && `grouped by ${groupBy}`, sortBy !== 'none' && `sorted by ${sortBy}`].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>

          {/* ── Group & Sorting dropdown ── */}
          <div className="tasks-dropdown-root" ref={groupDropdown.ref}>
            <button
              id="tasks-group-sort-btn"
              className={`tasks-toolbar-btn ${hasGroupSort ? 'tasks-toolbar-btn--active' : ''}`}
              onClick={() => { groupDropdown.setOpen(o => !o); moreDropdown.setOpen(false) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" />
              </svg>
              Group &amp; Sorting
              <IconChevronDown />
            </button>

            {groupDropdown.open && (
              <div className="tasks-dropdown">

                {/* Group by */}
                <div className="tasks-dropdown-section-label">Group by</div>
                {GROUP_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className="tasks-dropdown-item"
                    onClick={() => { setGroupBy(opt) }}
                  >
                    <span className="tasks-dropdown-item-check">
                      {groupBy === opt && <IconCheck />}
                    </span>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}

                <div className="tasks-dropdown-divider" />

                {/* Sort by */}
                <div className="tasks-dropdown-section-label">Sort by</div>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className="tasks-dropdown-item"
                    onClick={() => { setSortBy(opt) }}
                  >
                    <span className="tasks-dropdown-item-check">
                      {sortBy === opt && <IconCheck />}
                    </span>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}

                {hasGroupSort && (
                  <>
                    <div className="tasks-dropdown-divider" />
                    <button
                      className="tasks-dropdown-item tasks-dropdown-item--danger"
                      onClick={() => { setGroupBy('none'); setSortBy('none') }}
                    >
                      <span className="tasks-dropdown-item-check" />
                      Reset all
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── More dropdown ── */}
          <div className="tasks-dropdown-root" ref={moreDropdown.ref}>
            <button
              id="tasks-more-btn"
              className="tasks-toolbar-btn"
              onClick={() => { moreDropdown.setOpen(o => !o); groupDropdown.setOpen(false) }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
              </svg>
              More
              <IconChevronDown />
            </button>

            {moreDropdown.open && (
              <div className="tasks-dropdown tasks-dropdown--right">

                {/* View mode */}
                <div className="tasks-dropdown-section-label">View</div>
                {VIEW_OPTIONS.map(v => (
                  <button
                    key={v.key}
                    className="tasks-dropdown-item"
                    onClick={() => setViewMode(v.key)}
                  >
                    <span className="tasks-dropdown-item-check">
                      {viewMode === v.key && <IconCheck />}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {v.icon} {v.label}
                    </span>
                  </button>
                ))}

                <div className="tasks-dropdown-divider" />

                {/* Toggles */}
                <button
                  className="tasks-dropdown-item"
                  onClick={() => setShowCompleted(s => !s)}
                >
                  <span className="tasks-dropdown-item-check">
                    {showCompleted && <IconCheck />}
                  </span>
                  {showCompleted ? 'Hide completed' : 'Show completed'}
                </button>

                <button
                  className="tasks-dropdown-item"
                  onClick={() => setShowTrash(s => !s)}
                >
                  <span className="tasks-dropdown-item-check">
                    {showTrash && <IconCheck />}
                  </span>
                  {showTrash ? 'Hide trash' : 'Show trash'}
                </button>

                <div className="tasks-dropdown-divider" />

                {/* Print */}
                <button className="tasks-dropdown-item" onClick={handlePrint}>
                  <span className="tasks-dropdown-item-check" />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6,9 6,2 18,2 18,9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
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
            autoFocus
            className="input"
            placeholder="What needs to be done?"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') setAdding(false) }}
          />
          <button className="btn btn-primary" onClick={addTask}>Add</button>
          <button className="btn btn-ghost" onClick={() => setAdding(false)}>✕</button>
        </div>
      )}

      {/* ── Task list / Kanban / Timeline ── */}
      {viewMode === 'list' && (
        <div className="tasks-list">
          {filtered.length === 0 && (
            <div className="tasks-empty">No tasks match this filter</div>
          )}
          {grouped.map(group => (
            <div key={group.key ?? '_all'}>
              {group.label && (
                <div className="tasks-group-header">
                  <span>{group.label}</span>
                  <span className="tasks-group-count">{group.tasks.length}</span>
                </div>
              )}
              {group.tasks.map(task => {
                const tc = TAG_COLORS[task.tag] || TAG_COLORS.General
                return (
                  <div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    className={`task-row ${task.done ? 'task-row--done' : ''}`}
                    onClick={() => toggle(task.id)}
                  >
                    <div className="task-priority-bar" style={{ background: PRIORITY_BAR[task.priority] }} />
                    <div
                      className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
                      onClick={e => { e.stopPropagation(); toggle(task.id) }}
                    >
                      {task.done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                    <span className="task-text">{task.text}</span>
                    {task.list && groupBy !== 'list' && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{task.list}</span>
                    )}
                    <span
                      className="task-tag-badge"
                      style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}
                    >
                      {task.tag}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="tasks-kanban">
          {['high', 'medium', 'low'].map(p => {
            const col = filtered.filter(t => t.priority === p)
            return (
              <div key={p} className="tasks-kanban-col">
                <div className="tasks-kanban-col-header">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_BAR[p], display: 'inline-block', marginRight: 8 }} />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                  <span className="tasks-group-count">{col.length}</span>
                </div>
                {col.map(task => {
                  const tc = TAG_COLORS[task.tag] || TAG_COLORS.General
                  return (
                    <div
                      key={task.id}
                      className={`task-kanban-card ${task.done ? 'task-row--done' : ''}`}
                      onClick={() => toggle(task.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div
                          className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
                          style={{ width: 18, height: 18 }}
                          onClick={e => { e.stopPropagation(); toggle(task.id) }}
                        >
                          {task.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="task-tag-badge" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, fontSize: 10 }}>{task.tag}</span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{task.list}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="tasks-timeline-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12" /><polyline points="8,8 3,12 8,16" /><polyline points="16,8 21,12 16,16" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginTop: 16 }}>Timeline view</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>Coming soon — visualize tasks on a Gantt-style timeline</div>
        </div>
      )}

      {/* ── FAB ── */}
      <button className="fab" onClick={() => setAdding(true)} aria-label="Add task">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
