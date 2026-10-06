import ProgressRing from '../ui/ProgressRing'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

function buildHeatmap(habits, today) {
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    const k = dateKey(d)
    const done = habits.filter((h) => h.completedDates?.has(k)).length
    const pct = habits.length > 0 ? done / habits.length : 0
    return { date: d, done, pct }
  })
}

export default function HabitStatsPanel({
  habits = [],
  selectedDate = new Date(),
  today = new Date(),
  onSelectDate,
}) {
  const dk = dateKey(selectedDate)
  const total = habits.length
  const doneToday = habits.filter((h) => h.completedDates?.has(dk)).length
  const pct = total > 0 ? Math.round((doneToday / total) * 100) : 0
  const isPerfectDay = total > 0 && doneToday === total

  const bestStreak = Math.max(...habits.map((h) => h.streak || 0), 0)

  // 30-day overall consistency rate
  const last30Keys = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    return dateKey(d)
  })
  const totalPossible = total * 30
  const totalCompleted30 = last30Keys.reduce((acc, k) => {
    return acc + habits.filter((h) => h.completedDates?.has(k)).length
  }, 0)
  const consistencyRate30 = totalPossible > 0
    ? Math.round((totalCompleted30 / totalPossible) * 100)
    : 0

  const heatmap = buildHeatmap(habits, today)
  const topStreaks = [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 5)

  return (
    <div className="habits-stats-panel">
      {/* ── Progress Card ── */}
      <div className="habits-ring-card bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <div className="habits-card-title text-gray-500 dark:text-gray-400">
          {sameDay(selectedDate, today)
            ? "Today's Progress"
            : `${DAYS_FULL[selectedDate.getDay()]} · ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
        </div>

        <div className="habits-ring-wrapper">
          <ProgressRing radius={46} strokeWidth={7} progress={pct} size={98}>
            <div className="habits-ring-inner">
              <div className="habits-ring-pct">{pct}%</div>
              {!isPerfectDay && (
                <div className="habits-ring-fraction text-gray-500 dark:text-gray-400">
                  {doneToday}/{total}
                </div>
              )}
            </div>
          </ProgressRing>
        </div>

        {isPerfectDay && (
          <div className="habits-perfect-day-banner">
            <span className="habits-perfect-icon">🌟</span>
            <span>All habits complete today! Outstanding!</span>
          </div>
        )}

        <div className="habits-mini-stats-grid">
          <div className="habits-mini-stat bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="habits-mini-stat-val text-gray-900 dark:text-white">{doneToday}</div>
            <div className="habits-mini-stat-lbl text-gray-500 dark:text-gray-400">Done</div>
          </div>
          <div className="habits-mini-stat bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="habits-mini-stat-val text-gray-900 dark:text-white">{Math.max(0, total - doneToday)}</div>
            <div className="habits-mini-stat-lbl text-gray-500 dark:text-gray-400">Remaining</div>
          </div>
          <div className="habits-mini-stat bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="habits-mini-stat-val text-gray-900 dark:text-white">{bestStreak}d</div>
            <div className="habits-mini-stat-lbl text-gray-500 dark:text-gray-400">Best Streak</div>
          </div>
          <div className="habits-mini-stat bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="habits-mini-stat-val text-gray-900 dark:text-white">{consistencyRate30}%</div>
            <div className="habits-mini-stat-lbl text-gray-500 dark:text-gray-400">30d Consistency</div>
          </div>
        </div>
      </div>

      {/* ── Streaks Leaderboard ── */}
      <div className="habits-streaks-card bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-none">
        <div className="habits-card-title text-gray-500 dark:text-gray-400">Streaks Leaderboard</div>

        <div className="habits-streaks-list">
          {topStreaks.length === 0 ? (
            <div className="habits-stats-empty text-gray-500 dark:text-gray-400">No active streaks yet.</div>
          ) : (
            topStreaks.map((h) => {
              const maxS = Math.max(...habits.map((x) => x.streak || 0), 1)
              const barW = Math.max(8, Math.round(((h.streak || 0) / maxS) * 100))
              const habitColor = h.color || '#F59E0B'

              return (
                <div key={h.id} className="habits-streak-item">
                  <span className="habits-streak-emoji">{h.emoji || '🎯'}</span>
                  <div className="habits-streak-info">
                    <div className="habits-streak-name-row">
                      <span className="habits-streak-name text-gray-900 dark:text-white">{h.name}</span>
                      <span className="habits-streak-flame-val text-gray-500 dark:text-gray-400">
                        {h.streak > 0 ? `🔥 ${h.streak}d` : '0d'}
                      </span>
                    </div>
                    <div className="habits-streak-track bg-gray-200 dark:bg-zinc-800">
                      <div
                        className="habits-streak-bar"
                        style={{
                          width: `${barW}%`,
                          background: habitColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
