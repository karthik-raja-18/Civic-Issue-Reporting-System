import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { useAuth } from '../context/AuthContext'
import { formatDate, timeAgo, extractError } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

export default function IssueDetails() {
  const { id }   = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [issue,      setIssue]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [comment,    setComment]    = useState('')
  const [commenting, setCommenting] = useState(false)
  const [commentErr, setCommentErr] = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    fetchIssue()
  }, [id])

  async function fetchIssue() {
    setLoading(true)
    setError(null)
    try {
      const res = await issueApi.getById(id)
      setIssue(res.data.data)
    } catch {
      setError('Issue not found or failed to load.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setCommenting(true)
    setCommentErr(null)
    try {
      await issueApi.addComment(id, comment.trim())
      setComment('')
      await fetchIssue()
    } catch (err) {
      setCommentErr(extractError(err))
    } finally {
      setCommenting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue? This cannot be undone.')) return
    setDeleting(true)
    try {
      await issueApi.delete(id)
      navigate('/admin')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Spinner center />
  if (error)   return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <AlertMessage type="error" message={error} />
      <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">← Back</Link>
    </div>
  )
  if (!issue)  return null

  const isOwner = user?.userId === issue.createdBy?.id

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-wrapper">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-ink-400
                                       hover:text-white transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to issues
      </Link>

      {/* ── Issue header ── */}
      <div className="card border-ink-700 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={issue.status} />
              <span className="text-xs text-ink-500 font-mono">#{issue.id}</span>
              <span className="text-xs bg-ink-800 text-ink-400 px-2 py-0.5 rounded border border-ink-700">
                {issue.category}
              </span>
            </div>
            <h1 className="text-xl font-display font-bold text-white leading-snug">
              {issue.title}
            </h1>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to={`/admin?highlight=${issue.id}`} className="btn-secondary text-xs py-1.5 px-3">
                Manage
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger text-xs py-1.5 px-3"
              >
                {deleting ? <Spinner size="sm" /> : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <p className="text-ink-200 text-sm leading-relaxed mb-5">
          {issue.description}
        </p>

        {/* Image */}
        {issue.imageUrl && (
          <img
            src={issue.imageUrl}
            alt="Issue"
            className="w-full max-h-72 object-cover rounded-lg border border-ink-700 mb-5"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500 border-t border-ink-800 pt-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Reported by <span className="text-ink-300">{issue.createdBy?.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {formatDate(issue.createdAt)}
          </div>
          {issue.latitude && issue.longitude && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <a
                href={`https://maps.google.com/?q=${issue.latitude},${issue.longitude}`}
                target="_blank" rel="noopener noreferrer"
                className="text-civic-400 hover:underline"
              >
                {parseFloat(issue.latitude).toFixed(4)}, {parseFloat(issue.longitude).toFixed(4)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="card border-ink-700">
        <h2 className="section-title mb-4">
          Comments
          <span className="ml-2 text-sm font-mono text-ink-500">({issue.comments?.length || 0})</span>
        </h2>

        {/* Comment list */}
        <div className="space-y-3 mb-5">
          {(!issue.comments || issue.comments.length === 0) ? (
            <p className="text-ink-500 text-sm text-center py-6">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            issue.comments.map((c) => (
              <div key={c.id} className="flex gap-3 animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-ink-700 flex-shrink-0 flex items-center justify-center
                                text-xs text-ink-400 font-bold mt-0.5">
                  {c.userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 bg-ink-800/60 rounded-lg px-4 py-3 border border-ink-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-ink-200">{c.userName}</span>
                    <span className="text-xs text-ink-600">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink-300 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment form */}
        <form onSubmit={handleAddComment} className="border-t border-ink-800 pt-4">
          <AlertMessage type="error" message={commentErr} onDismiss={() => setCommentErr(null)} />
          <label className="label mt-3">Add a comment</label>
          <div className="flex gap-2">
            <textarea
              className="input flex-1 resize-none"
              placeholder="Share your thoughts or additional information…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              required
            />
            <button type="submit" disabled={commenting || !comment.trim()} className="btn-primary self-end flex-shrink-0">
              {commenting ? <Spinner size="sm" /> : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
