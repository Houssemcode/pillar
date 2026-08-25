import client from './client'

export const faithApi = {
  // Prayers
  getPrayers:   (date) => client.get('/api/faith/prayers/', { params: date ? { date } : {} }).then(r => r.data),
  togglePrayer: (prayerKey, date) => client.patch(`/api/faith/prayers/${prayerKey}/toggle/`, {}, { params: date ? { date } : {} }).then(r => r.data),
  // Adhkar
  getAdhkar:    (date, type) => client.get('/api/faith/adhkar/', { params: { date, type } }).then(r => r.data),
  toggleAdhkar: (data)  => client.post('/api/faith/adhkar/', data).then(r => r.data),
  // Khatmah
  getKhatmah:   ()      => client.get('/api/faith/khatmah/').then(r => r.data),
  updateKhatmah:(data)  => client.patch('/api/faith/khatmah/', data).then(r => r.data),
  // Good Deeds
  getDeeds:     (date)  => client.get('/api/faith/deeds/', { params: date ? { date } : {} }).then(r => r.data),
  toggleDeed:   (data)  => client.post('/api/faith/deeds/', data).then(r => r.data),
}
