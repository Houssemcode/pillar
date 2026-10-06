const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function sameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function HabitWeekNav({
  week = [],
  selectedDate = new Date(),
  today = new Date(),
  onSelect,
  onPrevWeek,
  onNextWeek,
}) {
  const isCurrentWeek = week.some((d) => sameDay(d, today))

  const rangeLabel = week.length === 7
    ? `${MONTHS[week[0].getMonth()]} ${week[0].getDate()} – ${MONTHS[week[6].getMonth()]} ${week[6].getDate()}, ${week[6].getFullYear()}`
    : ''

  return (
    <div className="habits-week-nav">
      <div className="habits-week-header">
        <button
          type="button"
          className="habits-week-arrow"
          onClick={onPrevWeek}
          title="Previous week"
          aria-label="Previous week"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        <span className="habits-week-label">{rangeLabel}</span>

        <button
          type="button"
          className="habits-week-arrow"
          onClick={onNextWeek}
          disabled={isCurrentWeek}
          style={{ opacity: isCurrentWeek ? 0.3 : 1 }}
          title="Next week"
          aria-label="Next week"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>

        {!isCurrentWeek && (
          <button
            type="button"
            className="habits-week-today-btn"
            onClick={() => onSelect(today)}
          >
            Today
          </button>
        )}
      </div>

      <div className="habits-week-days">
        {week.map((day) => {
          const isSelected = sameDay(day, selectedDate)
          const isToday = sameDay(day, today)
          const isFuture = day > today

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !isFuture && onSelect(day)}
              disabled={isFuture}
              className={`habits-day-btn ${isSelected ? 'habits-day-btn--active' : ''} ${isToday && !isSelected ? 'habits-day-btn--today' : ''}`}
              style={{ opacity: isFuture ? 0.35 : 1 }}
              aria-label={`${DAYS_SHORT[day.getDay()]} ${day.getDate()}`}
            >
              <span className="habits-day-name">{DAYS_SHORT[day.getDay()]}</span>
              <span className="habits-day-num">{day.getDate()}</span>
              {isToday && <span className="habits-day-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
