import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { CATEGORY_OPTIONS, extractError } from '../utils/helpers'
import AlertMessage from '../components/AlertMessage'
import Spinner from '../components/Spinner'

const INITIAL = {
  title: '', description: '', category: '',
  imageUrl: '', latitude: '', longitude: '',
}

export default function CreateIssue() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleChange = (e) => {
    setError(null)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Try to auto-fill location from browser geolocation
  const handleGeoFill = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(prev => ({
          ...prev,
          latitude:  String(coords.latitude.toFixed(6)),
          longitude: String(coords.longitude.toFixed(6)),
        }))
      },
      () => setError('Could not retrieve your location.')
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        category:    form.category,
        imageUrl:    form.imageUrl || null,
        latitude:    form.latitude  ? parseFloat(form.latitude)  : null,
        longitude:   form.longitude ? parseFloat(form.longitude) : null,
      }
      const res = await issueApi.create(payload)
      navigate(`/issues/${res.data.data.id}`)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-wrapper">
      {/* Back link */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-400
                                       hover:text-white transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="page-title">Report a Civic Issue</h1>
        <p className="text-ink-400 text-sm mt-1">Fill in the details to submit a new issue to the community.</p>
      </div>

      <div className="card border-ink-700">
        <form onSubmit={handleSubmit} className="space-y-5">
          <AlertMessage type="error" message={error} onDismiss={() => setError(null)} />

          {/* Title */}
          <div>
            <label className="label">Issue title <Required /></label>
            <input
              type="text" name="title"
              className="input" placeholder="e.g. Pothole on Main Street"
              value={form.title} onChange={handleChange}
              required maxLength={200} autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category <Required /></label>
            <select
              name="category"
              className="input"
              value={form.category} onChange={handleChange}
              required
            >
              <option value="">Select a category…</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <Required /></label>
            <textarea
              name="description"
              className="input min-h-[120px] resize-y"
              placeholder="Describe the issue in detail. Where is it? How severe is it?"
              value={form.description} onChange={handleChange}
              required rows={4}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="label">Image URL <span className="text-ink-600 normal-case font-normal">(optional)</span></label>
            <input
              type="url" name="imageUrl"
              className="input" placeholder="https://example.com/photo.jpg"
              value={form.imageUrl} onChange={handleChange}
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">
                Location <span className="text-ink-600 normal-case font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={handleGeoFill}
                className="btn-ghost text-xs py-1 px-2 text-civic-400 hover:text-civic-300"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                Use my location
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number" name="latitude" step="any"
                  className="input" placeholder="Latitude (e.g. 40.7128)"
                  value={form.latitude} onChange={handleChange}
                />
              </div>
              <div>
                <input
                  type="number" name="longitude" step="any"
                  className="input" placeholder="Longitude (e.g. -74.0060)"
                  value={form.longitude} onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-ink-800">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Submitting…</> : 'Submit Issue'}
            </button>
            <Link to="/dashboard" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const Required = () => <span className="text-red-400">*</span>
