import { Link } from 'react-router-dom'
import { timeAgo, STATUS_META } from '../utils/helpers'
import StatusBadge from './StatusBadge'

const ZONE_COLORS = {
  NORTH:   'text-blue-400',
  SOUTH:   'text-amber-400',
  EAST:    'text-purple-400',
  WEST:    'text-orange-400',
  CENTRAL: 'text-civic-400',
}

export default function IssueCard({ issue }) {
  const meta = STATUS_META[issue.status] || {}

  return (
    <Link
      to={`/issues/${issue.id}`}
      className="card border-ink-700 hover:border-ink-600 transition-all
                 hover:shadow-lg hover:-translate-y-0.5 group block"
    >
      {/* ✅ Evidence image thumbnail */}
      {issue.imageUrl ? (
        <div className="relative -mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden h-40">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.parentElement.className =
                'relative -mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden h-40 ' +
                'bg-ink-800 flex items-center justify-center'
              e.target.replaceWith(
                Object.assign(document.createElement('div'), {
                  className: 'text-ink-600 text-xs',
                  textContent: 'Image unavailable',
                })
              )
            }}
          />
          {/* Category overlay on image */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent
                          px-3 py-2">
            <span className="text-xs text-white/80 font-medium">{issue.category}</span>
          </div>
        </div>
      ) : (
        /* No image — show category icon placeholder */
        <div className="-mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden h-24
                        bg-ink-800 flex items-center justify-center border-b border-ink-700">
          <div className="flex flex-col items-center gap-1 text-ink-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span className="text-xs">{issue.category}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-ink-100 text-sm leading-snug
                       line-clamp-2 group-hover:text-white transition-colors flex-1">
          {issue.title}
        </h3>
        <StatusBadge status={issue.status} size="sm" />
      </div>

      <p className="text-ink-400 text-xs line-clamp-2 mb-3 leading-relaxed">
        {issue.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-ink-500 pt-2
                      border-t border-ink-800">
        <div className="flex items-center gap-3">
          <span>{timeAgo(issue.createdAt)}</span>
          {issue.zone && issue.zone !== 'UNASSIGNED' && (
            <span className={`font-mono font-bold ${ZONE_COLORS[issue.zone] || 'text-ink-500'}`}>
              {issue.zone}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {issue.comments?.length || 0}
        </div>
      </div>
    </Link>
  )
}