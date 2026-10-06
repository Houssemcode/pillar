/**
 * Shared habit date utilities.
 * Single source of truth — import from here in ALL habit components.
 */

/**
 * Returns an ISO-formatted "YYYY-MM-DD" key for a Date object.
 * Zero-padded month and day ensure correct matching against API-returned
 * ISO date strings (e.g. "2026-09-04") across all habit views.
 */
export function isoDateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const dateKey = isoDateKey

/**
 * Returns true if a habit is scheduled on the given date.
 *
 * Rules:
 *  - "daily"         -> always due
 *  - "weekdays"      -> Mon-Fri  (getDay() 1-5)
 *  - "weekends"      -> Sat-Sun  (getDay() 0, 6)
 *  - "specific_days" -> frequency_days is an array of weekday numbers [0=Sun .. 6=Sat]
 *  - anything else   -> treat as daily (safe fallback)
 *
 * @param {Object} habit  - habit object with .frequency and .frequency_days
 * @param {Date}   date   - the date to check
 * @returns {boolean}
 */
export const WEEKDAYS = [
  { day: 0, label: 'Sun', short: 'S' },
  { day: 1, label: 'Mon', short: 'M' },
  { day: 2, label: 'Tue', short: 'T' },
  { day: 3, label: 'Wed', short: 'W' },
  { day: 4, label: 'Thu', short: 'T' },
  { day: 5, label: 'Fri', short: 'F' },
  { day: 6, label: 'Sat', short: 'S' },
]

export function isHabitDueOn(habit, date) {
  if (!habit || !date) return true
  const dow = date.getDay() // 0=Sun, 1=Mon, .., 6=Sat
  switch (habit.frequency) {
    case 'daily':
      return true
    case 'weekdays':
      return dow >= 1 && dow <= 5
    case 'weekends':
      return dow === 0 || dow === 6
    case 'specific_days': {
      const days = Array.isArray(habit.frequency_days) ? habit.frequency_days.map(Number) : []
      if (days.length === 0) return true
      return days.includes(dow)
    }
    default:
      return true
  }
}

/**
 * Computes the current active streak for a habit (consecutive scheduled days
 * ending on `through` where completedDates contains the isoDateKey).
 *
 * Off-days (per frequency_days) do not break the streak.
 *
 * @param {Object} habit         - habit with .completedDates (Set) + frequency info
 * @param {Date}   [through]     - last date to count from (defaults to today)
 * @param {number} [maxLookback] - max days to look back (default 730 = 2 yrs)
 * @returns {number}
 */
export function calculateStreak(habit, through, maxLookback = 730) {
  const base = through instanceof Date ? new Date(through) : new Date()
  base.setHours(0, 0, 0, 0)

  let streak = 0
  const cursor = new Date(base)

  for (let i = 0; i < maxLookback; i++) {
    const isDue = isHabitDueOn(habit, cursor)
    const key = isoDateKey(cursor)
    const isDone = habit.completedDates?.has(key)

    if (isDue) {
      if (isDone) {
        streak++
      } else if (i === 0) {
        // Today not yet completed - don't penalise (streak may still be alive from yesterday)
      } else {
        // A scheduled day was missed - streak is broken
        break
      }
    }
    // Off-days: continue counting backwards without breaking or incrementing

    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

/**
 * Computes the all-time longest streak for a habit.
 *
 * @param {Object} habit         - habit with .completedDates (Set) + frequency info
 * @param {number} [maxLookback] - max days to scan (default 730 = 2 yrs)
 * @returns {number}
 */
export function calculateLongestStreak(habit, maxLookback = 730) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let longest = 0
  let current = 0
  const cursor = new Date(today)

  for (let i = 0; i < maxLookback; i++) {
    const isDue = isHabitDueOn(habit, cursor)
    const key = isoDateKey(cursor)
    const isDone = habit.completedDates?.has(key)

    if (isDue) {
      if (isDone) {
        current++
        if (current > longest) longest = current
      } else {
        current = 0
      }
    }
    // Off-days don't reset the streak counter

    cursor.setDate(cursor.getDate() - 1)
  }

  return longest
}
