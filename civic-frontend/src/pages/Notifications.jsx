import { useState, useEffect } from 'react'
import { notificationApi } from '../api/notificationApi'
import { timeAgo } from '../utils/helpers'
import Spinner from '../components/Spinner'
import AlertMessage from '../components/AlertMessage'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    notificationApi.getAll()
      .then((res) => setNotifications(res.data.data || []))
      .catch(() => setError('Notification feed currently unavailable.'))
      .finally(() => setLoading(false))
  }, [])

  const unread = notifications.filter(n => !n.read)
  const read   = notifications.filter(n => n.read)

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20 animate-fade">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-light-border dark:border-dark-border pb-10">
        <div>
          <h1 className="text-4xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-2">
            Notifications
          </h1>
          <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
             Recent Updates
          </p>
        </div>
        {unread.length > 0 && (
           <div className="bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-xl border border-brand-blue/20 text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
              {unread.length} Pending Actions
           </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Spinner size="lg" />
           <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] animate-pulse">Loading Notifications...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto">
           <AlertMessage type="error" message={error} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <div className="space-y-12">
          {/* Unread */}
          {unread.length > 0 && (
            <section className="animate-slide-up">
              <h2 className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] mb-6 px-1 flex items-center gap-4">
                 New
                 <div className="h-px flex-1 bg-light-border dark:bg-dark-border opacity-50" />
              </h2>
              <div className="space-y-4">
                {unread.map((n) => <NotificationItem key={n.id} n={n} />)}
              </div>
            </section>
          )}

          {/* Read */}
          {read.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-[11px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] mb-6 px-1 flex items-center gap-4">
                 Earlier
                 <div className="h-px flex-1 bg-light-border dark:bg-dark-border opacity-50" />
              </h2>
              <div className="space-y-3">
                {read.map((n) => <NotificationItem key={n.id} n={n} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ n }) {
  const isPriority = !n.read
  
  return (
    <div className={`group relative flex items-start gap-6 p-6 rounded-2xl border transition-all duration-300 ${
      isPriority 
        ? 'bg-light-surface dark:bg-dark-surface border-brand-blue/30 shadow-lg shadow-brand-blue/5' 
        : 'bg-light-bg/50 dark:bg-dark-bg/50 border-light-border/40 dark:border-dark-border/40 grayscale opacity-70 hover:grayscale-0 hover:opacity-100'
    }`}>
      {/* Visual Indicator */}
      <div className={`mt-1.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
        isPriority ? 'bg-brand-blue/10 text-brand-blue shadow-inner' : 'bg-light-muted/10 text-light-muted'
      }`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
           <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-4">
           {isPriority && <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Update</span>}
           <span className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.1em] ml-auto">
              ID: {(Math.random() * 100000).toFixed(0)}
           </span>
        </div>
        <p className={`text-[15px] font-medium leading-relaxed tracking-tight ${
          isPriority ? 'text-light-primary dark:text-dark-primary' : 'text-light-secondary dark:text-dark-secondary'
        }`}>
          {n.message}
        </p>
        <div className="flex items-center gap-2 text-[11px] font-bold text-light-muted dark:text-dark-muted opacity-60 uppercase tracking-widest">
           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           {timeAgo(n.createdAt)}
        </div>
      </div>

      {isPriority && (
         <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-brand-blue shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
      )}
    </div>
  )
}

function EmptyNotifications() {
  return (
    <div className="text-center py-32 px-6 border-2 border-dashed border-light-border dark:border-dark-border rounded-[2.5rem] animate-fade">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border mb-8 shadow-sm">
        <svg className="w-10 h-10 text-light-muted dark:text-dark-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </div>
      <h3 className="text-2xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-2">No Notifications</h3>
      <p className="text-light-muted dark:text-dark-muted font-bold text-[13px] uppercase tracking-widest leading-loose">
        You have no new notifications.<br/>
        Updates will appear here automatically.
      </p>
    </div>
  )
}
