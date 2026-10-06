import { useState } from 'react'

export default function BatchActionBar({ selectedIds, tasks, onClose, onBatchComplete, onBatchTrash, onBatchPriority, onBatchReschedule, onBatchMove, userLists = [] }) {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)

  const count = selectedIds.length
  const allDone = tasks.filter(t => selectedIds.includes(t.id)).every(t => t.done)

  function getTodayISO() { return new Date().toISOString().split('T')[0] }
  function getTomorrowISO() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
  function getNextWeekISO() { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] }

  return (
    <div className="bab-root" role="toolbar" aria-label="Batch actions">
      {/* Selection count badge */}
      <span className="bab-count">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9,11 12,14 22,4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <span className="bab-count-num">{count}</span>
        <span className="bab-count-label"> selected</span>
      </span>

      <div className="bab-divider" />

      {/* Mark done / active */}
      <button className="bab-btn bab-btn--success" onClick={() => onBatchComplete(!allDone)} title={allDone ? 'Mark active' : 'Mark done'}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
        <span className="bab-btn-label">{allDone ? 'Mark active' : 'Mark done'}</span>
      </button>

      {/* Reschedule */}
      <div className="bab-menu-wrap" style={{ position: 'relative' }}>
        <button className="bab-btn" onClick={() => { setShowDateMenu(s => !s); setShowPriorityMenu(false); setShowListMenu(false) }} title="Reschedule">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="bab-btn-label">Reschedule</span>
        </button>
        {showDateMenu && (
          <div className="bab-dropdown">
            {[
              { label: '📅 Today', val: getTodayISO() },
              { label: '🌅 Tomorrow', val: getTomorrowISO() },
              { label: '🗓️ Next week', val: getNextWeekISO() },
            ].map(({ label, val }) => (
              <button key={val} className="bab-dd-item" onClick={() => { onBatchReschedule(val); setShowDateMenu(false) }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority */}
      <div style={{ position: 'relative' }}>
        <button className="bab-btn" onClick={() => { setShowPriorityMenu(s => !s); setShowDateMenu(false); setShowListMenu(false) }} title="Set priority">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          <span className="bab-btn-label">Priority</span>
        </button>
        {showPriorityMenu && (
          <div className="bab-dropdown">
            {[
              { value: 'high',   label: '🔴 High',   color: '#F43F5E' },
              { value: 'medium', label: '🟡 Medium',  color: '#F59E0B' },
              { value: 'low',    label: '🔵 Low',     color: '#3B82F6' },
            ].map(p => (
              <button key={p.value} className="bab-dd-item" style={{ color: p.color }} onClick={() => { onBatchPriority(p.value); setShowPriorityMenu(false) }}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Move to list */}
      {userLists.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button className="bab-btn" onClick={() => { setShowListMenu(s => !s); setShowPriorityMenu(false); setShowDateMenu(false) }} title="Move to list">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            <span className="bab-btn-label">Move</span>
          </button>
          {showListMenu && (
            <div className="bab-dropdown">
              {userLists.map(l => {
                const lName = typeof l === 'string' ? l : l.name
                return (
                  <button key={lName} className="bab-dd-item" onClick={() => { onBatchMove(lName); setShowListMenu(false) }}>
                    📁 {lName}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Trash */}
      <button className="bab-btn bab-btn--danger" onClick={onBatchTrash} title="Move to trash">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
        <span className="bab-btn-label">Trash</span>
      </button>

      <div className="bab-divider" />

      {/* Deselect */}
      <button className="bab-btn bab-btn--muted" onClick={onClose} title="Deselect all">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
