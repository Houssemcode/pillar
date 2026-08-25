import client, { saveTokens } from './client'

export const authApi = {
  register: (data) => client.post('/api/auth/register/', data).then(r => r.data),
  login:    (data) => client.post('/api/auth/login/',    data).then(r => {
    saveTokens({ access: r.data.access, refresh: r.data.refresh })
    return r.data
  }),
  me:       ()     => client.get('/api/auth/me/').then(r => r.data),
  updateMe: (data) => client.patch('/api/auth/me/', data).then(r => r.data),
}
