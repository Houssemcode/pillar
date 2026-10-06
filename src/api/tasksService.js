import axiosClient from './axiosClient'

/**
 * Tasks API Service Layer
 * Connects frontend components directly to Django Tasks ViewSets via axiosClient.
 */

/**
 * Fetch tasks with optional filters (is_completed, due_date, list_id, tag, priority, search, trash).
 * GET /tasks/
 * @param {object} [params]
 * @returns {Promise<Array>} List of task entities
 */
export async function getTasks(params) {
  try {
    const response = await axiosClient.get('/tasks/', { params })
    // Support pagination or raw arrays
    return response.data?.results ?? response.data ?? []
  } catch (error) {
    console.error('[tasksService] Error fetching tasks:', error)
    throw error
  }
}

/**
 * Create a new task with nested subtasks and tag associations.
 * POST /tasks/
 * @param {object} data
 * @returns {Promise<object>} Created task entity
 */
export async function createTask(data) {
  try {
    const response = await axiosClient.post('/tasks/', data)
    return response.data
  } catch (error) {
    console.error('[tasksService] Error creating task:', error)
    console.error('Task Validation Error:', error.response?.data)
    throw error
  }
}

/**
 * Partially update a task (title, completion, subtasks array, list, tags, etc.).
 * PATCH /tasks/${id}/
 * @param {number|string} id
 * @param {object} data
 * @returns {Promise<object>} Updated task entity
 */
export async function updateTask(id, data) {
  try {
    const response = await axiosClient.patch(`/tasks/${id}/`, data)
    return response.data
  } catch (error) {
    console.error(`[tasksService] Error updating task ${id}:`, error)
    console.error('Task Validation Error:', error.response?.data)
    throw error
  }
}

/**
 * Toggle task completion state.
 * POST /tasks/${id}/toggle/
 * @param {number|string} id
 * @returns {Promise<object>} Updated task entity
 */
export async function toggleTask(id) {
  try {
    const response = await axiosClient.post(`/tasks/${id}/toggle/`)
    return response.data
  } catch (error) {
    console.error(`[tasksService] Error toggling task ${id}:`, error)
    throw error
  }
}

/**
 * Delete a task (soft delete by default, permanent if permanent=true).
 * DELETE /tasks/${id}/
 * @param {number|string} id
 * @param {boolean} [permanent=false]
 * @returns {Promise<object|null>}
 */
export async function deleteTask(id, permanent = false) {
  try {
    const response = await axiosClient.delete(`/tasks/${id}/${permanent ? '?permanent=true' : ''}`)
    return response.data
  } catch (error) {
    console.error(`[tasksService] Error deleting task ${id}:`, error)
    throw error
  }
}

/**
 * Restore a soft-deleted task from trash.
 * PATCH /tasks/${id}/
 * @param {number|string} id
 * @returns {Promise<object>}
 */
export async function restoreTask(id) {
  try {
    const response = await axiosClient.patch(`/tasks/${id}/`, { in_trash: false })
    return response.data
  } catch (error) {
    console.error(`[tasksService] Error restoring task ${id}:`, error)
    throw error
  }
}

/**
 * Fetch user task lists.
 * GET /tasks/lists/
 * @param {object} [params]
 * @returns {Promise<Array>}
 */
export async function getLists(params) {
  try {
    const response = await axiosClient.get('/tasks/lists/', { params })
    return response.data?.results ?? response.data ?? []
  } catch (error) {
    console.error('[tasksService] Error fetching task lists:', error)
    throw error
  }
}

/**
 * Create a new task list.
 * POST /tasks/lists/
 * @param {object} data - { name, color, icon, default_view }
 * @returns {Promise<object>}
 */
export async function createList(data) {
  try {
    const payload = {
      name: data.name,
      color: data.color || data.accentColor || data.accent_color || '#10B981',
      accent_color: data.accent_color || data.accentColor || data.color || '#10B981',
      accentColor: data.accentColor || data.accent_color || data.color || '#10B981',
      icon: data.icon || '📋',
      default_view: data.default_view || data.defaultView || 'list',
      defaultView: data.defaultView || data.default_view || 'list',
    }
    const response = await axiosClient.post('/tasks/lists/', payload)
    return response.data
  } catch (error) {
    console.error('[tasksService] Error creating task list:', error)
    throw error
  }
}

/**
 * Delete a task list.
 * DELETE /tasks/lists/${id}/
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteList(id) {
  try {
    const response = await axiosClient.delete(`/tasks/lists/${encodeURIComponent(id)}/`)
    return response.data
  } catch (error) {
    console.error(`[tasksService] Error deleting list ${id}:`, error)
    throw error
  }
}

/**
 * Fetch task categorization tags.
 * GET /tasks/tags/
 * @returns {Promise<Array>}
 */
export async function getTags() {
  try {
    const response = await axiosClient.get('/tasks/tags/')
    return response.data?.results ?? response.data ?? []
  } catch (error) {
    console.error('[tasksService] Error fetching tags:', error)
    throw error
  }
}

/**
 * Create a new task tag.
 * POST /tasks/tags/
 * @param {object} data - { name, color }
 * @returns {Promise<object>}
 */
export async function createTag(data) {
  try {
    const payload = {
      name: data.name,
      color: data.color || '#10B981',
    }
    const response = await axiosClient.post('/tasks/tags/', payload)
    return response.data
  } catch (error) {
    console.error('[tasksService] Error creating tag:', error)
    throw error
  }
}

/**
 * Delete a task tag.
 * DELETE /tasks/tags/${id}/
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export async function deleteTag(id) {
  try {
    const response = await axiosClient.delete(`/tasks/tags/${encodeURIComponent(id)}/`)
    return response.data
  } catch (error) {
    console.error(`[tasksService] Error deleting tag ${id}:`, error)
    throw error
  }
}

/**
 * Batch complete tasks.
 * POST /tasks/batch-complete/
 * @param {Array<number|string>} ids
 * @param {boolean} [is_completed=true]
 * @returns {Promise<object>}
 */
export async function batchComplete(ids, is_completed = true) {
  try {
    const response = await axiosClient.post('/tasks/batch-complete/', { ids, is_completed, done: is_completed })
    return response.data
  } catch (error) {
    console.error('[tasksService] Error batch completing tasks:', error)
    throw error
  }
}

/**
 * Batch trash tasks.
 * POST /tasks/batch-trash/
 * @param {Array<number|string>} ids
 * @param {boolean} [in_trash=true]
 * @returns {Promise<object>}
 */
export async function batchTrash(ids, in_trash = true) {
  try {
    const response = await axiosClient.post('/tasks/batch-trash/', { ids, in_trash })
    return response.data
  } catch (error) {
    console.error('[tasksService] Error batch trashing tasks:', error)
    throw error
  }
}

export const tasksService = {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  restoreTask,
  getLists,
  createList,
  deleteList,
  getTags,
  createTag,
  deleteTag,
  batchComplete,
  batchTrash,
}

export default tasksService
