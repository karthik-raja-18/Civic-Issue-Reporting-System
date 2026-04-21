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

  resolve: (id, resolvedImageUrl, resolvedImagePublicId) =>
    api.put(`/api/issues/${id}/resolve`, { resolvedImageUrl, resolvedImagePublicId }),

  confirmResolution: (id) =>
    api.put(`/api/issues/${id}/confirm-resolution`),

  reopen: (id, note = '') =>
    api.put(`/api/issues/${id}/reopen`, { note }),

  // ✅ NEW — AI validation: image check + duplicate detection
  // Called AFTER photo is uploaded to Cloudinary, BEFORE final submit
  validateWithAi: (payload) =>
    api.post('/api/issues/validate-ai', payload),
  // payload: { imageUrl, title, description, category, latitude, longitude }

  // Upload image via Backend Proxy (handles Cloudinary securely)
  uploadImageDirect: async (file, latitude, longitude) => {
    const formData = new FormData()
    formData.append('file', file)
    if (latitude)  formData.append('latitude',  latitude)
    if (longitude) formData.append('longitude', longitude)
    formData.append('capturedAt', new Date().toISOString())

    const res = await api.post('/api/issues/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    // Backend returns ApiResponse<UploadResponse> 
    // Return the whole object so we have both imageUrl and publicId
    return res.data.data
  },
  
  
  // Toggle upvote on an issue
  // Pass current GPS coordinates for proximity check
  upvote: (id, latitude, longitude) =>
    api.post(`/api/issues/${id}/upvote`, { latitude, longitude }),

  // Check if current user has upvoted
  getUpvoteStatus: (id) =>
    api.get(`/api/issues/${id}/upvote`),
}
