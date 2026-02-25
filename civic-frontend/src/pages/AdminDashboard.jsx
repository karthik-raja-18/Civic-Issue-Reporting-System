import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [issues,   setIssues]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  useEffect(() => { fetchIssues() }, [])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await issueApi.getAll()
      setIssues(res.data.data || [])
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (issueId, status) => {
    setUpdating(issueId)
    setError(null)
    try {
      await issueApi.updateStatus(issueId, status)
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i))
      setSuccess(`Issue #${issueId} updated to ${STATUS_META[status]?.label || status}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (issueId) => {
    if (!window.confirm(`Delete issue #${issueId}? This cannot be undone.`)) return
    setDeleting(issueId)
    try {
      await issueApi.delete(issueId)
      setIssues(prev => prev.filter(i => i.id !== issueId))
      setSuccess(`Issue #${issueId} deleted.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setDeleting(null)
    }
  }

  // Stats
  const total      = issues.length
  const pending    = issues.filter(i => i.status === 'PENDING').length
  const inProgress = issues.filter(i => i.status === 'IN_PROGRESS').length
  const resolved   = issues.filter(i => i.status === 'RESOLVED').length

  if (loading) return <Spinner center />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-wrapper">

      {/* ── Header — NO "Report Issue" button here ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-admin">Admin</span>
          </div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-ink-400 text-sm mt-0.5">
            Manage all reported issues across Coimbatore District.
          </p>
        </div>
        {/* ✅ No Report Issue button for admin */}
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-6">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',       value: total,      color: 'text-white'     },
          { label: 'Pending',     value: pending,    color: 'text-amber-400' },
          { label: 'In Progress', value: inProgress, color: 'text-blue-400'  },
          { label: 'Resolved',    value: resolved,   color: 'text-civic-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card border-ink-700 text-center py-4">
            <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
            <div className="text-xs text-ink-500 mt-0.5 uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {/* Issues table */}
      {issues.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          No issues reported yet.
        </div>
      ) : (
        <div className="card border-ink-700 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/80">
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase tracking-wide">Issue</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase tracking-wide hidden lg:table-cell">Zone</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase tracking-wide hidden md:table-cell">Reporter</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase tracking-wide hidden xl:table-cell">Reported</th>
                  <th className="text-right px-4 py-3 text-xs text-ink-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/60">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-ink-800/25 transition-colors">

                    {/* ID */}
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">
                      {issue.id}
                    </td>

                    {/* Title + thumbnail */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        {/* ✅ Image thumbnail */}
                        {issue.imageUrl ? (
                          <img
                            src={issue.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0
                                       border border-ink-700 cursor-pointer"
                            onClick={() => navigate(`/issues/${issue.id}`)}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-ink-800 border border-ink-700
                                          flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-ink-600" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-ink-100 font-medium text-xs line-clamp-1">
                            {issue.title}
                          </p>
                          <p className="text-ink-500 text-xs">{issue.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* Zone */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {issue.zone && issue.zone !== 'UNASSIGNED' ? (
                        <span className={`text-xs font-mono font-bold ${ZONE_COLORS[issue.zone] || 'text-ink-500'}`}>
                          {issue.zone}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-600">—</span>
                      )}
                    </td>

                    {/* Reporter */}
                    <td className="px-4 py-3 text-xs text-ink-400 hidden md:table-cell">
                      {issue.createdBy?.name}
                    </td>

                    {/* Status dropdown */}
                    <td className="px-4 py-3">
                      {updating === issue.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <select
                          value={issue.status}
                          onChange={e => handleStatusChange(issue.id, e.target.value)}
                          className="bg-ink-800 border border-ink-700 text-ink-200 text-xs
                                     rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1
                                     focus:ring-civic-500 cursor-pointer"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>
                              {STATUS_META[s]?.label || s}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Reported time */}
                    <td className="px-4 py-3 text-xs text-ink-500 hidden xl:table-cell">
                      {timeAgo(issue.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/issues/${issue.id}`)}
                          className="btn-ghost text-xs py-1 px-2.5"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(issue.id)}
                          disabled={deleting === issue.id}
                          className="btn-ghost text-xs py-1 px-2.5 text-red-400
                                     hover:text-red-300 hover:bg-red-500/10"
                        >
                          {deleting === issue.id ? <Spinner size="sm" /> : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-ink-800 bg-ink-900/40
                          flex items-center justify-between text-xs text-ink-500">
            <span>{issues.length} total issues</span>
            <button onClick={fetchIssues}
              className="text-civic-400 hover:text-civic-300 transition-colors">
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}