import api from './axiosConfig'

export const notificationApi = {
  /** GET /api/notifications */
  getAll: () => api.get('/api/notifications'),
}
