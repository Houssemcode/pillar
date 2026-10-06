import client, { saveTokens } from './client'

export const authApi = {
  register: (data) =>
    client.post('/api/auth/register/', data).then((r) => {
      if (r.data?.access && r.data?.refresh) {
        saveTokens({ access: r.data.access, refresh: r.data.refresh })
      }
      return r.data
    }),
  login: (data) =>
    client.post('/api/auth/login/', data).then((r) => {
      if (r.data?.access && r.data?.refresh) {
        saveTokens({ access: r.data.access, refresh: r.data.refresh })
      }
      return r.data
    }),
  me: () => client.get('/api/auth/me/').then((r) => r.data),
  updateMe: (data) => client.patch('/api/auth/me/', data).then((r) => r.data),
  changePassword: (data) => client.post('/api/auth/change-password/', data).then((r) => r.data),
  getProfileStats: () => client.get('/api/auth/profile-stats/').then((r) => r.data),
  exportData: () => client.get('/api/auth/export/').then((r) => r.data),
  deleteAccount: (data) => client.post('/api/auth/delete-account/', data).then((r) => r.data),
}

export default authApi
