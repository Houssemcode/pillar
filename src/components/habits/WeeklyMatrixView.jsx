import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isHabitDueOn } from '../../utils/habitDateUtils'

function sameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function WeeklyMatrixView({
  habits,
  week,
  today,
  onToggleDate,
  onOpen,
}) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'

  // Compute daily completion rates across the 7 days of the week based on scheduled habits
  const dailyStats = useMemo(() => {
    return week.map((day) => {
      const dk = dateKey(day)
      const isFuture = day > today
      const dueHabits = habits.filter((h) => isHabitDueOn(h, day) || h.completedDates?.has(dk))
      const total = dueHabits.length
      const done = dueHabits.filter((h) => h.completedDates?.has(dk)).length
      const pct = total > 0 ? Math.round((done / total) * 100) : 0
      return { day, total, done, pct, isFuture }
    })
  }, [habits, week, today])

  return (
    <div className="weekly-matrix-container">
      <div className="weekly-matrix-scroll">
        <table className="weekly-matrix-table">
          <thead>
            <tr>
              <th className="weekly-matrix-th-habit">
                <span>{t('habits.title')}</span>
              </th>
              {week.map((day) => {
                const isToday = sameDay(day, today)
                const isFuture = day > today
                return (
                  <th
                    key={day.toISOString()}
                    className={`weekly-matrix-th-day ${isToday ? 'weekly-matrix-th-day--today' : ''} ${isFuture ? 'weekly-matrix-th-day--future' : ''}`}
                  >
                    <span className="wm-day-name">{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}</span>
                    <span className="wm-day-num">{day.getDate()}</span>
                    {isToday && <span className="wm-today-dot" />}
                  </th>
                )
              })}
              <th className="weekly-matrix-th-streak">
                <span>{t('habits.streak')}</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {habits.length === 0 ? (
              <tr>
                <td colSpan={9} className="weekly-matrix-empty">
                  {t('habits.noHabits')}
                </td>
              </tr>
            ) : (
              habits.map((habit) => {
                const habitColor = habit.color || '#F59E0B'
                const isGoalHabit = habit.goal_amount && habit.goal_amount > 1

                return (
                  <tr key={habit.id} className="weekly-matrix-row">
                    {/* Sticky habit info cell */}
                    <td
                      className="weekly-matrix-td-habit"
                      onClick={() => onOpen(habit)}
                    >
                      <div className="wm-habit-cell-content">
                        <span
                          className="wm-habit-dot"
                          style={{ background: habitColor }}
                        />
                        <span className="wm-habit-emoji">{habit.emoji || '🎯'}</span>
                        <div className="wm-habit-text">
                          <span className="wm-habit-name">{habit.name}</span>
                          {isGoalHabit && (
                            <span className="wm-habit-goal">
                              {t('habits.target', { amount: habit.goal_amount, unit: habit.goal_unit || t('habits.timesUnit') })}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 7 Days checkboxes */}
                    {week.map((day) => {
                      const dk = dateKey(day)
                      const isToday = sameDay(day, today)
                      const isFuture = day > today
                      const isDone = habit.completedDates?.has(dk)
                      const isDue = isHabitDueOn(habit, day)
                      const amount = habit.completionsMap?.get(dk) || 0

                      return (
                        <td
                          key={day.toISOString()}
                          className={`weekly-matrix-td-day ${isToday ? 'weekly-matrix-td-day--today' : ''}`}
                        >
                          <button
                            className={`wm-check-cell ${isDone ? 'wm-check-cell--done' : ''} ${isFuture ? 'wm-check-cell--future' : ''} ${!isDue && !isDone ? 'wm-check-cell--off-day' : ''}`}
                            disabled={isFuture}
                            onClick={() => onToggleDate(habit.id, day)}
                            style={{
                              borderColor: isDone ? habitColor : !isDue ? 'transparent' : 'var(--color-border)',
                              background: isDone ? habitColor : !isDue ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                            }}
                            title={
                              isFuture
                                ? 'Future date'
                                : !isDue && !isDone
                                ? `${habit.name} is not scheduled on ${DAYS_SHORT[day.getDay()]}`
                                : `${habit.name} on ${DAYS_SHORT[day.getDay()]} ${day.getDate()} — ${isDone ? 'Completed' : 'Click to complete'}`
                            }
                            aria-label={`Toggle ${habit.name} for ${DAYS_SHORT[day.getDay()]}`}
                          >
                            {isDone ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round">
                                <polyline points="20,6 9,17 4,12" />
                              </svg>
                            ) : isGoalHabit && amount > 0 ? (
                              <span className="wm-partial-count">{amount}</span>
                            ) : !isDue ? (
                              <span className="wm-off-day-dot">·</span>
                            ) : null}
                          </button>
                        </td>
                      )
                    })}

                    {/* Streak badge */}
                    <td className="weekly-matrix-td-streak">
                      <span className="wm-streak-pill">
                        {habit.streak > 0 ? `🔥 ${habit.streak}d` : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>

          {/* Weekly Summary Footer */}
          {habits.length > 0 && (
            <tfoot>
              <tr className="weekly-matrix-summary-row">
                <td className="weekly-matrix-td-habit wm-summary-label">
                  <span>Daily Completion</span>
                </td>
                {dailyStats.map(({ day, pct, done, total, isFuture }) => (
                  <td key={day.toISOString()} className="weekly-matrix-td-day wm-summary-cell">
                    {isFuture ? (
                      <span className="wm-summary-dash">—</span>
                    ) : (
                      <div className="wm-summary-stat">
                        <span className="wm-summary-pct" style={{ color: pct === 100 ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {pct}%
                        </span>
                        <div className="wm-summary-bar">
                          <div
                            className="wm-summary-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct === 100 ? 'var(--color-primary)' : 'var(--color-primary-muted)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                ))}
                <td className="weekly-matrix-td-streak" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
