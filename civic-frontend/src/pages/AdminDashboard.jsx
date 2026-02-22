import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { timeAgo, extractError, STATUS_META } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED']

export default function AdminDashboard() {
  const [issues,    setIssues]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(null)
  const [updating,  setUpdating]  = useState(null)   // issue id being updated
  const [deleting,  setDeleting]  = useState(null)   // issue id being deleted
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchParams] = useSearchParams()
  const highlight = searchParams.get('highlight')

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    try {
      const res = await issueApi.getAll()
      setIssues(res.data.data || [])
    } catch {
      setError('Failed to load issues.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIssues() }, [fetchIssues])

  const handleStatusChange = async (issueId, status) => {
    setUpdating(issueId)
    setError(null)
    setSuccess(null)
    try {
      await issueApi.updateStatus(issueId, status)
      setIssues(prev =>
        prev.map(i => i.id === issueId ? { ...i, status } : i)
      )
      setSuccess(`Issue #${issueId} status updated to ${STATUS_META[status]?.label || status}.`)
      setTimeout(() => setSuccess(null), 3500)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (issueId, title) => {
    if (!window.confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) return
    setDeleting(issueId)
    setError(null)
    setSuccess(null)
    try {
      await issueApi.delete(issueId)
      setIssues(prev => prev.filter(i => i.id !== issueId))
      setSuccess(`Issue #${issueId} deleted successfully.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setDeleting(null)
    }
  }

  const visible = filterStatus === 'ALL'
    ? issues
    : issues.filter(i => i.status === filterStatus)

  // Summary counts
  const counts = {
    PENDING:     issues.filter(i => i.status === 'PENDING').length,
    IN_PROGRESS: issues.filter(i => i.status === 'IN_PROGRESS').length,
    RESOLVED:    issues.filter(i => i.status === 'RESOLVED').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-wrapper">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-admin">Admin</span>
          </div>
          <h1 className="page-title">Issue Management</h1>
          <p className="text-ink-400 text-sm mt-0.5">Review, update status, and moderate reported issues.</p>
        </div>
      </div>

      {/* ── Alerts ── */}
      <div className="space-y-2 mb-4">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* ── Status Quick Filters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'ALL',         label: 'All Issues',   count: issues.length,      activeColor: 'border-ink-400 bg-ink-800' },
          { key: 'PENDING',     label: 'Pending',      count: counts.PENDING,     activeColor: 'border-amber-500/50 bg-amber-500/10' },
          { key: 'IN_PROGRESS', label: 'In Progress',  count: counts.IN_PROGRESS, activeColor: 'border-blue-500/50 bg-blue-500/10'  },
          { key: 'RESOLVED',    label: 'Resolved',     count: counts.RESOLVED,    activeColor: 'border-civic-500/50 bg-civic-500/10' },
        ].map(({ key, label, count, activeColor }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`card text-left transition-all ${
              filterStatus === key
                ? `${activeColor} border-opacity-100`
                : 'hover:border-ink-600'
            }`}
          >
            <div className="text-xl font-display font-bold text-white">{count}</div>
            <div className="text-xs text-ink-400 mt-0.5 uppercase tracking-wider">{label}</div>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Spinner center />
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-ink-400">No issues found.</div>
      ) : (
        <div className="card border-ink-700 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/80">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Issue</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider hidden sm:table-cell">Reporter</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider hidden lg:table-cell">Reported</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/60">
                {visible.map((issue) => {
                  const isHighlighted = highlight && String(issue.id) === String(highlight)
                  return (
                    <tr
                      key={issue.id}
                      className={`transition-colors hover:bg-ink-800/40 ${
                        isHighlighted ? 'bg-civic-500/5 border-l-2 border-l-civic-500' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5 font-mono text-xs text-ink-500">{issue.id}</td>

                      {/* Title */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <Link
                          to={`/issues/${issue.id}`}
                          className="font-medium text-ink-100 hover:text-civic-400 transition-colors line-clamp-1"
                        >
                          {issue.title}
                        </Link>
                        <p className="text-xs text-ink-500 mt-0.5 line-clamp-1 md:hidden">{issue.category}</p>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-ink-400 hidden md:table-cell">
                        <span className="text-xs">{issue.category}</span>
                      </td>

                      {/* Reporter */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-ink-400">{issue.createdBy?.name}</span>
                      </td>

                      {/* Status — inline select */}
                      <td className="px-4 py-3.5">
                        {updating === issue.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <select
                            value={issue.status}
                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                            className="bg-ink-800 border border-ink-700 text-ink-200 text-xs rounded-lg
                                       px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-civic-500
                                       cursor-pointer"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs text-ink-500 hidden lg:table-cell">
                        {timeAgo(issue.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/issues/${issue.id}`}
                            className="btn-ghost text-xs py-1 px-2.5 text-ink-400"
                            title="View"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(issue.id, issue.title)}
                            disabled={deleting === issue.id}
                            className="btn-danger text-xs py-1 px-2.5"
                            title="Delete"
                          >
                            {deleting === issue.id ? <Spinner size="sm" /> : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-3 border-t border-ink-800 bg-ink-900/40 text-xs text-ink-500 flex justify-between">
            <span>Showing {visible.length} of {issues.length} issues</span>
            <button onClick={fetchIssues} className="text-civic-400 hover:text-civic-300 transition-colors">
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
