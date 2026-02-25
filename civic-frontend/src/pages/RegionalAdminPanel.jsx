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
  NORTH:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SOUTH:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  EAST:    'bg-purple-500/15 text-purple-400 border-purple-500/30',
  WEST:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CENTRAL: 'bg-civic-500/15 text-civic-400 border-civic-500/30',
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
      setSuccess(`Regional admin created for ${form.zone} zone!`)
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
    if (!window.confirm(`Remove ${name} as regional admin?`)) return
    setDeleting(id)
    try {
      await api.delete(`/api/admin/regional-admins/${id}`)
      setAdmins(prev => prev.filter(a => a.id !== id))
      setSuccess(`${name} removed.`)
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
      setSuccess('Issue assigned successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setAssigning(null)
    }
  }

  if (loading) return <Spinner center />

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 page-wrapper">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-admin">Admin</span>
        </div>
        <h1 className="page-title">Regional Admin Management</h1>
        <p className="text-ink-400 text-sm mt-0.5">
          Manage zone-wise admins for Coimbatore District.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <AlertMessage type="error"   message={error}   onDismiss={() => setError(null)} />
        <AlertMessage type="success" message={success} onDismiss={() => setSuccess(null)} />
      </div>

      {/* Tabs */}
      <div className="flex bg-ink-900 border border-ink-800 rounded-lg p-0.5 gap-0.5 mb-6 w-fit">
        {[['admins', 'Regional Admins'], ['unassigned', `Unassigned Issues (${unassigned.length})`], ['create', 'Create Admin']].map(([val, label]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === val ? 'bg-civic-500 text-white' : 'text-ink-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Admins list ── */}
      {activeTab === 'admins' && (
        <div>
          {admins.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              No regional admins yet. Create one using the "Create Admin" tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map((admin) => (
                <div key={admin.id} className="card border-ink-700">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-white text-sm">{admin.name}</p>
                      <p className="text-ink-400 text-xs mt-0.5">{admin.email}</p>
                    </div>
                    <span className={`badge border text-xs ${ZONE_COLORS[admin.zone] || 'badge-user'}`}>
                      {admin.zone}
                    </span>
                  </div>
                  <p className="text-ink-500 text-xs mb-3">{admin.zoneDescription}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[['Total', admin.totalIssues, 'text-white'], ['Pending', admin.pendingIssues, 'text-amber-400'], ['Resolved', admin.resolvedIssues, 'text-civic-400']].map(([l, v, c]) => (
                      <div key={l} className="bg-ink-800 rounded-lg p-2 text-center">
                        <div className={`text-base font-bold font-display ${c}`}>{v}</div>
                        <div className="text-xs text-ink-500">{l}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleDelete(admin.id, admin.name)}
                    disabled={deleting === admin.id}
                    className="btn-danger w-full justify-center text-xs py-1.5">
                    {deleting === admin.id ? <Spinner size="sm" /> : 'Remove Admin'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Unassigned Issues ── */}
      {activeTab === 'unassigned' && (
        <div>
          {unassigned.length === 0 ? (
            <div className="text-center py-16 text-civic-400">
              ✅ All issues are assigned to regional admins!
            </div>
          ) : (
            <div className="card border-ink-700 p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-800 bg-ink-900/80">
                    <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase">Issue</th>
                    <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase hidden md:table-cell">Zone</th>
                    <th className="text-left px-4 py-3 text-xs text-ink-500 uppercase">Assign To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800/60">
                  {unassigned.map((issue) => (
                    <tr key={issue.id} className="hover:bg-ink-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-ink-500">{issue.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-ink-100 text-sm font-medium line-clamp-1">{issue.title}</p>
                        <p className="text-ink-500 text-xs">{issue.category}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`badge border text-xs ${ZONE_COLORS[issue.zone] || 'badge-user'}`}>
                          {issue.zone || 'UNASSIGNED'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue=""
                            onChange={(e) => handleAssign(issue.id, e.target.value)}
                            disabled={assigning === issue.id}
                            className="bg-ink-800 border border-ink-700 text-ink-200 text-xs
                                       rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1
                                       focus:ring-civic-500"
                          >
                            <option value="" disabled>Select admin…</option>
                            {admins.map(a => (
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
        <div className="max-w-md">
          <div className="card border-ink-700">
            <h2 className="section-title mb-4">Create Regional Admin</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" placeholder="e.g. South Zone Admin"
                  value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="admin@civic.com"
                  value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={6} />
              </div>
              <div>
                <label className="label">Zone</label>
                <select className="input" value={form.zone}
                  onChange={e => setForm(p => ({...p, zone: e.target.value}))} required>
                  <option value="">Select a zone…</option>
                  {ZONES.map(z => (
                    <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary w-full justify-center" disabled={creating}>
                {creating ? <><Spinner size="sm" /> Creating…</> : 'Create Regional Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
