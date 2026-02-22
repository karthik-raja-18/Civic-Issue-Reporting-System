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
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false))
  }, [])

  const unread = notifications.filter(n => !n.read)
  const read   = notifications.filter(n => n.read)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 page-wrapper">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unread.length > 0 && (
            <p className="text-ink-400 text-sm mt-0.5">
              <span className="text-civic-400 font-medium">{unread.length} unread</span> notification{unread.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner center />
      ) : error ? (
        <AlertMessage type="error" message={error} />
      ) : notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <div className="space-y-4">
          {/* Unread */}
          {unread.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-2 px-1">Unread</h2>
              <div className="space-y-2">
                {unread.map((n) => <NotificationItem key={n.id} n={n} />)}
              </div>
            </section>
          )}

          {/* Read */}
          {read.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-ink-500 uppercase tracking-widest mb-2 px-1 mt-4">Earlier</h2>
              <div className="space-y-2">
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
  return (
    <div className={`card flex items-start gap-3 transition-all ${!n.read ? 'border-civic-500/30 bg-civic-500/5' : ''}`}>
      {/* Dot indicator */}
      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-civic-500' : 'bg-ink-700'}`} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${!n.read ? 'text-ink-100' : 'text-ink-400'}`}>
          {n.message}
        </p>
        <p className="text-xs text-ink-600 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
    </div>
  )
}

function EmptyNotifications() {
  return (
    <div className="text-center py-20 animate-fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink-800 mb-4">
        <svg className="w-7 h-7 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
      </div>
      <p className="text-ink-300 font-medium">No notifications yet</p>
      <p className="text-ink-500 text-sm mt-1">
        You&apos;ll get notified when your issue status changes.
      </p>
    </div>
  )
}
