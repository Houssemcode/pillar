import axiosClient from './axiosClient'

/**
 * Settings & Preferences API Service
 * Handles user profile, appearance, language, and prayer configuration.
 */

/**
 * Fetch current user settings & preferences
 * GET /api/profile/me/
 * @returns {Promise<object>} User profile & preferences
 */
export async function getSettings() {
  try {
    const response = await axiosClient.get('/profile/me/')
    return response.data
  } catch (error) {
    console.error('[settingsService] Error fetching user preferences:', error)
    throw error
  }
}

/**
 * Update current user settings & preferences
 * PATCH /api/profile/me/
 * @param {object} data - Partial profile/preferences object
 * @returns {Promise<object>} Updated user profile & preferences
 */
export async function updateSettings(data) {
  try {
    const response = await axiosClient.patch('/profile/me/', data)
    return response.data
  } catch (error) {
    console.error('[settingsService] Error updating user preferences:', error)
    throw error
  }
}

const settingsService = {
  getSettings,
  updateSettings,
}

export default settingsService
