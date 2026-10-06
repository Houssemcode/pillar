import client from './client'

export const trashApi = {
  list: () => client.get('/api/trash/').then(r => r.data),
  empty: () => client.delete('/api/trash/').then(r => r.data),
  restore: (type, id) => client.patch(`/api/trash/${type}/${id}/`).then(r => r.data),
  remove: (type, id) => client.delete(`/api/trash/${type}/${id}/`).then(r => r.data),
}
