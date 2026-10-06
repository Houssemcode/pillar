import client from './client'

export const todayApi = {
  getDashboard: (date) => 
    client.get('/api/today/', { params: date ? { date } : {} }).then(r => r.data)
}
