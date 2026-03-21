import api from './axiosConfig'

export const analyticsApi = {
  getAdmin:    () => api.get('/api/analytics/admin'),
  getRegional: () => api.get('/api/analytics/regional'),
}
