import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { timeAgo } from '../utils/helpers'

export default function IssueCard({ issue }) {
  const navigate = useNavigate()

  return (
    <div
      className="card-hover group"
      onClick={() => navigate(`/issues/${issue.id}`)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-base leading-snug
                         group-hover:text-civic-400 transition-colors truncate">
            {issue.title}
          </h3>
          <p className="text-ink-400 text-xs mt-0.5">{issue.category}</p>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      <p className="text-ink-300 text-sm leading-relaxed line-clamp-2 mb-4">
        {issue.description}
      </p>

      <div className="flex items-center justify-between text-xs text-ink-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-ink-700 flex items-center justify-center text-[9px] text-ink-400 font-bold">
            {issue.createdBy?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span>{issue.createdBy?.name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-3">
          {issue.comments?.length > 0 && (
            <span className="flex items-center gap-1">
              <CommentIcon /> {issue.comments.length}
            </span>
          )}
          <span>{timeAgo(issue.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

const CommentIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
