import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { useAuth } from '../context/AuthContext'
import IssueCard from '../components/IssueCard'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'
import StatusBadge from '../components/StatusBadge'

const FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED']

export default function Dashboard() {
  const { user } = useAuth()
  const [issues,  setIssues]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('ALL')
  const [tab,     setTab]     = useState('all')  // 'all' | 'mine'
  const [search,  setSearch]  = useState('')

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = tab === 'mine'
        ? await issueApi.getMine()
        : await issueApi.getAll()
      setIssues(res.data.data || [])
    } catch {
      setError('Failed to load issues. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchIssues() }, [fetchIssues])

  // Filtered + searched list
  const visible = issues.filter((i) => {
    const matchStatus = filter === 'ALL' || i.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      i.title.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  // Stats
  const stats = {
    total:      issues.length,
    pending:    issues.filter(i => i.status === 'PENDING').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved:   issues.filter(i => i.status === 'RESOLVED').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 page-wrapper">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            {tab === 'mine' ? 'My Issues' : 'Community Issues'}
          </h1>
          <p className="text-ink-400 text-sm mt-0.5">
            Welcome back, <span className="text-civic-400">{user?.name}</span>
          </p>
        </div>
        <Link to="/issues/new" className="btn-primary flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Report Issue
        </Link>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',       value: stats.total,      color: 'text-white'       },
          { label: 'Pending',     value: stats.pending,    color: 'text-amber-400'   },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400'    },
          { label: 'Resolved',    value: stats.resolved,   color: 'text-civic-400'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
            <div className="text-xs text-ink-500 mt-0.5 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search + Filter ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        {/* Tabs */}
        <div className="flex bg-ink-900 border border-ink-800 rounded-lg p-0.5 gap-0.5">
          {[['all', 'All Issues'], ['mine', 'My Issues']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === val
                  ? 'bg-civic-500 text-white shadow-sm'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="input pl-8 py-2 text-sm"
            placeholder="Search issues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filter === f
                  ? 'bg-civic-500/20 text-civic-400 border-civic-500/40'
                  : 'text-ink-400 border-ink-700 hover:border-ink-500 hover:text-ink-200'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'IN_PROGRESS' ? 'In Progress' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <Spinner center />
      ) : error ? (
        <AlertMessage type="error" message={error} />
      ) : visible.length === 0 ? (
        <EmptyState search={search} filter={filter} tab={tab} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ search, filter, tab }) {
  return (
    <div className="text-center py-20 animate-fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-800 mb-4">
        <svg className="w-7 h-7 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p className="text-ink-300 font-medium">
        {search ? `No issues match "${search}"` :
         filter !== 'ALL' ? `No ${filter.toLowerCase()} issues` :
         tab === 'mine' ? "You haven't reported any issues yet" :
         'No issues reported yet'}
      </p>
      <p className="text-ink-500 text-sm mt-1">
        {tab === 'mine' && !search && filter === 'ALL' && 'Be the first to report a civic issue!'}
      </p>
      {tab === 'mine' && (
        <Link to="/issues/new" className="btn-primary mt-4 inline-flex">Report an issue</Link>
      )}
    </div>
  )
}
