/**
 * timeUtils.js
 * Standardized time formatting utilities across Pillar (Today, Tasks, Habits, Calendar).
 * Always formats time as only hours and minutes (HH:mm) without seconds.
 */

/**
 * Formats any time representation (string "HH:mm:ss", "HH:mm", ISO datetime, or Date)
 * into strictly "HH:mm" (hours and minutes only).
 *
 * Examples:
 *  - "14:30:00" -> "14:30"
 *  - "14:30"    -> "14:30"
 *  - "8:5"      -> "08:05"
 *  - "08:00:00" -> "08:00"
 *  - null/undefined/"" -> ""
 *
 * @param {string|Date|null|undefined} time
 * @returns {string} Formatted "HH:mm" or empty string
 */
export function formatTimeHHmm(time) {
  if (!time) return ''

  if (time instanceof Date) {
    const h = String(time.getHours()).padStart(2, '0')
    const m = String(time.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const str = String(time).trim()
  if (!str) return ''

  // 1. Matches "HH:mm", "H:mm", "HH:mm:ss"
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/)
  if (timeMatch) {
    const h = String(timeMatch[1]).padStart(2, '0')
    const m = timeMatch[2]
    return `${h}:${m}`
  }

  // 2. If it is an ISO datetime string (e.g. "2026-10-04T14:30:00.000Z")
  if (str.includes('T')) {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      return `${h}:${m}`
    }
  }

  // 3. Fallback: slice to 5 characters
  return str.slice(0, 5)
}

/**
 * Formats time for input[type="time"] value attribute (strictly HH:mm)
 * to avoid browser showing seconds.
 *
 * @param {string|null|undefined} time
 * @returns {string}
 */
export function toTimeInputValue(time) {
  return formatTimeHHmm(time)
}

export default {
  formatTimeHHmm,
  toTimeInputValue,
}
