import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosConfig'
import { useAuth } from '../context/AuthContext'
import { timeAgo, extractError } from '../utils/helpers'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'
import StatusBadge from '../components/StatusBadge'

const STATUSES = ['PENDING', 'IN_PROGRESS']

const ZONE_COLOR = {
  NORTH:   'text-blue-500 bg-blue-500/5 min-w-[120px]',
  SOUTH:   'text-amber-500 bg-amber-500/5 min-w-[120px]',
  EAST:    'text-purple-500 bg-purple-500/5 min-w-[120px]',
  WEST:    'text-orange-500 bg-orange-500/5 min-w-[120px]',
  CENTRAL: 'text-brand-blue bg-brand-blue/5 min-w-[120px]',
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
      setSuccess(`Incident #${issueId} status successfully transitioned to ${status}.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <Spinner size="lg" />
       <p className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.4em] animate-pulse">Connecting to Region...</p>
    </div>
  )

  const zoneClass = ZONE_COLOR[user?.zone] || 'text-light-primary bg-light-bg border-light-border'

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16 animate-fade">

      {/* ── Operational Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 border-b border-light-border dark:border-dark-border pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-lg shadow-brand-blue/10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
             </div>
             <div>
                <h1 className="text-4xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight leading-tight">
                  Regional Dashboard
                </h1>
                <div className="flex items-center gap-3 mt-1">
                   <span className={`h-6 flex items-center justify-center border rounded-full px-3 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm ${zoneClass}`}>
                     {user?.zone || 'Global'} Command
                   </span>
                   <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] opacity-60">Regional Jurisdiction Level</p>
                </div>
             </div>
          </div>
        </div>
        
        <button onClick={fetchData} className="btn btn-secondary h-12 px-6 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border-light-border dark:border-dark-border">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
           Refresh Issues
        </button>
      </div>

      <div className="space-y-4 mb-10">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* Localized Intelligence Matrix */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Zone Issues', value: stats.total,      color: 'text-light-primary dark:text-dark-primary' },
            { label: 'Pending', value: stats.pending,    color: 'text-brand-saffron' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-gov-info' },
            { label: 'Resolved', value: stats.resolved,   color: 'text-gov-success' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-8 shadow-sm group hover:border-brand-blue/30 transition-all">
              <div className={`text-5xl font-display font-black mb-2 transition-transform group-hover:scale-105 ${color}`}>
                 {value.toString().padStart(2, '0')}
              </div>
              <div className="text-[11px] font-black text-light-primary dark:text-dark-primary uppercase tracking-[0.2em]">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Case Logs Registry */}
      {issues.length === 0 ? (
        <div className="text-center py-32 bg-light-surface dark:bg-dark-surface border-2 border-dashed border-light-border dark:border-dark-border rounded-[2.5rem]">
           <svg className="w-16 h-16 text-light-muted opacity-20 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           <h3 className="text-xl font-display font-black text-light-primary dark:text-dark-primary mb-2 tracking-tight">No Regional Issues</h3>
           <p className="text-light-muted font-bold text-[12px] uppercase tracking-[0.2em]">No issues reported in your zone yet.</p>
        </div>
      ) : (
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
                  <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em]">ID</th>
                  <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em]">Issue Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em] hidden md:table-cell">Reporter</th>
                  <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em] hidden lg:table-cell">Time</th>
                  <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/40 dark:divide-dark-border/40">
                {issues.map((issue) => (
                  <tr key={issue.id} className="group hover:bg-light-bg/30 dark:hover:bg-dark-bg/30 transition-colors">
                    <td className="px-8 py-6 font-mono text-[11px] font-black text-light-muted">#{issue.id.toString().slice(-6)}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        {issue.imageUrl ? (
                           <div className="relative group/img cursor-pointer" onClick={() => navigate(`/issues/${issue.id}`)}>
                              <img src={issue.imageUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border border-light-border shadow-sm group-hover/img:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-brand-blue/20 opacity-0 group-hover/img:opacity-100 rounded-2xl transition-opacity flex items-center justify-center">
                                 <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                              </div>
                           </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-light-bg flex items-center justify-center text-light-muted/30 border border-light-border shadow-inner">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-light-primary dark:text-dark-primary font-black text-[16px] tracking-tight truncate group-hover:text-brand-blue transition-colors">
                            {issue.title}
                          </p>
                          <p className="text-[10px] font-black text-light-muted uppercase tracking-[0.1em] mt-1">{issue.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                       <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-light-primary dark:text-dark-primary">{issue.createdBy?.name}</span>
                          <span className="text-[10px] text-light-muted font-black uppercase tracking-widest opacity-60">Citizen Witness</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                         <StatusBadge status={issue.status} />
                         {updating !== issue.id && (
                           <select
                             value={issue.status}
                             onChange={e => handleStatusChange(issue.id, e.target.value)}
                             className="h-10 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-[10px] font-black uppercase tracking-widest px-3 rounded-xl focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all cursor-pointer"
                           >
                             {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                           </select>
                         )}
                         {updating === issue.id && <Spinner size="sm" />}
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                      <div className="flex flex-col">
                         <span className="text-[13px] font-black text-light-primary dark:text-dark-primary">{timeAgo(issue.createdAt)}</span>
                         <span className="text-[9px] text-light-muted font-black uppercase tracking-[0.2em] mt-1">Reported</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => navigate(`/issues/${issue.id}`)} className="p-3 rounded-2xl border border-light-border dark:border-dark-border text-brand-blue hover:bg-brand-blue/5 transition-all group-hover:scale-110 shadow-sm" title="View Details">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.323 8.192 7.272 5 12 5c4.728 0 8.677 3.192 9.964 6.678.045.12.045.261 0 .381C20.677 15.808 16.728 19 12 19c-4.728 0-8.677-3.192-9.964-6.678z" /><circle cx="12" cy="12" r="3" strokeWidth="2.5" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 border-t border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 flex items-center justify-between text-[11px] font-bold text-light-muted uppercase tracking-widest">
            <span>Resolution Tracking — {issues.length} active issues</span>
            <p className="text-[10px] opacity-40">System Pulse: Nominal</p>
          </div>
        </div>
      )}
    </div>
  )
}