import axiosClient from './axiosClient'

/**
 * Fetch Adhkar items from Django backend.
 * GET /faith/adhkar/
 * @param {object|string} [params] - Category filter or params object
 * @returns {Promise<Array>} List of Adhkar entities
 */
export async function getAdhkar(params) {
  try {
    const queryParams = typeof params === 'string' ? { category: params } : params
    const response = await axiosClient.get('/faith/adhkar/', { params: queryParams })
    return response.data
  } catch (error) {
    console.error('Error fetching Adhkar:', error)
    throw error
  }
}

/**
 * Toggle Adhkar item completion.
 * POST /faith/adhkar/
 * @param {object} data - { item_id, type, date }
 * @returns {Promise<object>}
 */
export async function toggleAdhkar(data) {
  try {
    const response = await axiosClient.post('/faith/adhkar/', data)
    return response.data
  } catch (error) {
    console.error('Error toggling Adhkar:', error)
    throw error
  }
}

/**
 * Fetch categorized Du'as from Django backend.
 * GET /faith/duas/
 * @returns {Promise<Array>} List of Du'as
 */
export async function getDuas() {
  try {
    const response = await axiosClient.get('/faith/duas/')
    return response.data
  } catch (error) {
    console.error('Error fetching Duas:', error)
    throw error
  }
}

/**
 * Fetch Hadiths library with optional filtering (category, grade, etc.).
 * GET /faith/hadiths/
 * @param {object} [params] - Optional query parameters for category/grade filtering
 * @returns {Promise<Array|object>} Filtered Hadiths
 */
export async function getHadiths(params) {
  try {
    const response = await axiosClient.get('/faith/hadiths/', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching Hadiths:', error)
    throw error
  }
}

/**
 * Fetch Hadith of the Day.
 * GET /faith/hadiths/today/
 * @returns {Promise<object>} Hadith entity
 */
export async function getHadithOfTheDay() {
  try {
    const response = await axiosClient.get('/faith/hadiths/today/')
    return response.data
  } catch (error) {
    console.error('Error fetching Hadith of the Day:', error)
    throw error
  }
}

/**
 * Fetch distinct Hadith categories from Django backend.
 * GET /faith/hadiths/categories/
 * @returns {Promise<Array<string>>}
 */
export async function getHadithCategories() {
  try {
    const response = await axiosClient.get('/faith/hadiths/categories/')
    return response.data
  } catch (error) {
    console.error('Error fetching Hadith categories:', error)
    throw error
  }
}

/**
 * Fetch daily Good Deeds from Django backend.
 * GET /faith/deeds/
 * @param {object} [params]
 * @returns {Promise<Array>} List of Good Deeds
 */
export async function getGoodDeeds(params) {
  try {
    const response = await axiosClient.get('/faith/deeds/', { params })
    return response.data
  } catch (error) {
    console.error('Error fetching Good Deeds:', error)
    throw error
  }
}

/**
 * Toggle Good Deed completion.
 * POST /faith/deeds/
 * @param {object} data - { deed_id, date }
 * @returns {Promise<object>}
 */
export async function toggleGoodDeed(data) {
  try {
    const response = await axiosClient.post('/faith/deeds/', data)
    return response.data
  } catch (error) {
    console.error('Error toggling Good Deed:', error)
    throw error
  }
}

/**
 * Fetch prayer schedule and completion status.
 * GET /faith/prayers/
 * @param {string} [date] - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
export async function getPrayers(date) {
  try {
    const response = await axiosClient.get('/faith/prayers/', { params: date ? { date } : {} })
    return response.data
  } catch (error) {
    console.error('Error fetching Prayers:', error)
    throw error
  }
}

/**
 * Toggle Fard prayer completion.
 * PATCH /faith/prayers/:key/toggle/
 * @param {string} prayerKey
 * @param {string} [date]
 * @returns {Promise<object>}
 */
export async function togglePrayer(prayerKey, date) {
  try {
    const response = await axiosClient.patch(`/faith/prayers/${prayerKey}/toggle/`, {}, { params: date ? { date } : {} })
    return response.data
  } catch (error) {
    console.error('Error toggling Prayer:', error)
    throw error
  }
}

/**
 * Fetch user's Quran Khatmah progress.
 * GET /faith/khatmah/
 * @returns {Promise<object>}
 */
export async function getKhatmah() {
  try {
    const response = await axiosClient.get('/faith/khatmah/')
    return response.data
  } catch (error) {
    console.error('Error fetching Khatmah:', error)
    throw error
  }
}

/**
 * Update user's Quran Khatmah progress.
 * PATCH /faith/khatmah/
 * @param {object} data - { currentPage, targetPages }
 * @returns {Promise<object>}
 */
export async function updateKhatmah(data) {
  try {
    const response = await axiosClient.patch('/faith/khatmah/', data)
    return response.data
  } catch (error) {
    console.error('Error updating Khatmah:', error)
    throw error
  }
}

export default {
  getAdhkar,
  toggleAdhkar,
  getDuas,
  getHadiths,
  getHadithOfTheDay,
  getHadithCategories,
  getGoodDeeds,
  toggleGoodDeed,
  getPrayers,
  togglePrayer,
  getKhatmah,
  updateKhatmah,
}
