import client from './client'

export const habitsApi = {
  list:     (params) => client.get('/api/habits/', { params }).then(r => r.data.results ?? r.data),
  create:   (data)   => client.post('/api/habits/', data).then(r => r.data),
  update:   (id, data) => client.patch(`/api/habits/${id}/`, data).then(r => r.data),
  remove:   (id)     => client.delete(`/api/habits/${id}/`),
  moveToTrash: (id)  => client.patch(`/api/habits/${id}/`, { in_trash: true }).then(r => r.data),
  toggle:   (id, date, amount = null) => {
    const payload = amount !== null ? { amount } : {}
    return client.post(`/api/habits/${id}/toggle/`, payload, { params: date ? { date } : {} }).then(r => r.data)
  },
  heatmap:  (days = 35) => client.get('/api/habits/heatmap/', { params: { days } }).then(r => r.data),
}
