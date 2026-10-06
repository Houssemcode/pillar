import axiosClient from './axiosClient'
import { HABIT_PRESETS } from '../data/habitPresets'

/**
 * Habits API Service Layer
 * Connects frontend components directly to Django Habits ViewSets via axiosClient.
 */

/**
 * Fetch habits with optional filtering.
 * GET /habits/
 * @param {object} [params] - { trash, archived, area, frequency }
 * @returns {Promise<Array>} List of habit entities
 */
export async function getHabits(params) {
  try {
    const response = await axiosClient.get('/habits/', { params })
    return response.data?.results ?? response.data ?? []
  } catch (error) {
    console.error('[habitsService] Error fetching habits:', error)
    throw error
  }
}

/**
 * Create a new habit.
 * POST /habits/
 * @param {object} data
 * @returns {Promise<object>} Created habit entity
 */
export async function createHabit(data) {
  try {
    const response = await axiosClient.post('/habits/', data)
    return response.data
  } catch (error) {
    console.error('[habitsService] Error creating habit:', error)
    console.error('Habit Validation Error:', error.response?.data)
    throw error
  }
}

/**
 * Partially update a habit.
 * PATCH /habits/${id}/
 * @param {number|string} id
 * @param {object} data
 * @returns {Promise<object>} Updated habit entity
 */
export async function updateHabit(id, data) {
  try {
    const response = await axiosClient.patch(`/habits/${id}/`, data)
    return response.data
  } catch (error) {
    console.error(`[habitsService] Error updating habit ${id}:`, error)
    console.error('Habit Validation Error:', error.response?.data)
    throw error
  }
}

/**
 * Quick toggle habit completion for a specific date (defaults to today).
 * POST /habits/${id}/toggle/
 * @param {number|string} id
 * @param {object} [data] - { date: 'YYYY-MM-DD' }
 * @returns {Promise<object>} Updated habit entity with refreshed telemetry
 */
export async function toggleHabit(id, data = {}) {
  try {
    const response = await axiosClient.post(`/habits/${id}/toggle/`, data)
    return response.data
  } catch (error) {
    console.error(`[habitsService] Error toggling habit ${id}:`, error)
    throw error
  }
}

/**
 * Log specific progress or completion for a habit date.
 * POST /habits/${id}/log/
 * @param {number|string} id
 * @param {object} data - { date, progress_count, is_completed }
 * @returns {Promise<object>}
 */
export async function logHabit(id, data) {
  try {
    const response = await axiosClient.post(`/habits/${id}/log/`, data)
    return response.data
  } catch (error) {
    console.error(`[habitsService] Error logging habit ${id}:`, error)
    throw error
  }
}

/**
 * Delete a habit (soft-delete to trash by default, or permanent).
 * DELETE /habits/${id}/
 * @param {number|string} id
 * @param {boolean} [permanent=false]
 * @returns {Promise<void>}
 */
export async function deleteHabit(id, permanent = false) {
  try {
    const response = await axiosClient.delete(`/habits/${id}/`, {
      params: permanent ? { permanent: 'true' } : {},
    })
    return response.data
  } catch (error) {
    console.error(`[habitsService] Error deleting habit ${id}:`, error)
    throw error
  }
}

/**
 * Fetch Habit Areas (Life categories).
 * GET /habits/areas/
 * @returns {Promise<Array>} List of habit area entities
 */
export async function getAreas() {
  try {
    const response = await axiosClient.get('/habits/areas/')
    return response.data?.results ?? response.data ?? []
  } catch (error) {
    console.error('[habitsService] Error fetching habit areas:', error)
    throw error
  }
}

/**
 * Create a new Habit Area.
 * POST /habits/areas/
 * @param {object} data - { name, color, order }
 * @returns {Promise<object>} Created area entity
 */
export async function createArea(data) {
  try {
    const response = await axiosClient.post('/habits/areas/', data)
    return response.data
  } catch (error) {
    console.error('[habitsService] Error creating habit area:', error)
    throw error
  }
}

/**
 * Fetch heatmap telemetry for habits over N days.
 * GET /habits/heatmap/
 * @param {number} [days=35]
 * @returns {Promise<Array>}
 */
export async function getHeatmap(days = 35) {
  try {
    const response = await axiosClient.get('/habits/heatmap/', { params: { days } })
    return response.data ?? []
  } catch (error) {
    console.error('[habitsService] Error fetching habit heatmap:', error)
    throw error
  }
}

/**
 * Fetch habit presets catalog.
 * GET /habits/presets/
 * @returns {Promise<Array>}
 */
export async function getPresets() {
  try {
    const response = await axiosClient.get('/habits/presets/')
    return response.data ?? []
  } catch (error) {
    console.error('[habitsService] Error fetching presets:', error)
    return HABIT_PRESETS
  }
}

/**
 * Initialize core default faith habits ('quran', 'morning_adhkar', 'evening_adhkar').
 * POST /habits/initialize/
 * @returns {Promise<object>}
 */
export async function initializeCoreHabits() {
  try {
    const response = await axiosClient.post('/habits/initialize/')
    return response.data
  } catch (error) {
    console.error('[habitsService] Error initializing core habits:', error)
    throw error
  }
}

export default {
  getHabits,
  createHabit,
  updateHabit,
  toggleHabit,
  logHabit,
  deleteHabit,
  getAreas,
  createArea,
  getHeatmap,
  getPresets,
  initializeCoreHabits,
}

