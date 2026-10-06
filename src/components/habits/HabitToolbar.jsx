/**
 * HabitToolbar.jsx — Migrated to Design System
 *
 * Changes from original:
 * - "New Habit" button → <Button variant="primary"> (pil-btn namespace)
 * - "Add area" confirm/cancel → <Button> primitives
 * - "Add area" inline input → <Input> primitive
 * - View trigger button retains its custom `.habit-view-trigger-btn` class
 *   (it has very specific sizing/popover layout CSS not worth overriding)
 * - Removed ALL legacy `.btn`, `.btn-primary`, `.btn-ghost` classes
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import Input  from '../ui/Input'

const AREA_META = {
  All:      { icon: '✨', color: 'var(--color-primary)' },
  Morning:  { icon: '🌅', color: '#F59E0B' },
  Afternoon:{ icon: '☀️', color: '#3B82F6' },
  Evening:  { icon: '🌙', color: '#6366F1' },
  Anytime:  { icon: '⚡', color: '#10B981' },
  Archived: { icon: '📦', color: '#9CA3AF' },
}

// Inline SVG atoms — no extra dep
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function HabitToolbar({
  activeArea = 'All',
  onAreaChange,
  allAreas = [],
  onAddArea,
  areaCounts = {},
  onNewHabit,
  onOpenStats,
}) {
  const { t } = useTranslation()
  const [addingArea,   setAddingArea]   = useState(false)
  const [newAreaName,  setNewAreaName]  = useState('')

  const handleCreateArea = () => {
    const trimmed = newAreaName.trim()
    if (trimmed && onAddArea) onAddArea(trimmed)
    setNewAreaName('')
    setAddingArea(false)
  }

  return (
    <div className="habit-toolbar-container">
      <div className="habit-toolbar-primary">

        {/* ── Left: Area Tab Track ── */}
        <div className="habit-top-tabs-track overflow-x-auto flex-nowrap hide-scrollbar" role="tablist">
          {allAreas.map((area) => {
            const isActive = activeArea === area
            const meta     = AREA_META[area] || { icon: '🏷️', color: 'var(--color-primary)' }
            const counts   = areaCounts[area]
            const areaDisplay = area === 'All' ? t('habits.allAreas') : area === 'Archived' ? t('habits.archived') : area

            return (
              <button
                key={area}
                type="button"
                className={`habit-top-tab ${isActive ? 'habit-top-tab--active' : ''}`}
                onClick={() => onAreaChange(area)}
                role="tab"
                aria-selected={isActive}
              >
                <span>{meta.icon}</span>
                {/* Label span: text-shadow simulates bold without width change — see index.css */}
                <span className="habit-tab-label">{areaDisplay}</span>
                {counts && counts.total > 0 && (
                  <span className="habit-tab-badge">{counts.done}/{counts.total}</span>
                )}
              </button>
            )
          })}

          {/* Add custom area — inline form or trigger button */}
          {addingArea ? (
            <div className="habit-add-area-form">
              <Input
                autoFocus
                wrapClassName="habit-add-area-input-wrap"
                placeholder="Area name…"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  handleCreateArea()
                  if (e.key === 'Escape') setAddingArea(false)
                }}
                size="sm"
              />
              <Button size="sm" variant="primary" onClick={handleCreateArea}>{t('common.add')}</Button>
              <Button size="sm" variant="ghost"   onClick={() => setAddingArea(false)}>✕</Button>
            </div>
          ) : (
            <button
              type="button"
              className="habit-add-area-btn"
              title="Add habit area"
              onClick={() => setAddingArea(true)}
              aria-label="Add habit area"
            >
              <PlusIcon />
            </button>
          )}
        </div>

        {/* ── Right: Mobile Stats Button + New Habit Button ── */}
        <div className="habit-toolbar-actions">


          {/* Mobile Stats Button — visible only on mobile (< 1024px) */}
          <button
            type="button"
            className="habit-mobile-stats-btn block lg:hidden"
            onClick={onOpenStats}
            title={t('habits.stats', 'Stats')}
            aria-label={t('habits.stats', 'Stats')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="habit-mobile-stats-btn-text">{t('habits.stats', 'Stats')}</span>
          </button>

          {/* New Habit Button — desktop only; FAB handles mobile */}
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon />}
            onClick={onNewHabit}
            className="habit-add-btn"
          >
            <span className="habit-add-btn-text">{t('habits.newHabit')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
