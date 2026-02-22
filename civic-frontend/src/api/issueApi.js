import api from './axiosConfig'

export const issueApi = {
  /** GET /api/issues — all issues */
  getAll: () => api.get('/api/issues'),

  /** GET /api/issues?mine=true — current user's issues */
  getMine: () => api.get('/api/issues?mine=true'),

  /** GET /api/issues/:id */
  getById: (id) => api.get(`/api/issues/${id}`),

  /** POST /api/issues */
  create: (data) => api.post('/api/issues', data),

  /** PUT /api/issues/:id/status */
  updateStatus: (id, status) => api.put(`/api/issues/${id}/status`, { status }),

  /** DELETE /api/issues/:id */
  delete: (id) => api.delete(`/api/issues/${id}`),

  /** POST /api/issues/:id/comments */
  addComment: (id, text) => api.post(`/api/issues/${id}/comments`, { text }),
}
