import { useState } from 'react'

/* ─── Data ─────────────────────────────────────────────────── */
const INITIAL_TASKS = [
  { id: 1, text: 'Finalize design system tokens',      done: false, priority: 'high',   tag: 'Design',   list: 'Personal',   dueToday: true  },
  { id: 2, text: 'Write unit tests for auth module',   done: false, priority: 'medium', tag: 'Dev',      list: 'University', dueToday: false },
  { id: 3, text: 'Review pull-requests',               done: true,  priority: 'low',    tag: 'Dev',      list: 'University', dueToday: true  },
  { id: 4, text: 'Weekly team retrospective',          done: false, priority: 'medium', tag: 'Meetings', list: 'Personal',   dueToday: false },
  { id: 5, text: 'Update roadmap Q3 milestones',       done: false, priority: 'high',   tag: 'Planning', list: 'Personal',   dueToday: false },
  { id: 6, text: 'Ship landing page copy updates',     done: false, priority: 'low',    tag: 'Design',   list: 'Personal',   dueToday: false },
  { id: 7, text: 'Research competitor pricing',        done: false, priority: 'medium', tag: 'Planning', list: 'University', dueToday: false },
  { id: 8, text: 'Ship landing page copy updates',     done: false, priority: 'low',    tag: 'Marketing',list: 'Personal',   dueToday: false },
]

const TAG_COLORS = {
  Design:    { bg: '#3B82F618', color: '#3B82F6', border: '#3B82F640' },
  Dev:       { bg: '#6366F118', color: '#6366F1', border: '#6366F140' },
  Meetings:  { bg: '#F59E0B18', color: '#F59E0B', border: '#F59E0B40' },
  Planning:  { bg: '#10B98118', color: '#10B981', border: '#10B98140' },
  Research:  { bg: '#F43F5E18', color: '#F43F5E', border: '#F43F5E40' },
  Marketing: { bg: '#8B5CF618', color: '#8B5CF6', border: '#8B5CF640' },
  Admin:     { bg: '#a1a1aa18', color: '#a1a1aa', border: '#a1a1aa40' },
  General:   { bg: '#a1a1aa18', color: '#a1a1aa', border: '#a1a1aa40' },
}

const PRIORITY_BAR = {
  high:   '#F43F5E',
  medium: '#F59E0B',
  low:    '#3f3f46',
}

const LISTS = ['University', 'Personal']

/* ─── Smart Views ───────────────────────────────────────────── */
const SMART_VIEWS = [
  {
    key: 'all',
    label: 'All',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    filter: () => true,
  },
  {
    key: 'today',
    label: 'Today',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    filter: (t) => t.dueToday,
  },
  {
    key: 'next7',
    label: 'Next 7 days',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
    filter: () => true,
  },
]

/* ─── Component ─────────────────────────────────────────────── */
export default function Tasks() {
  const [tasks, setTasks]           = useState(INITIAL_TASKS)
  const [smartView, setSmartView]   = useState('all')
  const [activeList, setActiveList] = useState(null)       // null = all lists
  const [activeTag, setActiveTag]   = useState(null)       // null = all tags
  const [statusFilter, setStatus]   = useState('all')      // all | active | done
  const [adding, setAdding]         = useState(false)
  const [newTask, setNewTask]       = useState('')

  /* ── Derived counts ── */
  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = Math.round((done / total) * 100)

  /* ── Unique tags from data ── */
  const allTags = [...new Set(tasks.map(t => t.tag))]

  /* ── Filter pipeline ── */
  const svFilter  = SMART_VIEWS.find(v => v.key === smartView)?.filter ?? (() => true)
  const displayed = tasks
    .filter(svFilter)
    .filter(t => !activeList || t.list === activeList)
    .filter(t => !activeTag  || t.tag  === activeTag)
    .filter(t => statusFilter === 'all'    ? true
               : statusFilter === 'done'   ? t.done
               : !t.done)

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

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="page tasks-page">

      {/* ── Header ── */}
      <div className="tasks-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-subtitle">{done} of {total} completed</div>
        </div>
        <button
          id="tasks-new-task-btn"
          className="btn btn-primary"
          onClick={() => setAdding(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Task
        </button>
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
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                  </svg>
                </span>
                {list}
              </button>
            ))}
            <button className="tasks-pill-add" title="New list">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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
                  <span style={{
                    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                    background: tc.color, flexShrink: 0,
                  }} />
                  {tag}
                </button>
              )
            })}
            <button className="tasks-pill-add" title="New tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Status tabs ── */}
      <div className="tasks-status-tabs">
        {['all', 'active', 'done'].map(f => (
          <button
            key={f}
            id={`tasks-status-${f}`}
            onClick={() => setStatus(f)}
            className={`tasks-status-tab ${statusFilter === f ? 'tasks-status-tab--active' : ''}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
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

      {/* ── Task list ── */}
      <div className="tasks-list">
        {displayed.length === 0 && (
          <div className="tasks-empty">No tasks match this filter</div>
        )}
        {displayed.map(task => {
          const tc = TAG_COLORS[task.tag] || TAG_COLORS.General
          return (
            <div
              key={task.id}
              id={`task-item-${task.id}`}
              className={`task-row ${task.done ? 'task-row--done' : ''}`}
              onClick={() => toggle(task.id)}
            >
              {/* Priority bar */}
              <div
                className="task-priority-bar"
                style={{ background: PRIORITY_BAR[task.priority] }}
              />

              {/* Checkbox */}
              <div
                className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
                onClick={e => { e.stopPropagation(); toggle(task.id) }}
              >
                {task.done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                )}
              </div>

              {/* Text */}
              <span className="task-text">{task.text}</span>

              {/* Tag */}
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

      {/* ── FAB ── */}
      <button className="fab" onClick={() => setAdding(true)} aria-label="Add task">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
