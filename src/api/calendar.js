/**
 * api/calendar.js
 * Calendar event CRUD + month/agenda queries.
 */
import client from './client'

const BASE = '/api/calendar/events'

export const calendarApi = {
  /** List all events (un-expanded). */
  list: () =>
    client.get(`${BASE}/`).then(r => r.data),

  /**
   * List events within a date range, with recurrences expanded.
   * @param {string} start  'YYYY-MM-DD'
   * @param {string} end    'YYYY-MM-DD'
   */
  range: (start, end) =>
    client.get(`${BASE}/`, { params: { start, end } }).then(r => r.data),

  /**
   * Get all events for a specific calendar month (recurrences expanded).
   * @param {number} year
   * @param {number} month  1–12
   */
  month: (year, month) =>
    client.get(`${BASE}/month/`, { params: { year, month } }).then(r => r.data),

  /**
   * Get upcoming events starting from a date (agenda view).
   * @param {string} start  'YYYY-MM-DD'  (default: today)
   * @param {number} days   number of days to look ahead (default 14, max 365)
   */
  agenda: (start, days = 14) =>
    client.get(`${BASE}/agenda/`, { params: { start, days } }).then(r => r.data),

  /** Get a single event by id. */
  get: (id) =>
    client.get(`${BASE}/${id}/`).then(r => r.data),

  /**
   * Create a new calendar event.
   * @param {object} data  Event fields (see CalendarEvent model)
   */
  create: (data) =>
    client.post(`${BASE}/`, data).then(r => r.data),

  /**
   * Partially update an event.
   * @param {number} id
   * @param {object} patch  Fields to update
   */
  update: (id, patch) =>
    client.patch(`${BASE}/${id}/`, patch).then(r => r.data),

  /** Delete an event. */
  delete: (id) =>
    client.delete(`${BASE}/${id}/`),
}
