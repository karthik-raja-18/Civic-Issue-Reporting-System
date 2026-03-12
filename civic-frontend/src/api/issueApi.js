import api from './axiosConfig'

export const issueApi = {

  getAll:  ()     => api.get('/api/issues'),
  getMine: ()     => api.get('/api/issues?mine=true'),
  getById: (id)   => api.get(`/api/issues/${id}`),
  create:  (data) => api.post('/api/issues', data),
  delete:  (id)   => api.delete(`/api/issues/${id}`),
  addComment: (id, text) => api.post(`/api/issues/${id}/comments`, { text }),

  updateStatus: (id, status) =>
    api.put(`/api/issues/${id}/status`, { status }),

  // ✅ Admin/Zone Admin: mark resolved + proof photo URL
  resolve: (id, resolvedImageUrl, resolvedImagePublicId) =>
    api.put(`/api/issues/${id}/resolve`, { resolvedImageUrl, resolvedImagePublicId }),

  // ✅ Reporter: confirm fix is done → CLOSED
  confirmResolution: (id) =>
    api.put(`/api/issues/${id}/confirm-resolution`),

  // ✅ Reporter: not fixed yet → REOPENED with optional note
  reopen: (id, note = '') =>
    api.put(`/api/issues/${id}/reopen`, { note }),

  // Upload image via Backend Proxy (handles Cloudinary securely)
  uploadImageDirect: async (file, latitude, longitude, capturedAt) => {
    const formData = new FormData()
    formData.append('file', file)
    if (latitude)  formData.append('latitude',  latitude)
    if (longitude) formData.append('longitude', longitude)
    if (capturedAt) formData.append('capturedAt', capturedAt)

    // Using the 'api' axios instance which handles Auth tokens automatically
    const res = await api.post('/api/issues/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    // Backend returns ApiResponse<UploadResponse> -> data.data { imageUrl, publicId }
    return res.data.data
  },
}
