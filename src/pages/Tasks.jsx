import { useState } from 'react'
import StatCard from '../components/ui/StatCard'

const INITIAL_TASKS = [
  { id: 1, text: 'Finalize design system tokens', done: false, priority: 'high', tag: 'Design' },
  { id: 2, text: 'Write unit tests for auth module', done: false, priority: 'medium', tag: 'Dev' },
  { id: 3, text: 'Review pull requests', done: true, priority: 'low', tag: 'Dev' },
  { id: 4, text: 'Weekly team retrospective', done: false, priority: 'medium', tag: 'Meetings' },
  { id: 5, text: 'Update roadmap Q3 milestones', done: false, priority: 'high', tag: 'Planning' },
  { id: 6, text: 'Respond to client emails', done: true, priority: 'low', tag: 'Admin' },
  { id: 7, text: 'Research competitor pricing', done: false, priority: 'medium', tag: 'Research' },
  { id: 8, text: 'Ship landing page copy updates', done: false, priority: 'low', tag: 'Marketing' },
]

const PRIORITY_COLORS = {
  high: '#F43F5E',
  medium: '#F59E0B',
  low: '#52525b',
}

export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [newTask, setNewTask] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')

  const toggle = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const addTask = () => {
    if (!newTask.trim()) { setAdding(false); return }
    setTasks(prev => [...prev, { id: Date.now(), text: newTask, done: false, priority: 'medium', tag: 'General' }])
    setNewTask('')
    setAdding(false)
  }

  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const progress = Math.round((done / total) * 100)

  const filtered = filter === 'all' ? tasks : filter === 'done' ? tasks.filter(t => t.done) : tasks.filter(t => !t.done)

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <div className="page-subtitle">{done} of {total} completed</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)} style={{ gap: 6 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Task
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Total" value={total} />
        <StatCard label="Done" value={done} accent />
        <StatCard label="Progress" value={`${progress}%`} accent />
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['all', 'active', 'done'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="btn"
            style={{
              padding: '6px 16px',
              fontSize: 13,
              background: filter === f ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
              color: filter === f ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: `1px solid ${filter === f ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Add task input */}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(task => (
          <div
            key={task.id}
            onClick={() => toggle(task.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 12,
              cursor: 'pointer',
              background: task.done ? 'transparent' : 'var(--color-surface-2)',
              border: `1px solid ${task.done ? 'transparent' : 'var(--color-border)'}`,
              opacity: task.done ? 0.5 : 1,
              transition: 'all 200ms ease',
            }}
          >
            {/* Priority indicator */}
            <div style={{
              width: 3,
              height: 28,
              borderRadius: 2,
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
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                textDecoration: task.done ? 'line-through' : 'none',
              }}>
                {task.text}
              </div>
            </div>

            {/* Tag */}
            <span className="tag">{task.tag}</span>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setAdding(true)} aria-label="Add task">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
