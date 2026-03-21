import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { useAuth } from '../context/AuthContext'
import { timeAgo, extractError } from '../utils/helpers'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const ZONE_COLORS = {
  NORTH: 'text-blue-500', SOUTH: 'text-amber-500',
  EAST:  'text-purple-500', WEST: 'text-orange-500', CENTRAL: 'text-brand-blue',
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
  const [imgOpen,    setImgOpen]    = useState(null)

  const [resolveModal,   setResolveModal]   = useState(false)
  const [resolvedFile,   setResolvedFile]   = useState(null)
  const [resolvedPreview,setResolvedPreview]= useState(null)
  const [uploading,      setUploading]      = useState(false)
  const [resolving,      setResolving]      = useState(false)
  const fileInputRef = useRef(null)

  const [showReopenNote, setShowReopenNote] = useState(false)
  const [reopenNote,     setReopenNote]     = useState('')
  const [actioning,      setActioning]      = useState(false)

  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN'
  const canModerate     = isAdmin || isRegionalAdmin
  const isOwnIssue      = issue?.createdBy?.email === user?.email

  useEffect(() => {
    issueApi.getById(id)
      .then(res => setIssue(res.data.data))
      .catch(() => setError('Requested issue not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResolvedFile(file)
    setResolvedPreview(URL.createObjectURL(file))
  }

  const handleResolve = async () => {
    if (!resolvedFile) {
      setError('Proof of resolution photo required.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const uploadData = await issueApi.uploadImageDirect(
        resolvedFile,
        issue.latitude,
        issue.longitude,
        new Date().toISOString()
      )
      setUploading(false)
      setResolving(true)
      const res = await issueApi.resolve(id, uploadData.imageUrl, uploadData.publicId)
      setIssue(res.data.data)
      setResolveModal(false)
      setResolvedFile(null)
      setResolvedPreview(null)
      setSuccess('Issue updated: Status set to RESOLVED. Awaiting reporter validation.')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUploading(false)
      setResolving(false)
    }
  }

  const handleConfirm = async () => {
    setActioning(true)
    setError(null)
    try {
      const res = await issueApi.confirmResolution(id)
      setIssue(res.data.data)
      setSuccess('Resolution validated. Issue officially CLOSED. ✅')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setActioning(false)
    }
  }

  const handleReopen = async () => {
    setActioning(true)
    setError(null)
    try {
      const res = await issueApi.reopen(id, reopenNote)
      setIssue(res.data.data)
      setShowReopenNote(false)
      setReopenNote('')
      setSuccess('Issue REOPENED. Resolution process restarted.')
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <Spinner size="lg" />
      <p className="text-light-muted dark:text-dark-muted font-bold uppercase tracking-widest text-[11px] animate-pulse">Loading Issue Details...</p>
    </div>
  )

  if (!issue) return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-center mx-auto mb-6 text-light-muted dark:text-dark-muted">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-light-primary dark:text-dark-primary mb-2">Issue Not Found</h2>
      <p className="text-light-muted dark:text-dark-muted font-medium mb-8">The requested issue is either missing or you do not have permission to view it.</p>
      <Link to="/dashboard" className="btn btn-primary px-8">Return to Dashboard</Link>
    </div>
  )

  const isResolved = issue.status === 'RESOLVED'
  const isClosed   = issue.status === 'CLOSED'
  const isReopened = issue.status === 'REOPENED'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-16 animate-fade">
      
      {/* ── Dashboard Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 group">
         <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-light-muted dark:text-dark-muted hover:text-brand-blue transition-colors uppercase tracking-wider">
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Back to Dashboard
         </Link>
         <div className="flex items-center gap-3 text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest bg-light-surface dark:bg-dark-surface px-4 py-2 rounded-full border border-light-border dark:border-dark-border">
            <span>Issue Tracking</span>
            <span className="w-1 h-1 bg-current rounded-full" />
            <span>ID: {issue.id}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* ── Left Profile (Core Details) ── */}
         <div className="lg:col-span-2 space-y-8">
            
            <div className="space-y-4">
               <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
               <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
               
               {isClosed && (
                 <div className="bg-gov-success/5 border border-gov-success/20 rounded-2xl p-5 flex items-start gap-4 animate-fade">
                    <div className="w-12 h-12 rounded-xl bg-gov-success text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-gov-success/20">
                       <CheckIcon className="w-7 h-7" />
                    </div>
                    <div>
                       <h4 className="text-[13px] font-bold text-gov-success uppercase tracking-widest mb-1">Issue Closed</h4>
                       <p className="text-light-primary dark:text-dark-primary font-bold leading-relaxed">This issue has been fully resolved and verified.</p>
                    </div>
                 </div>
               )}

               {isReopened && (
                 <div className="bg-brand-saffron/5 border border-brand-saffron/20 rounded-2xl p-5 flex items-start gap-4 animate-fade">
                    <div className="w-12 h-12 rounded-xl bg-brand-saffron text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-saffron/20">
                       <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    </div>
                    <div>
                       <h4 className="text-[13px] font-bold text-brand-saffron uppercase tracking-widest mb-1">Status: REOPENED</h4>
                       <p className="text-light-primary dark:text-dark-primary font-bold">Investigation reactivated following verification rejection.</p>
                       {issue.reopenNote && <p className="text-light-muted dark:text-dark-muted font-medium italic text-sm mt-2 opacity-80">" {issue.reopenNote} "</p>}
                    </div>
                 </div>
               )}

               <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-5 sm:p-8 lg:p-10 border-b border-light-border/50 dark:border-dark-border/50">
                     <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="bg-brand-blue/10 dark:bg-blue-900/20 text-brand-blue dark:text-blue-400 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest border border-brand-blue/20">
                           {issue.category}
                        </span>
                        <StatusBadge status={issue.status} />
                        {issue.zone && issue.zone !== 'UNASSIGNED' && (
                           <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${ZONE_COLORS[issue.zone] || ''}`}>
                              {issue.zone} Zone
                           </span>
                        )}
                     </div>
                     <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight leading-[1.2] sm:leading-[1.1] mb-6">
                        {issue.title}
                     </h1>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-[13px] font-medium border-t border-light-border/50 dark:border-dark-border/50 pt-8">
                        <div>
                           <p className="text-light-muted dark:text-dark-muted uppercase text-[10px] font-bold tracking-widest mb-1">Reporting Agent</p>
                           <p className="text-light-primary dark:text-dark-primary font-bold">{issue.createdBy?.name}</p>
                        </div>
                        <div>
                           <p className="text-light-muted dark:text-dark-muted uppercase text-[10px] font-bold tracking-widest mb-1">Reported Date</p>
                           <p className="text-light-primary dark:text-dark-primary font-bold truncate">{new Date(issue.createdAt).toLocaleDateString()} <span className="text-[11px] opacity-60 ml-1">({timeAgo(issue.createdAt)})</span></p>
                        </div>
                        {issue.assignedTo && (
                           <div className="col-span-2 md:col-span-1">
                              <p className="text-light-muted dark:text-dark-muted uppercase text-[10px] font-bold tracking-widest mb-1">Assigned Official</p>
                              <div className="flex items-center gap-2 text-brand-blue font-bold">
                                 <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                 {issue.assignedTo.name}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="p-5 sm:p-8 lg:p-10 bg-light-bg/30 dark:bg-dark-bg/30">
                     <h3 className="text-[10px] sm:text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-3">
                        Narrative & Details
                        <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
                     </h3>
                     <p className="text-light-primary dark:text-dark-primary font-medium leading-relaxed whitespace-pre-wrap text-[14px] sm:text-[15px]">
                        {issue.description}
                     </p>
                  </div>
               </div>
            </div>

            {/* ── Evidence Visualizer (Before / After) ── */}
            <div className="space-y-6">
               <h3 className="px-1 text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] flex items-center gap-3">
                  Photo Evidence
                  <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
               </h3>
               
               <div className={`grid gap-6 ${issue.resolvedImageUrl ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  {issue.imageUrl && (
                     <div className="group relative rounded-3xl overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface shadow-sm">
                        <div className="absolute inset-x-0 top-0 p-4 z-10 bg-gradient-to-b from-black/60 to-transparent">
                           <p className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand-saffron animate-pulse" />
                              Report Photo
                           </p>
                        </div>
                        <img src={issue.imageUrl} alt="Initial" className="w-full h-80 object-cover" />
                        <button onClick={() => setImgOpen('before')} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm uppercase tracking-widest gap-2">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                           View Photo
                        </button>
                     </div>
                  )}

                  {issue.resolvedImageUrl && (
                     <div className="group relative rounded-3xl overflow-hidden border-2 border-gov-success/30 bg-light-surface dark:bg-dark-surface shadow-xl shadow-gov-success/5">
                        <div className="absolute inset-x-0 top-0 p-4 z-10 bg-gradient-to-b from-gov-success/60 to-transparent">
                           <p className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gov-success animate-pulse" />
                              Resolution Photo
                           </p>
                        </div>
                        <img src={issue.resolvedImageUrl} alt="Resolved" className="w-full h-80 object-cover" />
                        <button onClick={() => setImgOpen('after')} className="absolute inset-0 bg-gov-success/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm uppercase tracking-widest gap-2">
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                           View Proof
                        </button>
                     </div>
                  )}
               </div>
            </div>

            {/* ── Governance Audit Log (Comments) ── */}
            <div className="space-y-6 pt-10">
               <h3 className="px-1 text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] flex items-center gap-3">
                  Comments ({issue.comments?.length || 0})
                  <div className="h-px flex-1 bg-light-border dark:bg-dark-border" />
               </h3>

               <div className="space-y-4">
                  {(issue.comments || []).length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-light-border dark:border-dark-border rounded-3xl">
                       <p className="text-light-muted dark:text-dark-muted font-bold text-[13px] uppercase tracking-widest">No comments yet</p>
                    </div>
                  ) : (
                    issue.comments.map(c => (
                       <div key={c.id} className="flex gap-5 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border p-5 rounded-2xl animate-fade">
                          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-sm flex-shrink-0">
                             {c.userName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold text-light-primary dark:text-dark-primary">{c.userName}</span>
                                <span className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest opacity-60">{timeAgo(c.createdAt)}</span>
                             </div>
                             <p className="text-light-primary dark:text-dark-primary text-sm font-medium leading-relaxed">{c.text}</p>
                          </div>
                       </div>
                    ))
                  )}
               </div>

               <form onSubmit={handleAddComment} className="relative mt-8 group animate-slide-up">
                  <input type="text" className="input pr-32 h-14 rounded-2xl border-light-border/60 font-medium" 
                    placeholder="Add a comment..." value={comment}
                    onChange={e => setComment(e.target.value)} maxLength={500} />
                  <button type="submit" className="absolute right-2 top-2 h-10 px-6 btn btn-primary flex items-center gap-2 text-[12px] shadow-lg shadow-brand-blue/20"
                    disabled={submitting || !comment.trim()}>
                    {submitting ? <Spinner size="sm" /> : 'Add Comment'}
                  </button>
               </form>
            </div>
         </div>

         {/* ── Right Actions (Stationary Profile) ── */}
         <div className="space-y-8">
            
            {/* ── Status Management ── */}
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-6 lg:p-8 space-y-6 lg:sticky lg:top-8">
               
               <div className="pb-6 border-b border-light-border/50 dark:border-dark-border/50">
                  <h3 className="text-[11px] font-bold text-light-primary dark:text-dark-primary uppercase tracking-[0.2em] mb-4">Action Center</h3>
                  <div className="p-4 bg-light-bg/50 dark:bg-dark-bg/50 rounded-2xl border border-light-border dark:border-dark-border">
                     <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-1.5 leading-none">Issue Status</p>
                     <p className="text-xl font-display font-extrabold text-light-primary dark:text-dark-primary tracking-tight leading-none">
                        {issue.status.replace('_', ' ')}
                     </p>
                  </div>
               </div>

               {/* ADMIN MODERATION */}
               {canModerate && !isClosed && (
                 <div className="space-y-4">
                    {(issue.status === 'PENDING' || issue.status === 'REOPENED') && (
                       <button
                          onClick={async () => {
                             try {
                                const res = await issueApi.updateStatus(id, 'IN_PROGRESS')
                                setIssue(res.data.data)
                             } catch (err) { setError(extractError(err)) }
                          }}
                          className="btn btn-primary w-full h-14 text-[13px] bg-gov-info hover:bg-blue-700 shadow-lg shadow-gov-info/20 flex items-center justify-center gap-3"
                       >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L4.32 8.909a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                          Start Resolution
                       </button>
                    )}

                    {(issue.status === 'IN_PROGRESS' || issue.status === 'REOPENED') && (
                       <button
                          onClick={() => setResolveModal(true)}
                          className="btn btn-primary w-full h-14 text-[13px] bg-gov-success hover:bg-green-700 shadow-lg shadow-gov-success/20 flex items-center justify-center gap-3"
                       >
                          <CheckIcon className="w-5 h-5" />
                          Mark as Resolved
                       </button>
                    )}
                    <p className="text-[10px] font-bold text-light-muted dark:text-dark-muted text-center uppercase tracking-widest leading-none">Authorized Action Level: {user?.role}</p>
                 </div>
               )}

               {/* REPORTER VALIDATION */}
               {isOwnIssue && isResolved && (
                 <div className="bg-brand-saffron/10 border-2 border-brand-saffron/30 rounded-2xl p-6 space-y-6 animate-pulse">
                    <div>
                       <h4 className="text-[13px] font-bold text-brand-saffron uppercase tracking-widest mb-1">Citizen Validation Required</h4>
                       <p className="text-light-primary dark:text-dark-primary font-bold text-sm leading-relaxed">Official reports indicate resolution. Please authenticate the fix.</p>
                    </div>

                    {!showReopenNote ? (
                       <div className="space-y-3">
                          <button onClick={handleConfirm} disabled={actioning} className="btn btn-primary w-full h-12 text-[12px] bg-gov-success hover:bg-green-700 shadow-lg shadow-gov-success/20">
                             {actioning ? <Spinner size="sm" /> : '✓ Verify Resolution'}
                          </button>
                          <button onClick={() => setShowReopenNote(true)} disabled={actioning} className="btn btn-secondary w-full h-12 text-[12px] border-gov-danger/40 text-gov-danger hover:bg-gov-danger/10">
                             ✗ Dispute Resolution
                          </button>
                       </div>
                    ) : (
                       <div className="space-y-4 animate-fade">
                          <textarea className="input text-sm min-h-[100px] py-4 bg-white dark:bg-[#111]" placeholder="Clarify ongoing issues..." value={reopenNote} onChange={e => setReopenNote(e.target.value)} maxLength={300} autoFocus />
                          <div className="flex gap-2">
                             <button onClick={handleReopen} disabled={actioning} className="btn btn-primary flex-1 h-10 text-[11px] bg-gov-danger">Reject</button>
                             <button onClick={() => setShowReopenNote(false)} className="btn btn-secondary flex-1 h-10 text-[11px]">Cancel</button>
                          </div>
                       </div>
                    )}
                 </div>
               )}
               
               {/* Metadata / Location Lock */}
               <div className="pt-6 border-t border-light-border/50 dark:border-dark-border/50 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest">
                     <span>Spatial Lock</span>
                     <span className="text-brand-blue">Active</span>
                  </div>
                  <div className="p-4 bg-light-bg/50 dark:bg-dark-bg/50 rounded-xl border border-light-border dark:border-dark-border overflow-hidden">
                     <p className="text-[11px] font-mono text-light-primary dark:text-dark-primary truncate">{issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}</p>
                     <p className="text-[11px] text-light-muted dark:text-dark-muted font-medium mt-1 truncate">{issue.address || 'Geo-coordinates verified via GPS'}</p>
                  </div>
                  <button className="w-full text-[11px] font-bold text-brand-blue uppercase tracking-widest hover:underline text-left px-1">Open in District GIS Map →</button>
               </div>
            </div>
         </div>
      </div>

      {/* ── RESOLVE MODAL ── */}
      {resolveModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade"
          onClick={() => { setResolveModal(false); setResolvedFile(null); setResolvedPreview(null) }}>
          <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2rem] p-8 lg:p-10 max-w-lg w-full shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>

            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 rounded-2xl bg-gov-success/10 text-gov-success flex items-center justify-center">
                  <CheckIcon className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="text-2xl font-display font-extrabold text-light-primary dark:text-dark-primary tracking-tight">Post-Action Audit</h3>
                  <p className="text-light-muted dark:text-dark-muted font-medium text-sm">Upload verifiable evidence of resolution.</p>
               </div>
            </div>

            <div onClick={() => fileInputRef.current?.click()} className={`group relative rounded-3xl border-3 border-dashed h-64 overflow-hidden transition-all flex flex-col items-center justify-center gap-4 cursor-pointer ${resolvedPreview ? 'border-gov-success/40' : 'border-light-border dark:border-dark-border hover:border-brand-blue/40 hover:bg-brand-blue/5'}`}>
              {resolvedPreview ? (
                 <img src={resolvedPreview} alt="Proof" className="w-full h-full object-cover" />
              ) : (
                 <>
                    <div className="w-14 h-14 rounded-2xl bg-light-bg dark:bg-dark-bg flex items-center justify-center text-light-muted dark:text-dark-muted group-hover:text-brand-blue transition-colors shadow-inner">
                       <CamIcon className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                       <p className="text-light-primary dark:text-dark-primary font-bold">Select Proof Photo</p>
                       <p className="text-light-muted dark:text-dark-muted font-bold text-[10px] uppercase tracking-widest mt-1 group-hover:text-brand-blue/60 transition-colors">Capture or Choose File</p>
                    </div>
                 </>
              )}
              {resolvedPreview && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs uppercase tracking-widest">Update Photo</div>}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

            <div className="flex gap-4 mt-10">
               <button onClick={handleResolve} disabled={!resolvedFile || uploading || resolving} className="btn btn-primary flex-1 h-14 text-sm bg-gov-success shadow-lg shadow-gov-success/20">
                  {uploading || resolving ? <Spinner size="sm" /> : 'Submit Resolution'}
               </button>
               <button onClick={() => { setResolveModal(false); setResolvedFile(null); setResolvedPreview(null) }} className="btn btn-secondary flex-1 h-14 text-sm font-bold uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPAND MODAL ── */}
      {imgOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade" onClick={() => setImgOpen(null)}>
          <div className="relative max-w-5xl w-full flex flex-col gap-6 animate-scale" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
               <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.3em] font-mono">
                  {imgOpen === 'before' ? 'ID_INITIAL_CAPTURE' : 'ID_RESOLUTION_PROOF'}
               </span>
               <button onClick={() => setImgOpen(null)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <img src={imgOpen === 'before' ? issue.imageUrl : issue.resolvedImageUrl} alt="Full view" className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

const CheckIcon = ({ className = "w-4 h-4" }) => (
   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
)

const CamIcon = ({ className = "w-4 h-4" }) => (
   <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
)
