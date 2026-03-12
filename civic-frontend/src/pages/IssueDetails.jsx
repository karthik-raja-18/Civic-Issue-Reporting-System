import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { useAuth } from '../context/AuthContext'
import { timeAgo, STATUS_META, extractError } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const ZONE_COLORS = {
  NORTH: 'text-blue-400', SOUTH: 'text-amber-400',
  EAST:  'text-purple-400', WEST: 'text-orange-400', CENTRAL: 'text-civic-400',
}

// Status colors for timeline
const STATUS_STEPS = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const STATUS_LABEL = {
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Awaiting Confirmation',
  CLOSED:      'Closed',
  REOPENED:    'Reopened',
}

export default function IssueDetails() {
  const { id }            = useParams()
  const { user, isAdmin } = useAuth()

  const [issue,      setIssue]      = useState(null)
  const [comment,    setComment]    = useState('')
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)
  const [success,    setSuccess]    = useState(null)
  const [imgOpen,    setImgOpen]    = useState(null)  // 'before' | 'after' | null

  // ── Resolve modal (admin side) ─────────────────────────────────
  const [resolveModal,   setResolveModal]   = useState(false)
  const [resolvedFile,   setResolvedFile]   = useState(null)
  const [resolvedPreview,setResolvedPreview]= useState(null)
  const [uploading,      setUploading]      = useState(false)
  const [resolving,      setResolving]      = useState(false)
  const fileInputRef = useRef(null)

  // ── Reopen note (reporter side) ────────────────────────────────
  const [showReopenNote, setShowReopenNote] = useState(false)
  const [reopenNote,     setReopenNote]     = useState('')
  const [actioning,      setActioning]      = useState(false)

  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN'
  const canModerate     = isAdmin || isRegionalAdmin
  const isOwnIssue      = issue?.createdBy?.email === user?.email

  useEffect(() => {
    issueApi.getById(id)
      .then(res => setIssue(res.data.data))
      .catch(() => setError('Issue not found.'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Admin: pick resolved photo file ───────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResolvedFile(file)
    setResolvedPreview(URL.createObjectURL(file))
  }

  // ── Admin: upload resolved photo + mark resolved ───────────────
  const handleResolve = async () => {
    if (!resolvedFile) {
      setError('Please select a proof photo.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      // Upload to Cloudinary via backend proxy
      const uploadData = await issueApi.uploadImageDirect(
        resolvedFile,
        issue.latitude,
        issue.longitude,
        new Date().toISOString()
      )
      setUploading(false)
      setResolving(true)
      // Mark issue as resolved with proof URL and public ID
      const res = await issueApi.resolve(id, uploadData.imageUrl, uploadData.publicId)
      setIssue(res.data.data)
      setResolveModal(false)
      setResolvedFile(null)
      setResolvedPreview(null)
      setSuccess('Issue marked as resolved. Reporter has been notified.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUploading(false)
      setResolving(false)
    }
  }

  // ── Reporter: confirm fix ──────────────────────────────────────
  const handleConfirm = async () => {
    setActioning(true)
    setError(null)
    try {
      const res = await issueApi.confirmResolution(id)
      setIssue(res.data.data)
      setSuccess('Thank you! Issue has been closed successfully. ✅')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setActioning(false)
    }
  }

  // ── Reporter: reopen ───────────────────────────────────────────
  const handleReopen = async () => {
    setActioning(true)
    setError(null)
    try {
      const res = await issueApi.reopen(id, reopenNote)
      setIssue(res.data.data)
      setShowReopenNote(false)
      setReopenNote('')
      setSuccess('Issue reopened. The zone admin has been notified.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setActioning(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const res = await issueApi.addComment(id, comment)
      setIssue(prev => ({ ...prev, comments: [...(prev.comments || []), res.data.data] }))
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
      <Link to="/dashboard" className="btn-primary mt-4 inline-flex">Back</Link>
    </div>
  )

  const isResolved = issue.status === 'RESOLVED'
  const isClosed   = issue.status === 'CLOSED'
  const isReopened = issue.status === 'REOPENED'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-wrapper">

      <Link to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400
                   hover:text-white transition-colors mb-6">
        <BackIcon /> Back to dashboard
      </Link>

      <div className="space-y-3 mb-4">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* ── CLOSED banner ── */}
      {isClosed && (
        <div className="mb-5 rounded-xl border border-civic-500/30 bg-civic-500/10 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-civic-400 font-semibold text-sm">Issue Successfully Closed</p>
              <p className="text-ink-400 text-xs mt-0.5">Reporter confirmed the fix. This issue is fully resolved.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── REOPENED banner ── */}
      {isReopened && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⚠️</span>
            <p className="text-amber-400 font-semibold text-sm">Issue Reopened — Work Needed Again</p>
          </div>
          {issue.reopenNote && (
            <p className="text-amber-300 text-sm ml-8">
              Reporter's note: "{issue.reopenNote}"
            </p>
          )}
        </div>
      )}

      {/* ── Main Card ── */}
      <div className="card border-ink-700 mb-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge badge-user text-xs">{issue.category}</span>
              <StatusBadge status={issue.status} />
              {issue.zone && issue.zone !== 'UNASSIGNED' && (
                <span className={`text-xs font-mono font-bold ${ZONE_COLORS[issue.zone] || ''}`}>
                  {issue.zone} ZONE
                </span>
              )}
            </div>
            <h1 className="text-xl font-display font-bold text-white">{issue.title}</h1>
          </div>
          <span className="text-xs text-ink-500">#{issue.id}</span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400 mb-4">
          <span>👤 {issue.createdBy?.name}</span>
          <span>🕒 {timeAgo(issue.createdAt)}</span>
          {issue.assignedTo && (
            <span className="text-civic-400">📌 {issue.assignedTo.name}</span>
          )}
        </div>

        {/* ── Before / After Photos ── */}
        <div className={`mb-4 grid gap-3 ${issue.resolvedImageUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>

          {/* Before photo */}
          {issue.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-ink-700">
              <div className="bg-ink-800 px-3 py-2 text-xs font-medium text-ink-400
                              flex items-center justify-between border-b border-ink-700">
                <span>📸 {issue.resolvedImageUrl ? 'Before (Issue)' : 'Evidence Photo'}</span>
                <button onClick={() => setImgOpen('before')}
                  className="text-civic-400 hover:text-civic-300 text-xs">Expand</button>
              </div>
              <img src={issue.imageUrl} alt="Issue evidence"
                className="w-full object-cover cursor-pointer"
                style={{ maxHeight: issue.resolvedImageUrl ? '160px' : '280px' }}
                onClick={() => setImgOpen('before')}
                onError={(e) => e.target.parentElement.style.display = 'none'} />
            </div>
          )}

          {/* After photo — proof of resolution */}
          {issue.resolvedImageUrl && (
            <div className="rounded-xl overflow-hidden border border-civic-500/40">
              <div className="bg-civic-500/10 px-3 py-2 text-xs font-medium text-civic-400
                              flex items-center justify-between border-b border-civic-500/20">
                <span>✅ After (Fixed)</span>
                <button onClick={() => setImgOpen('after')}
                  className="text-civic-400 hover:text-civic-300 text-xs">Expand</button>
              </div>
              <img src={issue.resolvedImageUrl} alt="Resolved proof"
                className="w-full object-cover cursor-pointer"
                style={{ maxHeight: '160px' }}
                onClick={() => setImgOpen('after')}
                onError={(e) => e.target.parentElement.style.display = 'none'} />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-ink-800/50 rounded-xl p-4 mb-4">
          <p className="text-ink-200 text-sm leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        {/* ── ADMIN ACTIONS ── */}
        {canModerate && !isClosed && (
          <div className="border-t border-ink-800 pt-4 space-y-3">

            {/* Mark IN_PROGRESS button (if PENDING or REOPENED) */}
            {(issue.status === 'PENDING' || issue.status === 'REOPENED') && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await issueApi.updateStatus(id, 'IN_PROGRESS')
                      setIssue(res.data.data)
                    } catch (err) { setError(extractError(err)) }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border
                             bg-blue-500/10 border-blue-500/30 text-blue-400
                             hover:bg-blue-500/20 transition-all"
                >
                  🔧 Start Working (Mark In Progress)
                </button>
              </div>
            )}

            {/* Mark as Resolved button (if IN_PROGRESS or REOPENED) */}
            {(issue.status === 'IN_PROGRESS' || issue.status === 'REOPENED') && (
              <div>
                <button
                  onClick={() => setResolveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                             font-semibold bg-civic-500/15 border border-civic-500/30
                             text-civic-400 hover:bg-civic-500/25 transition-all"
                >
                  ✅ Mark as Resolved
                </button>
                <p className="text-xs text-ink-500 mt-1">
                  You'll need to upload a proof photo of the fix.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTER ACTIONS — shown only when status = RESOLVED ── */}
        {isOwnIssue && isResolved && (
          <div className="border-t border-ink-800 pt-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-400 font-semibold text-sm mb-1">
                🔔 Admin has marked this as resolved
              </p>
              <p className="text-ink-300 text-sm mb-4">
                Please check the proof photo above and confirm if the issue is genuinely fixed.
              </p>

              {!showReopenNote ? (
                <div className="flex gap-3">
                  {/* Confirm resolved */}
                  <button onClick={handleConfirm} disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                               font-semibold bg-civic-500/20 border border-civic-500/40
                               text-civic-400 hover:bg-civic-500/30 transition-all
                               disabled:opacity-50">
                    {actioning ? <Spinner size="sm" /> : '✅'} Yes, It's Fixed
                  </button>
                  {/* Not fixed */}
                  <button onClick={() => setShowReopenNote(true)} disabled={actioning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                               font-semibold bg-red-500/10 border border-red-500/25
                               text-red-400 hover:bg-red-500/20 transition-all
                               disabled:opacity-50">
                    ❌ Not Yet Fixed
                  </button>
                </div>
              ) : (
                /* Reopen note input */
                <div className="space-y-3">
                  <textarea
                    className="input w-full text-sm min-h-[80px] resize-none"
                    placeholder="Optional: describe what's still wrong... (e.g. 'The pothole is still there on the left side')"
                    value={reopenNote}
                    onChange={e => setReopenNote(e.target.value)}
                    maxLength={300}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleReopen} disabled={actioning}
                      className="btn-primary gap-2 text-sm">
                      {actioning ? <><Spinner size="sm" /> Sending…</> : '⚠️ Report Not Fixed'}
                    </button>
                    <button onClick={() => { setShowReopenNote(false); setReopenNote('') }}
                      className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="card border-ink-700">
        <h2 className="section-title mb-4">Comments ({issue.comments?.length || 0})</h2>
        <div className="space-y-3 mb-5">
          {(issue.comments || []).length === 0
            ? <p className="text-ink-500 text-sm">No comments yet.</p>
            : issue.comments.map(c => (
              <div key={c.id} className="flex gap-3 bg-ink-800/40 rounded-xl p-3">
                <div className="w-7 h-7 rounded-full bg-civic-700 flex items-center justify-center
                                text-white text-xs font-bold flex-shrink-0">
                  {c.userName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-ink-200">{c.userName}</span>
                    <span className="text-xs text-ink-500">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-300">{c.text}</p>
                </div>
              </div>
            ))
          }
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input type="text" className="input flex-1 text-sm"
            placeholder="Add a comment…" value={comment}
            onChange={e => setComment(e.target.value)} maxLength={500} />
          <button type="submit" className="btn-primary px-4"
            disabled={submitting || !comment.trim()}>
            {submitting ? <Spinner size="sm" /> : 'Post'}
          </button>
        </form>
      </div>

      {/* ── RESOLVE MODAL (Admin uploads proof photo) ── */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => { setResolveModal(false); setResolvedFile(null); setResolvedPreview(null) }}>
          <div className="bg-ink-900 border border-ink-700 rounded-2xl p-6 max-w-md w-full
                          shadow-2xl" onClick={e => e.stopPropagation()}>

            <h3 className="font-display font-bold text-white text-lg mb-1">
              Mark Issue as Resolved
            </h3>
            <p className="text-ink-400 text-sm mb-5">
              Upload a proof photo showing the issue has been fixed.
              The reporter will verify and confirm.
            </p>

            {/* Photo picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed cursor-pointer transition-all
                          flex flex-col items-center justify-center
                          ${resolvedPreview
                            ? 'border-civic-500/40 p-0 overflow-hidden'
                            : 'border-ink-600 hover:border-civic-500/50 p-8'}`}
            >
              {resolvedPreview ? (
                <div className="relative w-full">
                  <img src={resolvedPreview} alt="Proof preview"
                    className="w-full max-h-52 object-cover rounded-xl" />
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white
                                  text-xs px-2 py-1 rounded-lg">
                    Click to change
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-ink-800 flex items-center justify-center mb-3">
                    <CamIcon className="w-6 h-6 text-ink-400" />
                  </div>
                  <p className="text-ink-300 text-sm font-medium">Click to upload proof photo</p>
                  <p className="text-ink-500 text-xs mt-1">Take a photo or choose from gallery</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleResolve}
                disabled={!resolvedFile || uploading || resolving}
                className="btn-primary flex-1 justify-center gap-2">
                {uploading
                  ? <><Spinner size="sm" /> Uploading photo…</>
                  : resolving
                    ? <><Spinner size="sm" /> Saving…</>
                    : '✅ Confirm Resolved'}
              </button>
              <button
                onClick={() => { setResolveModal(false); setResolvedFile(null); setResolvedPreview(null) }}
                className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen image modal */}
      {imgOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImgOpen(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setImgOpen(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60
                         text-white flex items-center justify-center hover:bg-black/80">
              ✕
            </button>
            <div className="text-center mb-2">
              <span className="text-xs text-ink-400 bg-black/40 px-3 py-1 rounded-full">
                {imgOpen === 'before' ? '📸 Evidence Photo (Before)' : '✅ Proof Photo (After Fix)'}
              </span>
            </div>
            <img
              src={imgOpen === 'before' ? issue.imageUrl : issue.resolvedImageUrl}
              alt={imgOpen === 'before' ? 'Evidence' : 'Resolved proof'}
              className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const CamIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
