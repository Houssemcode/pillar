import client from './client'

export const tasksApi = {
  // Tasks
  list:   (params) => client.get('/api/tasks/', { params }).then(r => r.data.results ?? r.data),
  create: (data)   => client.post('/api/tasks/', data).then(r => r.data),
  update: (id, data) => client.patch(`/api/tasks/${id}/`, data).then(r => r.data),
  remove: (id)     => client.delete(`/api/tasks/${id}/`),
  // Lists
  getLists:    ()       => client.get('/api/tasks/lists/').then(r => r.data.results ?? r.data),
  createList:  (data)   => client.post('/api/tasks/lists/', data).then(r => r.data),
  // Tags
  getTags:     ()       => client.get('/api/tasks/tags/').then(r => r.data.results ?? r.data),
  createTag:   (data)   => client.post('/api/tasks/tags/', data).then(r => r.data),
}
