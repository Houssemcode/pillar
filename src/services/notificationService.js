/**
 * notificationService.js
 *
 * Browser-native notification manager.
 * Stores pending notifications in localStorage so they survive page refreshes.
 * Uses setTimeout for near-future one-shot alarms and a minute-level heartbeat
 * for recurring (daily) habit reminders.
 *
 * Usage:
 *   import notificationService from '../services/notificationService'
 *   notificationService.requestPermission()
 *   notificationService.scheduleNotification('evt-42', 'Team Meeting', 'Starts in 15 min', fireAt)
 *   notificationService.scheduleRecurring('habit-7', 'Read', 'Time to read!', '07:30', [0,1,2,3,4,5,6])
 *   notificationService.cancelNotification('evt-42')
 *   notificationService.rescheduleAll()
 */

const STORAGE_KEY = 'pillar_notifications'

// ── helpers ──────────────────────────────────────────────────────────────────

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function isGranted() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

function show(title, body, tag, icon = '/favicon.ico') {
  if (!isGranted()) return
  try {
    const n = new Notification(title, { body, tag, icon, silent: false })
    n.onclick = () => { window.focus(); n.close() }
  } catch (e) {
    console.warn('[notifications] Failed to show notification:', e)
  }
}

// ── in-memory timer handles ───────────────────────────────────────────────────
const _timers = {} // id → setTimeout handle

// ── public API ────────────────────────────────────────────────────────────────

const notificationService = {

  /**
   * Request browser notification permission.
   * Returns the resulting permission string.
   */
  async requestPermission() {
    if (typeof Notification === 'undefined') return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    const result = await Notification.requestPermission()
    return result
  },

  /** Current permission state */
  get permission() {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  },

  /** Get permission status method */
  getPermissionStatus() {
    return this.permission
  },

  /**
   * Schedule a one-shot notification.
   * @param {string} id       Unique identifier (e.g. "event-42", "task-7")
   * @param {string} title    Notification title
   * @param {string} body     Notification body text
   * @param {Date}   fireAt   When to show the notification
   * @param {boolean} enabled Whether this notification is active
   */
  scheduleNotification(id, title, body, fireAt, enabled = true) {
    // Persist to storage
    const items = load().filter(i => i.id !== id)
    items.push({ id, title, body, fireAt: fireAt.toISOString(), type: 'oneshot', enabled })
    save(items)

    // Clear any existing timer
    if (_timers[id]) { clearTimeout(_timers[id]); delete _timers[id] }

    if (!enabled) return

    const delay = fireAt.getTime() - Date.now()
    if (delay <= 0) return // already passed

    _timers[id] = setTimeout(() => {
      show(title, body, id)
      // Remove from storage once fired
      save(load().filter(i => i.id !== id))
      delete _timers[id]
    }, delay)
  },

  /**
   * Schedule a recurring daily notification (e.g., habit reminders).
   * @param {string}   id       Unique identifier
   * @param {string}   title
   * @param {string}   body
   * @param {string}   timeStr  "HH:MM" — time of day to fire
   * @param {number[]} days     0=Sun … 6=Sat; empty/null = every day
   * @param {boolean}  enabled
   */
  scheduleRecurring(id, title, body, timeStr, days = [], enabled = true) {
    // Persist
    const items = load().filter(i => i.id !== id)
    items.push({ id, title, body, timeStr, days, type: 'recurring', enabled })
    save(items)
    // Actual firing is handled by the heartbeat started in init()
  },

  /**
   * Update the enabled flag for a notification without rescheduling.
   */
  setEnabled(id, enabled) {
    const items = load().map(i => i.id === id ? { ...i, enabled } : i)
    save(items)
    if (!enabled && _timers[id]) {
      clearTimeout(_timers[id])
      delete _timers[id]
    } else if (enabled) {
      const item = items.find(i => i.id === id)
      if (item) this._activateItem(item)
    }
  },

  /** Cancel and remove a notification entirely. */
  cancelNotification(id) {
    save(load().filter(i => i.id !== id))
    if (_timers[id]) { clearTimeout(_timers[id]); delete _timers[id] }
  },

  /** Get all stored notification entries. */
  getAll() {
    return load()
  },

  /** Get a single notification entry by id, or null. */
  get(id) {
    return load().find(i => i.id === id) || null
  },

  /** Re-arm all stored notifications after a page load. */
  rescheduleAll() {
    const items = load()
    const now = Date.now()

    items.forEach(item => {
      if (!item.enabled) return
      this._activateItem(item)
    })

    // Clean up one-shots that are past-due
    const remaining = items.filter(i => {
      if (i.type !== 'oneshot') return true
      return new Date(i.fireAt).getTime() > now
    })
    if (remaining.length !== items.length) save(remaining)
  },

  /** @private Arm a single stored item */
  _activateItem(item) {
    if (item.type === 'oneshot') {
      const fireAt = new Date(item.fireAt)
      const delay = fireAt.getTime() - Date.now()
      if (delay <= 0) return
      if (_timers[item.id]) clearTimeout(_timers[item.id])
      _timers[item.id] = setTimeout(() => {
        show(item.title, item.body, item.id)
        save(load().filter(i => i.id !== item.id))
        delete _timers[item.id]
      }, delay)
    }
    // recurring items are handled by the heartbeat
  },

  /**
   * Start the minute heartbeat that drives recurring notifications.
   * Call once at app startup.
   */
  init() {
    this.rescheduleAll()
    this._heartbeatHandle = setInterval(() => this._tick(), 60_000)
    // Also run once immediately in case we just missed a minute boundary
    this._tick()
  },

  /** @private Check recurring notifications each minute */
  _tick() {
    const now = new Date()
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const dow = now.getDay() // 0=Sun … 6=Sat

    load().forEach(item => {
      if (item.type !== 'recurring' || !item.enabled) return
      if (item.timeStr !== hhmm) return
      if (item.days && item.days.length > 0 && !item.days.includes(dow)) return
      show(item.title, item.body, item.id)
    })
  },

  /** Stop the heartbeat (e.g. on unmount — rarely needed for a singleton). */
  destroy() {
    if (this._heartbeatHandle) {
      clearInterval(this._heartbeatHandle)
      this._heartbeatHandle = null
    }
    Object.values(_timers).forEach(clearTimeout)
    Object.keys(_timers).forEach(k => delete _timers[k])
  },

  /** Convenience: compute a reminder Date from an event start datetime and offset minutes. */
  reminderDate(startDateStr, startTimeStr, offsetMinutes) {
    if (!startDateStr) return null
    const [h, m] = (startTimeStr || '00:00').split(':').map(Number)
    const d = new Date(`${startDateStr}T${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`)
    d.setMinutes(d.getMinutes() - offsetMinutes)
    return d
  },

  /** Human-readable label for reminder offset. */
  reminderLabel(offsetMinutes) {
    if (!offsetMinutes && offsetMinutes !== 0) return 'No reminder'
    if (offsetMinutes === 0) return 'At start time'
    if (offsetMinutes < 60) return `${offsetMinutes} min before`
    const h = offsetMinutes / 60
    return h === 1 ? '1 hour before' : `${h} hours before`
  },
}

export default notificationService
