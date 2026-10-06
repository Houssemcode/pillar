import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { dateKey, isHabitDueOn } from '../../utils/habitDateUtils'

function sameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function HabitDateStrip({
  week = [],
  selectedDate = new Date(),
  today = new Date(),
  habits = [],
  onSelect,
  onPrevWeek,
  onNextWeek,
}) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'

  const isCurrentWeek = useMemo(() => week.some((d) => sameDay(d, today)), [week, today])
  const isToday = sameDay(selectedDate, today)
  const dk = useMemo(() => dateKey(selectedDate), [selectedDate])

  const activeHabits = useMemo(() => habits.filter((h) => !h.is_archived), [habits])

  const habitsDueToday = useMemo(
    () => activeHabits.filter((h) => isHabitDueOn(h, selectedDate) || h.completedDates?.has(dk)),
    [activeHabits, selectedDate, dk]
  )
  const totalActive = habitsDueToday.length

  const completedCountToday = useMemo(
    () => habitsDueToday.filter((h) => h.completedDates?.has(dk)).length,
    [habitsDueToday, dk]
  )

  const pctToday = totalActive > 0 ? Math.round((completedCountToday / totalActive) * 100) : 0
  const allDoneToday = totalActive > 0 && completedCountToday === totalActive

  const topStreak = useMemo(() => {
    if (activeHabits.length === 0) return 0
    return Math.max(...activeHabits.map((h) => h.streak || 0), 0)
  }, [activeHabits])

  const dateLabel = isToday
    ? t('common.today')
    : selectedDate.toLocaleDateString(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })

  const fullDateLabel = selectedDate.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="habit-date-strip">
      {/* Left: Day Title & Progress Badge */}
      <div className="habit-date-strip-info">
        <span className="habit-date-strip-title">{dateLabel}</span>

        {allDoneToday ? (
          <span
            className="habit-strip-progress-badge"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              fontWeight: 700,
            }}
          >
            {t('habits.perfectDay')}
          </span>
        ) : totalActive > 0 ? (
          <span
            className="habit-strip-progress-badge"
            style={{
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary-muted)',
            }}
          >
            {completedCountToday}/{totalActive} {t('habits.done')}
          </span>
        ) : null}
      </div>

      {/* Right: 7-Day Interactive Strip */}
      <div className="habit-date-strip-week-wrap">
        {/* Prev Week Button */}
        <button
          type="button"
          className="habit-date-strip-nav"
          onClick={onPrevWeek}
          title="Previous week"
          aria-label="Previous week"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        {/* 7 Days Grid */}
        <div className="habit-date-strip-days overflow-x-auto hide-scrollbar flex-nowrap">
          {week.map((day) => {
            const isSelected = sameDay(day, selectedDate)
            const isDayToday = sameDay(day, today)
            const isFuture = day > today
            const dayKey = dateKey(day)
            const dayDueHabits = activeHabits.filter(
              (h) => isHabitDueOn(h, day) || h.completedDates?.has(dayKey)
            )
            const dayDone = dayDueHabits.filter((h) => h.completedDates?.has(dayKey)).length
            const allDone = dayDueHabits.length > 0 && dayDone === dayDueHabits.length

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => !isFuture && onSelect(day)}
                disabled={isFuture}
                className={`habit-day-pill ${isSelected ? 'habit-day-pill--active' : ''} ${
                  isDayToday ? 'habit-day-pill--today' : ''
                }`}
                style={{ opacity: isFuture ? 0.35 : 1 }}
                title={
                  isFuture
                    ? 'Future date'
                    : `${day.toLocaleDateString(locale, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}: ${dayDone}/${dayDueHabits.length} habits completed`
                }
                aria-label={`${new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)} ${day.getDate()}`}
              >
                <span className="habit-day-pill-name">{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}</span>
                <span className="habit-day-pill-num">{day.getDate()}</span>

                {/* Completion dot indicator */}
                <span
                  className="habit-day-completion-dot"
                  style={{
                    visibility: isFuture ? 'hidden' : 'visible',
                    background:
                      dayDueHabits.length === 0 || dayDone === 0
                        ? 'transparent'
                        : allDone
                        ? '#10B981'
                        : 'var(--color-primary)',
                    border:
                      dayDueHabits.length === 0 || dayDone === 0
                        ? '1px solid var(--color-border)'
                        : 'none',
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* Next Week Button */}
        <button
          type="button"
          className="habit-date-strip-nav"
          onClick={onNextWeek}
          disabled={isCurrentWeek}
          title="Next week"
          aria-label="Next week"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>

        {/* "Today" Shortcut Button */}
        {!isCurrentWeek && (
          <button
            type="button"
            className="habit-strip-today-btn"
            onClick={() => onSelect(today)}
            title="Jump to today"
          >
            {t('common.today')}
          </button>
        )}
      </div>
    </div>
  )
}
