import api from './axiosConfig'

// ✅ Fix 3 — Your Cloudinary cloud name
// Get from: cloudinary.com → Dashboard → Cloud Name
const CLOUDINARY_CLOUD_NAME  = 'drjlc6sb1'   // ← change this

// ✅ Fix 3 — Your unsigned upload preset name
// Create at: cloudinary.com → Settings → Upload → Upload Presets → Add preset
// Set Signing Mode = "Unsigned", folder = "civicpulse/evidence"
const CLOUDINARY_UPLOAD_PRESET = 'civic_issues' // ← change this

export const issueApi = {

  getAll:  ()       => api.get('/api/issues'),
  getMine: ()       => api.get('/api/issues?mine=true'),
  getById: (id)     => api.get(`/api/issues/${id}`),
  create:  (data)   => api.post('/api/issues', data),
  updateStatus: (id, status) => api.put(`/api/issues/${id}/status`, { status }),
  delete:  (id)     => api.delete(`/api/issues/${id}`),
  addComment: (id, text) => api.post(`/api/issues/${id}/comments`, { text }),

  /**
   * ✅ Fix 3 — Upload DIRECTLY to Cloudinary from frontend
   * Bypasses your backend completely → no Axios timeout issue
   * Image is stored as PUBLIC → accessible to all users via URL
   */
  uploadImageDirect: async (file, latitude, longitude) => {
    const formData = new FormData()
    formData.append('file',          file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder',        'civicpulse/evidence')

    if (latitude && longitude) {
      formData.append('context', `lat=${latitude}|lng=${longitude}`)
    }

    console.log(`📤 Uploading ${(file.size / 1024).toFixed(1)}KB directly to Cloudinary...`)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `Upload failed (${res.status})`)
    }

    const data = await res.json()
    console.log(`✅ Uploaded! URL: ${data.secure_url}`)

    // secure_url is publicly accessible — no auth needed to view
    return data.secure_url
  },
}