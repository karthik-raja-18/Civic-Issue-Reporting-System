import { useState, lazy, Suspense, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'
import { useNavigate, Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { extractError } from '../utils/helpers'
import AlertMessage from '../components/AlertMessage'
import Spinner from '../components/Spinner'
import EvidenceCapture from '../components/EvidenceCapture'
import 'leaflet/dist/leaflet.css'

const LocationPicker = lazy(() => import('../components/LocationPicker'))

const CATEGORIES = [
  'Pothole', 'Street Light', 'Garbage', 'Water Supply',
  'Sewage', 'Road Damage', 'Encroachment', 'Noise Pollution',
  'Park / Public Space', 'Drainage', 'Other',
]

const INITIAL_FORM = { title: '', description: '', category: '' }

export default function CreateIssue() {
  const navigate = useNavigate()

  const [form,       setForm]       = useState(INITIAL_FORM)
  const [location,   setLocation]   = useState(null)  // { latitude, longitude }
  const [evidence,   setEvidence]   = useState(null)  // from EvidenceCapture
  const [imageUrl,   setImageUrl]   = useState('')    // Cloudinary URL after upload
  const [imagePublicId, setImagePublicId] = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  const recaptchaRef = useRef(null)

  // Photo uploaded = step complete
  const photoUploaded = !!imageUrl

  // ── Form change ───────────────────────────────────────────────────
  const handleChange = (e) => {
    setError(null)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── Location from GPS (EvidenceCapture) ──────────────────────────
  const handleLocationCapture = (loc) => {
    setLocation(loc)
  }

  // ── Location from Map click or search ────────────────────────────
  const handleMapSelect = (loc) => {
    setLocation(loc)
  }

  // ── Photo captured from EvidenceCapture ──────────────────────────
  const handleCapture = (payload) => {
    setEvidence(payload)
    // If GPS from camera, fill location too
    if (payload.location) {
      setLocation(payload.location)
    }
  }

  // ── Upload evidence to Cloudinary ────────────────────────────────
const handleUpload = async () => {
  if (!evidence?.file) return
  setUploading(true)
  setError(null)
  try {
    // ✅ Fix 3 — Direct to Cloudinary, no backend, no timeout
    const uploadData = await issueApi.uploadImageDirect(
      evidence.file,
      location?.latitude,
      location?.longitude,
      evidence.timestamp
    )
    setImageUrl(uploadData.imageUrl)
    setImagePublicId(uploadData.publicId)
  } catch (err) {
    setError('Upload failed: ' + (err.message || 'Check internet connection and try again.'))
  } finally {
    setUploading(false)
  }
}

  // ── Submit issue ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    // ✅ Mandatory photo check
    if (!imageUrl) {
      setError('You must take and upload a photo before submitting.')
      return
    }
    if (!location?.latitude || !location?.longitude) {
      setError('Please set the issue location on the map.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        captchaToken: captchaToken,
        title:       form.title,
        description: form.description,
        category:    form.category,
        imageUrl:    imageUrl,
        imagePublicId: imagePublicId,
        latitude:    location.latitude,
        longitude:   location.longitude,
      }
      const res = await issueApi.create(payload)
      navigate(`/issues/${res.data.data.id}`)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  // ── Step indicators ───────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Set Location',  done: !!(location?.latitude) },
    { num: 2, label: 'Take Photo',    done: !!evidence             },
    { num: 3, label: 'Upload Photo',  done: photoUploaded          },
    { num: 4, label: 'Submit',        done: false                  },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-wrapper">

      {/* Back */}
      <Link to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400
                   hover:text-white transition-colors mb-6">
        <BackIcon /> Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="page-title">Report a Civic Issue</h1>
        <p className="text-ink-400 text-sm mt-1">
          Complete all steps. Your report will be auto-assigned to the zone admin.
        </p>
      </div>

      {/* ── Step Progress ── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-1.5 text-xs font-medium
              px-3 py-1.5 rounded-full border transition-all
              ${s.done
                ? 'bg-civic-500/20 border-civic-500/40 text-civic-400'
                : 'bg-ink-800 border-ink-700 text-ink-400'}`}>
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center
                ${s.done ? 'bg-civic-500 text-white' : 'bg-ink-700 text-ink-400'}`}>
                {s.done ? '✓' : s.num}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-px ${s.done ? 'bg-civic-500/50' : 'bg-ink-700'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="card border-ink-700">
        <form onSubmit={handleSubmit} className="space-y-6">

          <AlertMessage type="error" message={error} onDismiss={() => setError(null)} />

          {/* ── Title ── */}
          <div>
            <label className="label">Issue Title <Req /></label>
            <input type="text" name="title" className="input"
              placeholder="e.g. Deep pothole near Brookefields Mall"
              value={form.title} onChange={handleChange}
              required maxLength={200} />
          </div>

          {/* ── Category ── */}
          <div>
            <label className="label">Category <Req /></label>
            <select name="category" className="input"
              value={form.category} onChange={handleChange} required>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="label">Description <Req /></label>
            <textarea name="description" className="input min-h-[90px] resize-y"
              placeholder="Describe in detail — exact location, severity, how long it's been there."
              value={form.description} onChange={handleChange} required rows={3} />
          </div>

          {/* ── STEP 1: Location ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                📍 Location <Req />
              </label>
              {location && (
                <span className="text-xs text-civic-400 font-mono">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </span>
              )}
            </div>
            <Suspense fallback={
              <div className="h-[260px] rounded-xl bg-ink-800 border border-ink-700
                              flex items-center justify-center text-ink-400 text-sm">
                <Spinner /> <span className="ml-2">Loading map…</span>
              </div>
            }>
              <LocationPicker
                value={location}
                onSelect={handleMapSelect}
              />
            </Suspense>
          </div>

          {/* ── STEP 2 + 3: Evidence Photo ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                📸 Evidence Photo <Req />
                <span className="ml-1 text-ink-500 font-normal text-xs normal-case">
                  (must take live photo)
                </span>
              </label>
              {photoUploaded && (
                <span className="text-xs text-civic-400 flex items-center gap-1">
                  <span>✅</span> Uploaded
                </span>
              )}
            </div>

            {/* Camera component */}
            <EvidenceCapture
              onCapture={handleCapture}
              onLocationCapture={handleLocationCapture}
            />

            {/* ✅ Show Cloudinary image preview after upload */}
            {photoUploaded && (
              <div className="mt-3 rounded-xl overflow-hidden border border-civic-500/30">
                <div className="bg-civic-500/10 px-4 py-2 text-xs text-civic-400 font-medium
                                border-b border-civic-500/20 flex items-center gap-2">
                  <span>✅</span> Evidence uploaded — visible to all users
                </div>
                <img
                  src={imageUrl}
                  alt="Uploaded evidence"
                  className="w-full max-h-64 object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div className="bg-ink-800/60 px-3 py-2 text-xs text-ink-400 truncate">
                  🔗 {imageUrl}
                </div>
              </div>
            )}

            {/* Upload button — show after photo taken but before upload */}
            {evidence && !photoUploaded && (
              <button type="button" onClick={handleUpload}
                disabled={uploading}
                className="btn-secondary w-full justify-center mt-3 gap-2">
                {uploading
                  ? <><Spinner size="sm" /> Uploading to cloud…</>
                  : <><UploadIcon /> Upload Evidence Photo</>}
              </button>
            )}

            {/* Prompt if no photo yet */}
            {!evidence && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                <span>⚠️</span>
                Photo is required. Click "Open Camera" above to take a photo.
              </p>
            )}
          </div>

          {/* ── CAPTCHA ── */}
          <div className="flex justify-center py-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // standard test key
              onChange={(token) => setCaptchaToken(token)}
              theme="dark"
            />
          </div>

          {/* ── Submit ── */}
          <div className="pt-2 border-t border-ink-800 flex items-center gap-3">
            <button
              type="submit"
              disabled={!photoUploaded || loading || !captchaToken}
              title={!photoUploaded ? 'Upload a photo first' : !captchaToken ? 'Complete CAPTCHA' : ''}
              className={`btn-primary gap-2 ${
                !photoUploaded
                  ? 'opacity-40 cursor-not-allowed'
                  : ''
              }`}
            >
              {loading ? <><Spinner size="sm" /> Submitting…</> : 'Submit Issue'}
            </button>
            <Link to="/dashboard" className="btn-secondary">Cancel</Link>

            {/* Helper text if button disabled */}
            {!photoUploaded && (
              <span className="text-xs text-ink-500">
                ← Take and upload a photo to enable
              </span>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}

const Req      = () => <span className="text-red-400 ml-0.5">*</span>
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
)