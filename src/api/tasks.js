import tasksService from './tasksService'

export const tasksApi = {
  // Tasks
  list:       (params) => tasksService.getTasks(params),
  create:     (data)   => tasksService.createTask(data),
  update:     (id, data) => tasksService.updateTask(id, data),
  toggle:     (id)     => tasksService.toggleTask(id),
  remove:     (id, permanent = false) => tasksService.deleteTask(id, permanent),
  restore:    (id)     => tasksService.restoreTask(id),
  // Lists
  getLists:   (params) => tasksService.getLists(params),
  createList: (data)   => tasksService.createList(data),
  deleteList: (id)     => tasksService.deleteList(id),
  // Tags
  getTags:    ()       => tasksService.getTags(),
  createTag:  (data)   => tasksService.createTag(data),
  deleteTag:  (id)     => tasksService.deleteTag(id),
}

export default tasksApi
