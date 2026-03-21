import { useState, useEffect } from 'react'
import api from '../api/axiosConfig'
import { extractError } from '../utils/helpers'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

const ZONES = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL']

const ZONE_LABELS = {
  NORTH:   'North — Mettupalayam, Annur, Karamadai',
  SOUTH:   'South — Pollachi, Valparai, Anaimalai',
  EAST:    'East — Sulur, Palladam, Avinashi',
  WEST:    'West — Madukkarai, Thondamuthur',
  CENTRAL: 'Central — Gandhipuram, RS Puram, Peelamedu',
}

const ZONE_COLORS = {
  NORTH:   'text-blue-500 bg-blue-500/5 border-blue-500/20',
  SOUTH:   'text-amber-500 bg-amber-500/5 border-amber-500/20',
  EAST:    'text-purple-500 bg-purple-500/5 border-purple-500/20',
  WEST:    'text-orange-500 bg-orange-500/5 border-orange-500/20',
  CENTRAL: 'text-brand-blue bg-brand-blue/5 border-brand-blue/20',
}

const INITIAL_FORM = { name: '', email: '', password: '', zone: '' }

export default function RegionalAdminPanel() {
  const [admins,      setAdmins]      = useState([])
  const [unassigned,  setUnassigned]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [form,        setForm]        = useState(INITIAL_FORM)
  const [creating,    setCreating]    = useState(false)
  const [deleting,    setDeleting]    = useState(null)
  const [assigning,   setAssigning]   = useState(null)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(null)
  const [activeTab,   setActiveTab]   = useState('admins')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [adminsRes, unassignedRes] = await Promise.all([
        api.get('/api/admin/regional-admins'),
        api.get('/api/admin/issues/unassigned'),
      ])
      setAdmins(adminsRes.data.data || [])
      setUnassigned(unassignedRes.data.data || [])
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await api.post('/api/admin/regional-admins', form)
      setSuccess(`Account created for ${form.zone} zone administrator.`)
      setForm(INITIAL_FORM)
      fetchData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove administrator access for ${name}?`)) return
    setDeleting(id)
    try {
      await api.delete(`/api/admin/regional-admins/${id}`)
      setAdmins(prev => prev.filter(a => a.id !== id))
      setSuccess(`${name} has been removed from the regional administrator list.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setDeleting(null)
    }
  }

  const handleAssign = async (issueId, adminId) => {
    if (!adminId) return
    setAssigning(issueId)
    try {
      await api.put(`/api/admin/issues/${issueId}/assign`, { adminId: parseInt(adminId) })
      setUnassigned(prev => prev.filter(i => i.id !== issueId))
      setSuccess(`Incident ID ${issueId} successfully assigned to regional agent.`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setAssigning(null)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
       <Spinner size="lg" />
       <p className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.4em] animate-pulse">Loading Staff...</p>
    </div>
  )

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-20 animate-fade">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 border-b border-light-border dark:border-dark-border pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-lg shadow-brand-blue/10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
             </div>
             <div>
                <h1 className="text-4xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight leading-tight">
                  Regional Admins
                </h1>
                <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                   Management of Zone-based Administrators
                </p>
             </div>
          </div>
        </div>
        
        {/* Advanced Tabs */}
        <div className="flex bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-md border border-light-border dark:border-dark-border rounded-2xl p-1.5 gap-1.5 shadow-inner">
          {[
            { id: 'admins',      label: 'Staff List', icon: <UserGroupIcon /> },
            { id: 'unassigned',  label: `Unassigned Issues (${unassigned.length})`, icon: <FlagIcon /> },
            { id: 'create',      label: 'Add Admin', icon: <PlusIcon /> },
          ].map(({ id, label, icon }) => (
            <button 
              key={id} 
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === id 
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                  : 'text-light-muted hover:text-light-primary dark:hover:text-dark-primary'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="min-h-[400px]">
        {activeTab === 'admins' && (
          <div className="animate-slide-up">
            {admins.length === 0 ? (
              <EmptyState title="No Admins Found" subtitle="No regional administrators currently registered in the system." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {admins.map((admin) => (
                  <div key={admin.id} className="group relative bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${ZONE_COLORS[admin.zone]}`}>
                         {admin.zone}
                       </span>
                    </div>

                    <div className="flex items-center gap-5 mb-8">
                       <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-light-bg to-light-border dark:from-dark-bg dark:to-dark-border flex items-center justify-center text-brand-blue dark:text-blue-400 font-bold text-xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                          {admin.name.charAt(0)}
                       </div>
                       <div>
                          <p className="text-[17px] font-black text-light-primary dark:text-dark-primary tracking-tight leading-none mb-1">{admin.name}</p>
                          <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted opacity-60 uppercase tracking-widest leading-none">{admin.email}</p>
                       </div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.1em] leading-relaxed">{admin.zoneDescription}</p>
                       <div className="grid grid-cols-3 gap-3">
                          {[
                            { l: 'TOTAL', v: admin.totalIssues, c: 'text-light-primary dark:text-dark-primary' },
                            { l: 'OPEN', v: admin.pendingIssues, c: 'text-brand-saffron' },
                            { l: 'DONE', v: admin.resolvedIssues, c: 'text-gov-success' }
                          ].map(({ l, v, c }) => (
                            <div key={l} className="bg-light-bg dark:bg-dark-bg border border-light-border/40 dark:border-dark-border/40 rounded-2xl p-4 text-center">
                               <div className={`text-2xl font-black font-display mb-1 ${c}`}>{v.toString().padStart(2, '0')}</div>
                               <div className="text-[9px] font-black text-light-muted uppercase tracking-widest opacity-50">{l}</div>
                            </div>
                          ))}
                       </div>
                    </div>

                    <button onClick={() => handleDelete(admin.id, admin.name)}
                      disabled={deleting === admin.id}
                      className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-gov-danger/20 text-gov-danger hover:bg-gov-danger hover:text-white transition-all duration-300">
                      {deleting === admin.id ? <Spinner size="sm" /> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-1.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-3.375 7.312c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18a3.375 3.375 0 01-3.375 3.375h-8.25A3.375 3.375 0 015.25 18v-1.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V18" /></svg> Remove Admin</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'unassigned' && (
          <div className="animate-slide-up bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2rem] overflow-hidden shadow-lg">
            {unassigned.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center gap-6">
                 <div className="w-20 h-20 rounded-full bg-gov-success/10 text-gov-success flex items-center justify-center text-4xl shadow-lg shadow-gov-success/10 animate-scale">✓</div>
                 <div className="text-center">
                    <h2 className="text-2xl font-display font-black text-light-primary dark:text-dark-primary mb-2 tracking-tight">Everything Assigned</h2>
                    <p className="text-light-muted font-bold text-[13px] uppercase tracking-widest">All reported issues have been assigned to regional administrators.</p>
                 </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-light-bg/50 dark:bg-dark-bg/50 border-b border-light-border dark:border-dark-border">
                      <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em]">Issue ID</th>
                      <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em]">Reported Issue</th>
                      <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em] hidden md:table-cell">Zone</th>
                      <th className="px-8 py-6 text-[10px] font-black text-light-muted uppercase tracking-[0.3em]">Assign To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border/40 dark:divide-dark-border/40">
                    {unassigned.map((issue) => (
                      <tr key={issue.id} className="hover:bg-light-bg/30 dark:hover:bg-dark-bg/30 transition-colors">
                        <td className="px-8 py-6 font-mono text-[11px] font-black text-light-muted">#{issue.id.toString().slice(-6)}</td>
                        <td className="px-8 py-6">
                           <p className="text-light-primary dark:text-dark-primary text-[15px] font-black tracking-tight mb-1">{issue.title}</p>
                           <p className="text-[10px] font-black text-light-muted uppercase tracking-widest">{issue.category}</p>
                        </td>
                        <td className="px-8 py-6 hidden md:table-cell">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${ZONE_COLORS[issue.zone] || 'text-light-muted border-light-border'}`}>
                             {issue.zone || 'UNASSIGNED'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <select
                              defaultValue=""
                              onChange={(e) => handleAssign(issue.id, e.target.value)}
                              disabled={assigning === issue.id}
                              className="flex-1 max-w-[200px] h-11 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl text-[11px] font-black uppercase tracking-widest px-4 focus:ring-2 focus:ring-brand-blue/30 outline-none transition-all cursor-pointer"
                            >
                              <option value="" disabled>Select administrator…</option>
                              {admins.filter(a => a.zone === issue.zone || !issue.zone).map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.zone})
                                </option>
                              ))}
                            </select>
                            {assigning === issue.id && <Spinner size="sm" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Create Regional Admin ── */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2.5rem] p-10 lg:p-12 shadow-2xl relative overflow-hidden">
               {/* Decorative background identity */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 -mr-16 -mt-16 rounded-full blur-3xl" />
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-gov-danger/5 -ml-24 -mb-24 rounded-full blur-3xl" />

               <div className="relative">
                  <h2 className="text-3xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-2">Add New Administrator</h2>
                  <p className="text-[11px] font-bold text-light-muted uppercase tracking-[0.3em] mb-10 pb-10 border-b border-light-border dark:border-dark-border">Create access for a new regional staff member.</p>
                  
                  <form onSubmit={handleCreate} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-light-muted uppercase tracking-[0.2em] ml-1">Assigned Name</label>
                          <input type="text" className="w-full h-14 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-5 text-[14px] font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all placeholder:text-light-muted/30" placeholder="e.g. Officer Raman"
                            value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-light-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
                          <input type="email" className="w-full h-14 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-5 text-[14px] font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all placeholder:text-light-muted/30" placeholder="staff@coimbatore.gov.in"
                            value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-light-muted uppercase tracking-[0.2em] ml-1">Access Passcode</label>
                          <input type="password" className="w-full h-14 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-5 text-[14px] font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all placeholder:text-light-muted/30" placeholder="Entropy secure key"
                            value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-light-muted uppercase tracking-[0.2em] ml-1">Jurisdiction Zone</label>
                          <select className="w-full h-14 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-5 text-[13px] font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all cursor-pointer" value={form.zone}
                            onChange={e => setForm(p => ({...p, zone: e.target.value}))} required>
                            <option value="">Select administrative zone…</option>
                            {ZONES.map(z => (
                              <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                            ))}
                          </select>
                       </div>
                    </div>

                    <button type="submit" className="w-full h-16 bg-brand-blue text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.25em] shadow-xl shadow-brand-blue/30 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group" disabled={creating}>
                      {creating ? <Spinner size="sm" /> : <>Create Administrator <span className="group-hover:translate-x-2 transition-transform">→</span></>}
                    </button>
                  </form>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="text-center py-32 border-2 border-dashed border-light-border dark:border-dark-border rounded-[3rem]">
      <div className="w-20 h-20 rounded-3xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center mx-auto mb-8">
         <svg className="w-10 h-10 text-brand-blue/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07" /></svg>
      </div>
      <h3 className="text-2xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-2">{title}</h3>
      <p className="text-light-muted font-bold text-[13px] uppercase tracking-widest">{subtitle}</p>
    </div>
  )
}

function UserGroupIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
}

function FlagIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>
}

function PlusIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
}
