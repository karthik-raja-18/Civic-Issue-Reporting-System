import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { useAuth } from '../context/AuthContext'
import { timeAgo, STATUS_META, extractError } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED']

const ZONE_COLORS = {
  NORTH:   'text-blue-400',
  SOUTH:   'text-amber-400',
  EAST:    'text-purple-400',
  WEST:    'text-orange-400',
  CENTRAL: 'text-civic-400',
}

export default function IssueDetails() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user, isAdmin } = useAuth()

  const [issue,     setIssue]     = useState(null)
  const [comment,   setComment]   = useState('')
  const [loading,   setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updating,  setUpdating]  = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(null)
  const [imgOpen,   setImgOpen]   = useState(false)  // full-screen image modal

  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN'
  const canUpdateStatus = isAdmin || isRegionalAdmin

  useEffect(() => {
    issueApi.getById(id)
      .then(res => setIssue(res.data.data))
      .catch(() => setError('Issue not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (status) => {
    setUpdating(true)
    setError(null)
    try {
      const res = await issueApi.updateStatus(id, status)
      setIssue(prev => ({ ...prev, status: res.data.data.status }))
      setSuccess('Status updated successfully.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await issueApi.addComment(id, comment)
      setIssue(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.data.data],
      }))
      setComment('')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner center />
  if (!issue)  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-ink-400">Issue not found.</p>
      <Link to="/dashboard" className="btn-primary mt-4 inline-flex">Back to Dashboard</Link>
    </div>
  )

  const meta = STATUS_META[issue.status] || {}

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-wrapper">

      {/* Back */}
      <Link to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400
                   hover:text-white transition-colors mb-6">
        <BackIcon /> Back to dashboard
      </Link>

      <div className="space-y-4">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* ── Main Card ── */}
      <div className="card border-ink-700 mb-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge badge-user text-xs">{issue.category}</span>
              <StatusBadge status={issue.status} />
              {issue.zone && issue.zone !== 'UNASSIGNED' && (
                <span className={`text-xs font-mono font-bold ${ZONE_COLORS[issue.zone] || 'text-ink-400'}`}>
                  {issue.zone} ZONE
                </span>
              )}
            </div>
            <h1 className="text-xl font-display font-bold text-white leading-snug">
              {issue.title}
            </h1>
          </div>
          <span className="text-xs text-ink-500 flex-shrink-0"># {issue.id}</span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400 mb-4">
          <span>👤 {issue.createdBy?.name}</span>
          <span>🕒 {timeAgo(issue.createdAt)}</span>
          {issue.assignedTo && (
            <span className="text-civic-400">
              📌 Assigned to: {issue.assignedTo?.name || 'Zone Admin'}
            </span>
          )}
          {issue.latitude && issue.longitude && (
            <span>
              📍 {parseFloat(issue.latitude).toFixed(4)}, {parseFloat(issue.longitude).toFixed(4)}
            </span>
          )}
        </div>

        {/* ✅ Evidence Image — shown prominently, visible to ALL users */}
        {issue.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border border-ink-700">
            <div className="bg-ink-800 px-4 py-2 text-xs text-ink-400 font-medium
                            flex items-center justify-between border-b border-ink-700">
              <span>📸 Evidence Photo</span>
              <button
                onClick={() => setImgOpen(true)}
                className="text-civic-400 hover:text-civic-300 flex items-center gap-1"
              >
                <ExpandIcon /> View Full
              </button>
            </div>
            {/* Clickable image */}
            <img
              src={issue.imageUrl}
              alt="Issue evidence"
              className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => setImgOpen(true)}
              onError={(e) => {
                e.target.parentElement.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* No image placeholder */}
        {!issue.imageUrl && (
          <div className="mb-4 rounded-xl border border-dashed border-ink-700
                          bg-ink-800/30 flex items-center justify-center h-24">
            <p className="text-ink-600 text-xs">No evidence photo attached</p>
          </div>
        )}

        {/* Description */}
        <div className="bg-ink-800/50 rounded-xl p-4 mb-4">
          <p className="text-ink-200 text-sm leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        {/* ── Status Update (Admin / Regional Admin only) ── */}
        {canUpdateStatus && (
          <div className="border-t border-ink-800 pt-4">
            <label className="label">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => {
                const m = STATUS_META[s] || {}
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updating || issue.status === s}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all
                      ${issue.status === s
                        ? 'bg-civic-500/20 border-civic-500/40 text-civic-400 cursor-default'
                        : 'bg-ink-800 border-ink-700 text-ink-300 hover:border-ink-500'}`}
                  >
                    {updating && issue.status !== s ? <Spinner size="sm" /> : (m.label || s)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Comments ── */}
      <div className="card border-ink-700">
        <h2 className="section-title mb-4">
          Comments ({issue.comments?.length || 0})
        </h2>

        <div className="space-y-3 mb-5">
          {(issue.comments || []).length === 0 ? (
            <p className="text-ink-500 text-sm">No comments yet. Be the first to comment.</p>
          ) : (
            issue.comments.map(c => (
              <div key={c.id}
                className="flex gap-3 bg-ink-800/40 rounded-xl p-3">
                <div className="w-7 h-7 rounded-full bg-civic-700 flex items-center justify-center
                                text-white text-xs font-bold flex-shrink-0">
                  {c.userName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-ink-200">{c.userName}</span>
                    <span className="text-xs text-ink-500">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-300">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            className="input flex-1 text-sm"
            placeholder="Add a comment…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
          />
          <button type="submit" className="btn-primary px-4" disabled={submitting || !comment.trim()}>
            {submitting ? <Spinner size="sm" /> : 'Post'}
          </button>
        </form>
      </div>

      {/* ── Full-screen image modal ── */}
      {imgOpen && issue.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImgOpen(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setImgOpen(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60
                         text-white flex items-center justify-center hover:bg-black/80"
            >
              ✕
            </button>
            <img
              src={issue.imageUrl}
              alt="Full evidence"
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}

const BackIcon   = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ExpandIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
  </svg>
)