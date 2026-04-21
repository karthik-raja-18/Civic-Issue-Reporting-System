import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import StatusBadge from './StatusBadge'
import UpvoteButton from './UpvoteButton'
import { timeAgo } from '../utils/helpers'

const ZONE_COLORS = {
  NORTH:   'text-blue-500   bg-blue-500/10   border-blue-500/30',
  SOUTH:   'text-amber-500  bg-amber-500/10  border-amber-500/30',
  EAST:    'text-purple-500 bg-purple-500/10 border-purple-500/30',
  WEST:    'text-orange-500 bg-orange-500/10 border-orange-500/30',
  CENTRAL: 'text-teal-500   bg-teal-500/10   border-teal-500/30',
}

export default function IssueCard({ issue, showUpvote = true }) {
  const { t }    = useTranslation()
  const { user } = useAuth()

  const isOwnIssue  = issue.createdBy?.email === user?.email
  const isAdminView = user?.role === 'ADMIN' || user?.role === 'REGIONAL_ADMIN'
  const zoneClass   = ZONE_COLORS[issue.zone] || 'text-[#8B949E] bg-transparent border-[#30363D]'

  // Priority badge logic
  const priority = issue.priorityScore || 0
  const priorityBadge =
    priority >= 80 ? { label: 'CRITICAL',  bg: 'bg-red-500/10    text-red-500    border-red-500/30' }
  : priority >= 60 ? { label: 'HIGH',      bg: 'bg-orange-500/10 text-orange-500 border-orange-500/30' }
  : priority >= 40 ? { label: 'MEDIUM',    bg: 'bg-amber-500/10  text-amber-500  border-amber-500/30' }
  :                  null

  return (
    <div className="bg-white dark:bg-[#161B22]
                    border border-[#D0D7DE] dark:border-[#30363D]
                    rounded-lg overflow-hidden
                    hover:border-[#1B3A6B]/40 dark:hover:border-[#4A90D9]/40
                    transition-colors duration-150 group">

      {/* Priority accent bar — only if high priority */}
      {priorityBadge && (
        <div className={`h-0.5 w-full ${
          priority >= 80 ? 'bg-red-500' :
          priority >= 60 ? 'bg-orange-500' : 'bg-amber-500'
        }`} />
      )}

      <div className="p-5">
        {/* Top row — badges */}
        <div className="flex items-center flex-wrap gap-2 mb-3">
          {/* Status */}
          <StatusBadge status={issue.status} />

          {/* Zone */}
          {issue.zone && issue.zone !== 'UNASSIGNED' && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5
                             rounded border ${zoneClass}`}>
              {t(`zones.${issue.zone}`, issue.zone)}
            </span>
          )}

          {/* Category */}
          <span className="text-[10px] font-medium px-2 py-0.5 rounded
                           bg-[#F5F7FA] dark:bg-[#0D1117]
                           border border-[#D0D7DE] dark:border-[#30363D]
                           text-[#57606A] dark:text-[#8B949E]">
            {t(`categories.${issue.category}`, issue.category)}
          </span>

          {/* Priority badge */}
          {priorityBadge && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5
                             rounded border ${priorityBadge.bg}`}>
              {priorityBadge.label}
            </span>
          )}

          {/* Resolve prompt */}
          {issue.status === 'RESOLVED' && isOwnIssue && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded
                             bg-[#F4811F]/10 border border-[#F4811F]/30 text-[#F4811F]
                             animate-pulse">
              ⚡ Verify Fix
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/issues/${issue.id}`}
          className="block font-display font-bold text-[#1C2526] dark:text-[#E6EDF3]
                     text-base leading-snug mb-1.5
                     group-hover:text-[#1B3A6B] dark:group-hover:text-[#4A90D9]
                     transition-colors">
          {issue.title}
        </Link>

        {/* Description */}
        <p className="text-[#57606A] dark:text-[#8B949E] text-sm
                      line-clamp-2 leading-relaxed mb-4">
          {issue.description}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between gap-3">

          {/* Left — meta info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Evidence photo thumbnail */}
            {issue.imageUrl && (
              <img
                src={issue.imageUrl.replace('/upload/', '/upload/w_56,h_56,c_fill,f_auto,q_60/')}
                alt="Evidence"
                className="w-9 h-9 rounded-md object-cover flex-shrink-0
                           border border-[#D0D7DE] dark:border-[#30363D]"
                onError={e => e.target.style.display = 'none'}
              />
            )}

            <div className="min-w-0">
              <p className="text-[#8C959F] text-xs truncate">
                #{issue.id} · {timeAgo(issue.createdAt)}
              </p>
              {issue.assignedTo && (
                <p className="text-[#1B3A6B] dark:text-[#4A90D9] text-xs
                             font-medium truncate">
                  📌 {issue.assignedTo.name}
                </p>
              )}
            </div>
          </div>

          {/* Right — upvote button */}
          {showUpvote && !isAdminView && (
            <UpvoteButton
              issueId={issue.id}
              initialCount={issue.upvoteCount || 0}
              initialVoted={issue.hasUpvoted || false}
              disabled={isOwnIssue || issue.status === 'CLOSED'}
              size="sm"
            />
          )}

          {/* Admin view — show priority score instead */}
          {isAdminView && (
            <div className="text-right flex-shrink-0">
              <p className="text-[#8C959F] text-[10px]">Priority</p>
              <p className={`font-mono font-bold text-sm ${
                priority >= 80 ? 'text-red-500'    :
                priority >= 60 ? 'text-orange-500' :
                priority >= 40 ? 'text-amber-500'  : 'text-[#57606A]'
              }`}>
                {Math.round(priority)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
