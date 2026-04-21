import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { timeAgo, extractError } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const ZONE_COLORS = {
  NORTH:   'text-blue-500',
  SOUTH:   'text-amber-500',
  EAST:    'text-purple-500',
  WEST:    'text-orange-500',
  CENTRAL: 'text-brand-blue',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [issues,   setIssues]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(null)
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
      setSuccess(`Case #${issueId} status successfully updated to ${status}.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(null)
    }
  }

  const isSlaBreached = (issue) => {
    if (!issue.createdAt) return false
    const createdDate = new Date(issue.createdAt)
    const completionDate = issue.resolvedAt ? new Date(issue.resolvedAt) : 
                          issue.closedAt ? new Date(issue.closedAt) : new Date()
    
    const diff = completionDate.getTime() - createdDate.getTime()
    return diff > (3 * 24 * 60 * 60 * 1000)
  }

  const total      = issues.length
  const pending    = issues.filter(i => i.status === 'PENDING').length
  const inProgress = issues.filter(i => i.status === 'IN_PROGRESS').length
  const resolved   = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <Spinner size="lg" />
       <p className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.4em] animate-pulse">Syncing District Master Registry...</p>
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-16 animate-fade">

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 border-b border-light-border dark:border-dark-border pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-gov-danger/10 text-gov-danger flex items-center justify-center shadow-lg shadow-gov-danger/10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
             </div>
             <div>
                 <h1 className="text-4xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight leading-tight">
                    Admin Panel
                 </h1>
                 <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-danger animate-pulse" />
                    District Management Console
                 </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={fetchIssues} className="btn btn-secondary h-12 px-6 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border-light-border dark:border-dark-border">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
               Refresh Issues
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total Issues', value: total,      color: 'text-light-primary dark:text-dark-primary', sub: 'All Reports' },
          { label: 'Pending', value: pending,    color: 'text-brand-saffron', sub: 'Awaiting Action' },
          { label: 'In Progress', value: inProgress, color: 'text-gov-info', sub: 'Active Resolution' },
          { label: 'Resolved/Closed', value: resolved,   color: 'text-gov-success', sub: 'Completed' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-8 shadow-sm transition-all hover:shadow-md group">
            <div className={`text-4xl font-display font-black mb-1 transition-transform group-hover:scale-105 ${color}`}>
               {value.toString().padStart(2, '0')}
            </div>
            <div className="text-[11px] font-black text-light-primary dark:text-dark-primary uppercase tracking-[0.1em] mb-1">{label}</div>
            <div className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] opacity-60">{sub}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4 mb-8">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Priority</th>
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Issue Detail</th>
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Reporter</th>
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] hidden lg:table-cell">Zone</th>
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Status</th>
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] hidden md:table-cell">Performance</th>
                   <th className="px-6 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/50 dark:divide-dark-border/50">
                {issues.map((issue) => {
                  const breached = isSlaBreached(issue)
                  const isFinished = issue.status === 'RESOLVED' || issue.status === 'CLOSED'
                  
                  return (
                    <tr key={issue.id} className={`group hover:bg-light-bg/30 dark:hover:bg-dark-bg/30 transition-colors ${breached ? 'bg-red-500/5' : ''}`}>
                      <td className="px-6 py-6">
                         <span className={`text-lg font-display font-black ${issue.priorityScore > 75 ? 'text-gov-danger' : issue.priorityScore > 40 ? 'text-brand-saffron' : 'text-gov-success'}`}>
                            {Math.round(issue.priorityScore)}
                         </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          {issue.imageUrl && (
                            <img src={issue.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-light-border dark:border-dark-border" />
                          )}
                          <div className="min-w-0 max-w-[200px]">
                            <p className="text-light-primary dark:text-dark-primary font-bold text-[13px] truncate">{issue.title}</p>
                            <p className="text-[9px] font-black text-light-muted dark:text-dark-muted uppercase tracking-widest mt-0.5">{issue.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-mono text-[12px] font-bold text-light-primary dark:text-dark-primary">
                         {issue.createdBy?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-6 hidden lg:table-cell">
                         <span className={`text-[11px] font-black uppercase tracking-widest ${ZONE_COLORS[issue.zone] || ''}`}>
                            {issue.zone}
                         </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                           <StatusBadge status={issue.status} />
                           {!isFinished && (
                             <select
                               value={issue.status}
                               onChange={e => handleStatusChange(issue.id, e.target.value)}
                               className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-[9px] font-bold uppercase tracking-widest rounded px-2 py-1 outline-none cursor-pointer"
                             >
                               {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-6 hidden md:table-cell">
                         {breached ? (
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gov-danger uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                 SLA Breach
                              </span>
                           </div>
                         ) : (
                           <span className="text-[10px] font-black text-gov-success uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              In SLA
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-light-muted dark:text-dark-muted">
                          <button onClick={() => navigate(`/issues/${issue.id}`)} className="hover:text-brand-blue transition-colors">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.323 8.192 7.272 5 12 5c4.728 0 8.677 3.192 9.964 6.678.045.12.045.261 0 .381C20.677 15.808 16.728 19 12 19c-4.728 0-8.677-3.192-9.964-6.678z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}