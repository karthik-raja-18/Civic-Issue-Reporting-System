import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { issueApi } from '../api/issueApi'
import { useAuth } from '../context/AuthContext'
import IssueCard from '../components/IssueCard'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'
import { useTranslation } from 'react-i18next'

const FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED']

export default function Dashboard() {
  const { user } = useAuth()
  const [issues,  setIssues]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('ALL')
  const [tab,     setTab]     = useState('all')  // 'all' | 'mine'
  const [search,  setSearch]  = useState('')
  const { t, i18n } = useTranslation()

  const fetchIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = tab === 'mine'
        ? await issueApi.getMine()
        : await issueApi.getAll()
      setIssues(res.data.data || [])
    } catch {
      setError('System communication error. Please refresh the dashboard.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchIssues() }, [fetchIssues])

  const visible = issues.filter((i) => {
    const matchStatus = filter === 'ALL' || i.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      i.title.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const stats = {
    total:      issues.length,
    pending:    issues.filter(i => i.status === 'PENDING').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved:   issues.filter(i => i.status === 'RESOLVED').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-12 animate-fade">
      
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 pb-6 sm:pb-8 border-b border-light-border dark:border-dark-border">
        <div className="space-y-1.5">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-brand-blue dark:text-blue-400 font-bold text-[11px] uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {t('dashboard.title')}
              </div>
           </div>
           <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-light-primary dark:text-dark-primary tracking-tight">
             {tab === 'mine' ? t('dashboard.myIssues') : t('dashboard.allIssues', 'All Civic Issues')}
           </h1>
           <p className="text-light-muted dark:text-dark-muted font-medium text-[15px]">
             {t('dashboard.welcome')}, <span className="text-light-primary dark:text-dark-primary font-bold">{user?.name}</span>
           </p>
        </div>
        
        {user?.role === 'USER' && (
          <Link to="/issues/new" className="btn btn-primary h-12 px-6 shadow-xl shadow-brand-blue/20 flex items-center gap-2 text-[14px] font-bold">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('dashboard.reportNew')}
          </Link>
        )}
      </div>

      {/* ── Professional Statistics Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: t('dashboard.totalIssues'), value: stats.total,      color: 'bg-brand-blue',    icon: <BarIcon /> },
          { label: t('dashboard.pending'),     value: stats.pending,    color: 'bg-brand-saffron', icon: <PenIcon /> },
          { label: t('dashboard.inProgress'),  value: stats.inProgress, color: 'bg-gov-info',      icon: <GearIcon /> },
          { label: t('dashboard.resolved'),    value: stats.resolved,   color: 'bg-gov-success',   icon: <CheckIcon /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
             <div className={`absolute top-0 left-0 bottom-0 w-1 ${color}`} />
             <div className="flex justify-between items-start capitalize font-bold text-[11px] tracking-widest text-light-muted dark:text-dark-muted">
                {label}
                <span className={`p-1.5 rounded-lg ${color}/10 text-current`}>{icon}</span>
             </div>
             <div className="text-3xl font-display font-extrabold text-light-primary dark:text-dark-primary mt-2">
                {value}
             </div>
          </div>
        ))}
      </div>

      {/* ── Console Toolbox (Search/Filters) ── */}
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        
        {/* View Switcher */}
        {user?.role === 'USER' && (
          <div className="flex p-1 bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border gap-1">
             <button 
                onClick={() => setTab('all')}
                className={`flex-1 lg:flex-none px-6 py-2 rounded-md text-[12px] font-bold uppercase tracking-wider transition-all ${tab === 'all' ? 'bg-light-surface dark:bg-dark-surface text-brand-blue dark:text-blue-400 shadow-sm' : 'text-light-muted dark:text-dark-muted hover:text-light-primary dark:hover:text-dark-primary'}`}
             >
                {t('nav.home')}
             </button>
             <button 
                onClick={() => setTab('mine')}
                className={`flex-1 lg:flex-none px-6 py-2 rounded-md text-[12px] font-bold uppercase tracking-wider transition-all ${tab === 'mine' ? 'bg-light-surface dark:bg-dark-surface text-brand-blue dark:text-blue-400 shadow-sm' : 'text-light-muted dark:text-dark-muted hover:text-light-primary dark:hover:text-dark-primary'}`}
             >
                {t('nav.myIssues')}
             </button>
          </div>
        )}

        <div className="h-8 w-px bg-light-border dark:border-dark-border hidden lg:block mx-2" />

        {/* Tactical Search */}
        <div className="relative flex-1 group">
           <div className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted group-focus-within:text-brand-blue transition-colors">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
           </div>
           <input
             type="text"
             className="input pl-10 h-11 text-sm font-medium border-light-border/60 transition-colors"
              placeholder={t('createIssue.searchPlaceholder', 'Search by category, title or description...')}
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
           {FILTERS.map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`whitespace-nowrap px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all ${
                 filter === f
                   ? 'bg-brand-blue dark:bg-blue-600 border-transparent text-white shadow-lg shadow-brand-blue/20'
                   : 'bg-transparent border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-brand-blue/30 hover:text-light-primary dark:hover:text-dark-primary'
               }`}
             >
               {f === 'ALL' ? t('common.all') : t(`status.${f}`)}
             </button>
           ))}
        </div>
      </div>

      {/* ── Results Container ── */}
      <div className="min-h-[400px]">
         {loading ? (
           <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Spinner />
              <p className="text-light-muted dark:text-dark-muted text-[13px] font-bold uppercase tracking-[0.2em]">{t('common.loading')}</p>
           </div>
         ) : error ? (
           <AlertMessage type="error" message={error} />
         ) : visible.length === 0 ? (
           <EmptyState search={search} filter={filter} tab={tab} t={t} />
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {visible.map((issue) => (
               <IssueCard key={issue.id} issue={issue} />
             ))}
           </div>
         )}
      </div>
    </div>
  )
}

function EmptyState({ search, filter, tab, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade">
      <div className="w-20 h-20 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border flex items-center justify-center text-light-muted dark:text-dark-muted mb-6 shadow-sm">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h3 className="text-xl font-display font-bold text-light-primary dark:text-dark-primary mb-2">{t('dashboard.noIssues')}</h3>
      <p className="text-light-muted dark:text-dark-muted max-w-sm font-medium text-sm leading-relaxed">
        {search ? t('dashboard.registryClear') :
         filter !== 'ALL' ? t('dashboard.noIssues') :
         tab === 'mine' ? t('dashboard.noIssuesSub') :
         t('dashboard.registryClear')}
      </p>
      {tab === 'mine' && !search && (
        <Link to="/issues/new" className="btn btn-primary mt-8 px-8 h-12">{t('dashboard.reportNew')}</Link>
      )}
    </div>
  )
}

const BarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
)
const PenIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
)
const GearIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m2.786 14.33l-.151-1.49m-11.87-11.725l-.152-1.49M19.795 16.5l-1.3-.75m-12.99-7.5l-1.3-.75m14.33-2.786l-1.49.151m-11.725 11.87l-1.49.152" /></svg>
)
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
)

