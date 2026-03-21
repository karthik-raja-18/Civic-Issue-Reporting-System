import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { timeAgo, extractError } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED']

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
      setSuccess(`Case #${issueId} status successfully updated to ${status}.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (issueId) => {
    if (!window.confirm(`URGENT: Permanent Deletion Request for Case #${issueId}. Proceed with total erasure?`)) return
    setDeleting(issueId)
    try {
      await issueApi.delete(issueId)
      setIssues(prev => prev.filter(i => i.id !== issueId))
      setSuccess(`Case Log #${issueId} has been purged from primary registry.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setDeleting(null)
    }
  }

  const total      = issues.length
  const pending    = issues.filter(i => i.status === 'PENDING').length
  const inProgress = issues.filter(i => i.status === 'IN_PROGRESS').length
  const resolved   = issues.filter(i => i.status === 'RESOLVED').length

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <Spinner size="lg" />
       <p className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.4em] animate-pulse">Syncing District Master Registry...</p>
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-16 animate-fade">

      {/* ── Governance Header ── */}
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

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Total Issues', value: total,      color: 'text-light-primary dark:text-dark-primary', sub: 'All Reports' },
          { label: 'Pending', value: pending,    color: 'text-brand-saffron', sub: 'Awaiting Action' },
          { label: 'In Progress', value: inProgress, color: 'text-gov-info', sub: 'Active Resolution' },
          { label: 'Resolved', value: resolved,   color: 'text-gov-success', sub: 'Completed' },
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

      {/* High Density Case Registry */}
      {issues.length === 0 ? (
        <div className="text-center py-32 bg-light-surface dark:bg-dark-surface border-2 border-dashed border-light-border dark:border-dark-border rounded-[2.5rem]">
          <p className="text-light-muted dark:text-dark-muted font-black text-[13px] uppercase tracking-[0.3em]">Registry Empty: No Incident Logged</p>
        </div>
      ) : (
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
                  <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Case ID</th>
                   <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Issue Detail</th>
                   <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] hidden lg:table-cell">Zone</th>
                   <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] hidden md:table-cell">Reporter</th>
                   <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em]">Status</th>
                   <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] hidden xl:table-cell">Time</th>
                   <th className="px-8 py-5 text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/50 dark:divide-dark-border/50">
                {issues.map((issue) => (
                  <tr key={issue.id} className="group hover:bg-light-bg/30 dark:hover:bg-dark-bg/30 transition-colors">
                    <td className="px-8 py-6 font-mono text-[11px] font-bold text-light-muted dark:text-dark-muted">
                      #{issue.id.toString().slice(-6)}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {issue.imageUrl ? (
                          <div className="relative group cursor-pointer" onClick={() => navigate(`/issues/${issue.id}`)}>
                            <img src={issue.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-light-border dark:border-dark-border shadow-sm group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-light-bg dark:bg-dark-bg flex items-center justify-center text-light-muted/30 border border-light-border dark:border-dark-border">
                             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-light-primary dark:text-dark-primary font-bold text-[15px] tracking-tight truncate group-hover:text-brand-blue transition-colors">
                            {issue.title}
                          </p>
                          <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.1em] mt-1">{issue.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden lg:table-cell">
                      {issue.zone && issue.zone !== 'UNASSIGNED' ? (
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${ZONE_COLORS[issue.zone]?.replace('text-', 'bg-') || 'bg-light-muted'}`} />
                           <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${ZONE_COLORS[issue.zone] || 'text-light-muted'}`}>
                             {issue.zone}
                           </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-light-muted opacity-40 uppercase tracking-widest">Global</span>
                      )}
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-light-primary dark:text-dark-primary">{issue.createdBy?.name}</span>
                         <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium opacity-60">Citizen Agent</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-3">
                         <StatusBadge status={issue.status} />
                         {updating !== issue.id && (
                            <select
                               value={issue.status}
                               onChange={e => handleStatusChange(issue.id, e.target.value)}
                               className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-[10px] font-black uppercase tracking-widest text-light-primary dark:text-dark-primary rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-brand-blue/30 outline-none hover:border-brand-blue/30 transition-all"
                            >
                               {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                         )}
                         {updating === issue.id && <Spinner size="sm" />}
                      </div>
                    </td>
                    <td className="px-8 py-6 hidden xl:table-cell">
                      <div className="flex flex-col">
                         <span className="text-[12px] font-bold text-light-primary dark:text-dark-primary truncate">{timeAgo(issue.createdAt)}</span>
                          <span className="text-[9px] text-light-muted dark:text-dark-muted font-black uppercase tracking-widest mt-1">Reported</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => navigate(`/issues/${issue.id}`)} className="p-2.5 rounded-xl border border-light-border dark:border-dark-border text-brand-blue hover:bg-brand-blue/5 transition-all" title="View Details">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.323 8.192 7.272 5 12 5c4.728 0 8.677 3.192 9.964 6.678.045.12.045.261 0 .381C20.677 15.808 16.728 19 12 19c-4.728 0-8.677-3.192-9.964-6.678z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(issue.id)} disabled={deleting === issue.id} className="p-2.5 rounded-xl border border-light-border dark:border-dark-border text-gov-danger hover:bg-gov-danger/5 transition-all" title="Delete">
                           {deleting === issue.id ? <Spinner size="sm" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Registry Control Footer */}
          <div className="px-8 py-5 border-t border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <span className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.2em]">{issues.length} Issues Identifed</span>
               <div className="h-4 w-px bg-light-border dark:border-dark-border" />
               <span className="text-[10px] font-black text-gov-success uppercase tracking-[0.2em]">System Status: Active</span>
            </div>
            <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted opacity-40 uppercase tracking-widest">Coimbatore District Governance System v2.4.0</p>
          </div>
        </div>
      )}
    </div>
  )
}