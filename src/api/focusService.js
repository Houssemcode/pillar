import axiosClient from './axiosClient'

/**
 * Focus API Service Layer
 * Connects frontend Focus/Pomodoro components directly to Django backend endpoints.
 */

/**
 * Log and persist a completed or interrupted focus session.
 * POST /focus/
 * @param {object} data - { mode, duration_minutes, duration, status, task, label, start_time, end_time }
 * @returns {Promise<object>} Created focus session
 */
export async function saveSession(data) {
  try {
    const response = await axiosClient.post('/focus/', data)
    return response.data
  } catch (error) {
    console.error('[focusService] Error saving focus session:', error)
    console.error('Focus Validation Error:', error.response?.data)
    throw error
  }
}

/**
 * Fetch aggregated productivity metrics:
 * today_seconds, week_seconds, today_sessions, today_minutes, week_minutes.
 * GET /focus/stats/
 * @returns {Promise<object>}
 */
export async function getStats() {
  try {
    const response = await axiosClient.get('/focus/stats/')
    return response.data
  } catch (error) {
    console.error('[focusService] Error fetching focus stats:', error)
    throw error
  }
}

/**
 * Fetch all sessions recorded today along with pomodoro count and total minutes.
 * GET /focus/today/
 * @returns {Promise<{ count: number, today_seconds: number, today_minutes: number, sessions: Array }>}
 */
export async function getTodaySessions() {
  try {
    const response = await axiosClient.get('/focus/today/')
    return response.data
  } catch (error) {
    console.error('[focusService] Error fetching today sessions:', error)
    throw error
  }
}

/**
 * Fetch 7-day breakdown (Monday through Sunday) for the current week.
 * GET /focus/weekly/
 * @returns {Promise<Array<{ day: string, date: string, count: number, seconds: number, minutes: number }>>}
 */
export async function getWeeklyStats() {
  try {
    const response = await axiosClient.get('/focus/weekly/')
    return response.data ?? []
  } catch (error) {
    console.error('[focusService] Error fetching weekly stats:', error)
    throw error
  }
}

/**
 * Fetch historical sessions with optional filters.
 * GET /focus/
 * @param {object} [params] - { mode, status, task, date }
 * @returns {Promise<Array>}
 */
export async function getSessions(params) {
  try {
    const response = await axiosClient.get('/focus/', { params })
    return response.data?.results ?? response.data ?? []
  } catch (error) {
    console.error('[focusService] Error fetching session history:', error)
    throw error
  }
}

/**
 * Delete a session by ID.
 * DELETE /focus/${id}/
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  try {
    const response = await axiosClient.delete(`/focus/${id}/`)
    return response.data
  } catch (error) {
    console.error(`[focusService] Error deleting session ${id}:`, error)
    throw error
  }
}

export default {
  saveSession,
  getStats,
  getTodaySessions,
  getWeeklyStats,
  getSessions,
  deleteSession,
}
