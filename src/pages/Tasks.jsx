import { useState } from 'react'

/* ─── Data ─────────────────────────────────────────── */
const LISTS = [
  { id: 'university', label: 'University', icon: '📁' },
  { id: 'personal',   label: 'Personal',   icon: '📋' },
]

const ALL_TAGS = ['Design', 'Dev', 'Meetings', 'Planning', 'Marketing', 'Research', 'Admin']

const TAG_COLORS = {
  Design:   '#3B82F6',
  Dev:      '#6366F1',
  Meetings: '#F59E0B',
  Planning: '#10B981',
  Marketing:'#F43F5E',
  Research: '#8B5CF6',
  Admin:    '#a1a1aa',
  General:  '#52525b',
}

const PRIORITY_COLORS = {
  high:   '#F43F5E',
  medium: '#F59E0B',
  low:    '#52525b',
}

const INITIAL_TASKS = [
  { id: 1, text: 'Finalize design system tokens',    done: false, priority: 'high',   tag: 'Design',    list: 'university', dueToday: true },
  { id: 2, text: 'Write unit tests for auth module', done: false, priority: 'medium', tag: 'Dev',       list: 'university', dueToday: true },
  { id: 3, text: 'Review pull requests',             done: true,  priority: 'low',    tag: 'Dev',       list: 'personal',   dueToday: true },
  { id: 4, text: 'Weekly team retrospective',        done: false, priority: 'medium', tag: 'Meetings',  list: 'personal',   dueToday: false },
  { id: 5, text: 'Update roadmap Q3 milestones',     done: false, priority: 'high',   tag: 'Planning',  list: 'university', dueToday: false },
  { id: 6, text: 'Respond to client emails',         done: true,  priority: 'low',    tag: 'Admin',     list: 'personal',   dueToday: true },
  { id: 7, text: 'Research competitor pricing',      done: false, priority: 'medium', tag: 'Research',  list: 'personal',   dueToday: false },
  { id: 8, text: 'Ship landing page copy updates',   done: false, priority: 'low',    tag: 'Marketing', list: 'university', dueToday: false },
]

/* ─── Sidebar item ──────────────────────────────────── */
function SidebarItem({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'var(--color-primary-subtle)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        textAlign: 'left',
        transition: 'all 150ms ease',
      }}
    >
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
          background: active ? 'var(--color-primary-muted)' : 'var(--color-surface-3)',
          borderRadius: 100, padding: '1px 7px',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}

/* ─── Tag dot ───────────────────────────────────────── */
function TagDot({ tag }) {
  const color = TAG_COLORS[tag] || '#52525b'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 13, color: 'var(--color-text-secondary)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {tag}
    </span>
  )
}

/* ─── Main component ────────────────────────────────── */
export default function Tasks() {
  const [tasks, setTasks]       = useState(INITIAL_TASKS)
  const [newTask, setNewTask]   = useState('')
  const [adding, setAdding]     = useState(false)
  const [filter, setFilter]     = useState('all')        // 'all' | 'active' | 'done'
  const [smartFilter, setSmartFilter] = useState('all') // 'all' | 'today' | 'week'
  const [activeList, setActiveList]   = useState(null)   // list id or null
  const [activeTag,  setActiveTag]    = useState(null)   // tag string or null
  const [newListName, setNewListName] = useState('')
  const [addingList, setAddingList]   = useState(false)
  const [lists, setLists]             = useState(LISTS)

  /* derived counts */
  const done  = tasks.filter(t => t.done).length
  const total = tasks.length

  const today     = tasks.filter(t => t.dueToday)
  const thisWeek  = tasks // all items for "next 7 days" demo

  /* smart-filter base set */
  const baseSet = smartFilter === 'today' ? today
                : smartFilter === 'week'  ? thisWeek
                : tasks

  /* list + tag filter */
  const listFiltered = activeList ? baseSet.filter(t => t.list === activeList) : baseSet
  const tagFiltered  = activeTag  ? listFiltered.filter(t => t.tag === activeTag) : listFiltered

  /* status filter */
  const displayed = filter === 'done'   ? tagFiltered.filter(t =>  t.done)
                  : filter === 'active' ? tagFiltered.filter(t => !t.done)
                  : tagFiltered

  const shownDone  = displayed.filter(t => t.done).length
  const shownTotal = displayed.length

  const toggle = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const addTask = () => {
    if (!newTask.trim()) { setAdding(false); return }
    setTasks(prev => [...prev, {
      id: Date.now(), text: newTask, done: false, priority: 'medium',
      tag: activeTag || 'General', list: activeList || 'personal', dueToday: false,
    }])
    setNewTask('')
    setAdding(false)
  }

  const addList = () => {
    if (!newListName.trim()) { setAddingList(false); return }
    setLists(prev => [...prev, { id: newListName.toLowerCase(), label: newListName, icon: '📂' }])
    setNewListName('')
    setAddingList(false)
  }

  /* smart filter selection clears list/tag */
  const pickSmartFilter = (key) => { setSmartFilter(key); setActiveList(null); setActiveTag(null) }
  const pickList = (id) => { setActiveList(id === activeList ? null : id); setActiveTag(null); setSmartFilter('all') }
  const pickTag  = (tag) => { setActiveTag(tag === activeTag ? null : tag); setSmartFilter('all') }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT PANEL ───────────────────────────────── */}
      <aside style={{
        width: 220,
        minWidth: 220,
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflowY: 'auto',
        padding: '20px 12px',
      }}>
        {/* Smart filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
          <SidebarItem
            active={smartFilter === 'all' && !activeList && !activeTag}
            onClick={() => pickSmartFilter('all')}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            }
            label="All"
            count={tasks.length}
          />
          <SidebarItem
            active={smartFilter === 'today'}
            onClick={() => pickSmartFilter('today')}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            }
            label="Today"
            count={today.length}
          />
          <SidebarItem
            active={smartFilter === 'week'}
            onClick={() => pickSmartFilter('week')}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
            }
            label="Next 7 days"
            count={thisWeek.length}
          />
        </div>

        {/* Lists */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              Lists
            </span>
            <button
              onClick={() => setAddingList(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2, borderRadius: 6, display: 'flex', alignItems: 'center' }}
              title="New list"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {lists.map(list => (
              <SidebarItem
                key={list.id}
                active={activeList === list.id}
                onClick={() => pickList(list.id)}
                icon={list.icon}
                label={list.label}
                count={tasks.filter(t => t.list === list.id).length}
              />
            ))}
            {addingList && (
              <input
                autoFocus
                className="input"
                placeholder="List name…"
                value={newListName}
                style={{ padding: '7px 10px', fontSize: 13, marginTop: 4 }}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') setAddingList(false) }}
                onBlur={addList}
              />
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              Tags
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ALL_TAGS.map(tag => {
              const color = TAG_COLORS[tag] || '#52525b'
              const isActive = activeTag === tag
              return (
                <button
                  key={tag}
                  onClick={() => pickTag(tag)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? `${color}15` : 'transparent',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? color : 'var(--color-text-secondary)',
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div className="page" style={{ flex: 1, overflowY: 'auto' }}>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {activeTag ? `#${activeTag}` : activeList ? lists.find(l => l.id === activeList)?.label : 'Tasks'}
            </h1>
            <div className="page-subtitle">{shownDone} of {shownTotal} completed</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setAdding(true)}
            style={{ gap: 8, flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Task
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress-bar" style={{ height: 3 }}>
          <div
            className="progress-fill"
            style={{ width: shownTotal > 0 ? `${Math.round((shownDone / shownTotal) * 100)}%` : '0%' }}
          />
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'done'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 18px',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                borderRadius: 8,
                border: `1px solid ${filter === f ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
                background: filter === f ? 'var(--color-primary-subtle)' : 'transparent',
                color: filter === f ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Add task inline */}
        {adding && (
          <div style={{ display: 'flex', gap: 8 }}>
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

        {/* Task list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displayed.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              color: 'var(--color-text-muted)', fontSize: 14,
            }}>
              No tasks here — you're all clear 🎉
            </div>
          )}
          {displayed.map(task => {
            const tagColor = TAG_COLORS[task.tag] || '#52525b'
            return (
              <div
                key={task.id}
                onClick={() => toggle(task.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 18px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: task.done ? 'transparent' : 'var(--color-surface-2)',
                  border: `1px solid ${task.done ? 'transparent' : 'var(--color-border)'}`,
                  opacity: task.done ? 0.45 : 1,
                  transition: 'all 200ms ease',
                }}
              >
                {/* Priority bar */}
                <div style={{
                  width: 3, height: 26, borderRadius: 2,
                  background: PRIORITY_COLORS[task.priority],
                  flexShrink: 0,
                }} />

                {/* Checkbox */}
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={task.done}
                  onChange={() => toggle(task.id)}
                  onClick={e => e.stopPropagation()}
                />

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {task.text}
                  </div>
                </div>

                {/* Tag pill */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600,
                  color: tagColor,
                  background: `${tagColor}15`,
                  border: `1px solid ${tagColor}30`,
                  borderRadius: 100,
                  padding: '3px 10px',
                  flexShrink: 0,
                }}>
                  {task.tag}
                </span>
              </div>
            )
          })}
        </div>

        {/* FAB */}
        <button className="fab" onClick={() => setAdding(true)} aria-label="Add task">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
