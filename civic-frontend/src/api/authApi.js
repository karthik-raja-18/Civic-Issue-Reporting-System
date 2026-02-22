import api from './axiosConfig'

export const authApi = {
  /**
   * POST /api/auth/register
   * @param {{ name, email, password }} data
   */
  register: (data) => api.post('/api/auth/register', data),

  /**
   * POST /api/auth/login
   * @param {{ email, password }} data
   */
  login: (data) => api.post('/api/auth/login', data),
}
