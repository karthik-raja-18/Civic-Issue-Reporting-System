import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'
import { useAuth } from '../context/AuthContext'
import { timeAgo, STATUS_META, extractError } from '../utils/helpers'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED']

const ZONE_COLOR = {
  NORTH:   'text-blue-400   bg-blue-500/10   border-blue-500/30',
  SOUTH:   'text-amber-400  bg-amber-500/10  border-amber-500/30',
  EAST:    'text-purple-400 bg-purple-500/10 border-purple-500/30',
  WEST:    'text-orange-400 bg-orange-500/10 border-orange-500/30',
  CENTRAL: 'text-civic-400  bg-civic-500/10  border-civic-500/30',
}

export default function RegionalDashboard() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [issues,   setIssues]   = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [issuesRes, statsRes] = await Promise.all([
        api.get('/api/regional/issues'),
        api.get('/api/regional/dashboard/stats'),
      ])
      setIssues(issuesRes.data.data  || [])
      setStats(statsRes.data.data)
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
      await api.put(`/api/issues/${issueId}/status`, { status })
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i))
      setSuccess(`Issue #${issueId} → ${STATUS_META[status]?.label || status}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <Spinner center />

  const zoneClass = ZONE_COLOR[user?.zone] || 'text-white bg-ink-800 border-ink-700'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-wrapper">

      {/* ── Header — NO "Report Issue" button ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${zoneClass}`}>
            {user?.zone || 'ZONE'} ADMIN
          </span>
        </div>
        <h1 className="page-title">My Zone Dashboard</h1>
        {stats?.zoneDesc && (
          <p className="text-ink-400 text-sm mt-0.5">{stats.zoneDesc}</p>
        )}
        {/* ✅ No Report Issue button for regional admin */}
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-6">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',       value: stats.total,      color: 'text-white'     },
            { label: 'Pending',     value: stats.pending,    color: 'text-amber-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400'  },
            { label: 'Resolved',    value: stats.resolved,   color: 'text-civic-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card border-ink-700 text-center py-4">
              <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
              <div className="text-xs text-ink-500 mt-0.5 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Issues table */}
      {issues.length === 0 ? (
        <div className="text-center py-20 text-ink-400">
          No issues in your zone yet.
        </div>
      ) : (
        <div className="card border-ink-700 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/80">
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase">Issue</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase hidden md:table-cell">Reporter</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase hidden lg:table-cell">Reported</th>
                  <th className="text-right px-4 py-3 text-xs text-ink-500 uppercase">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800/60">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-ink-800/25 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">{issue.id}</td>

                    {/* Title + thumbnail */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        {/* ✅ Image thumbnail in table */}
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
                          <p className="text-ink-100 font-medium text-xs line-clamp-1">{issue.title}</p>
                          <p className="text-ink-500 text-xs">{issue.category}</p>
                        </div>
                      </div>
                    </td>

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
                            <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-ink-500 hidden lg:table-cell">
                      {timeAgo(issue.createdAt)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        className="btn-ghost text-xs py-1 px-2.5"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-ink-800 bg-ink-900/40
                          flex items-center justify-between text-xs text-ink-500">
            <span>{issues.length} issues in your zone</span>
            <button onClick={fetchData}
              className="text-civic-400 hover:text-civic-300 transition-colors">
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}