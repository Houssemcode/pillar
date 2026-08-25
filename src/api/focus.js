import client from './client'

export const focusApi = {
  logSession: (data)  => client.post('/api/focus/sessions/', data).then(r => r.data),
  today:      ()      => client.get('/api/focus/sessions/today/').then(r => r.data),
  weekly:     ()      => client.get('/api/focus/sessions/weekly/').then(r => r.data),
  history:    (params) => client.get('/api/focus/sessions/', { params }).then(r => r.data.results ?? r.data),
}
