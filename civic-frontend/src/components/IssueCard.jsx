import { Link } from 'react-router-dom'
import { timeAgo } from '../utils/helpers'
import StatusBadge from './StatusBadge'

const ZONE_COLORS = {
  NORTH:   'text-blue-500 bg-blue-500/5',
  SOUTH:   'text-amber-500 bg-amber-500/5',
  EAST:    'text-purple-500 bg-purple-500/5',
  WEST:    'text-orange-500 bg-orange-500/5',
  CENTRAL: 'text-brand-blue bg-brand-blue/5',
}

export default function IssueCard({ issue }) {
  const isResolved = issue.status === 'RESOLVED'

  return (
    <Link
      to={`/issues/${issue.id}`}
      className="group relative block bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-blue/30 transition-all duration-500"
    >
      {/* Verify Fix Banner */}
      {isResolved && (
        <div className="bg-brand-saffron/10 border-b border-brand-saffron/20 px-6 py-2 flex items-center justify-between">
           <span className="text-[10px] font-black text-brand-saffron uppercase tracking-[0.2em]">
              Verification Required
           </span>
           <div className="w-1.5 h-1.5 rounded-full bg-brand-saffron animate-pulse" />
        </div>
      )}

      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
           <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                 {issue.zone && (
                   <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-current/10 ${ZONE_COLORS[issue.zone] || 'text-light-muted bg-light-bg'}`}>
                     {issue.zone}
                   </span>
                 )}
                 <span className="text-[8px] sm:text-[9px] font-black text-light-muted uppercase tracking-widest bg-light-bg dark:bg-dark-bg px-2 py-0.5 rounded-full border border-light-border dark:border-dark-border">
                   {issue.category}
                 </span>
              </div>
              <h3 className="text-lg sm:text-xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight leading-tight group-hover:text-brand-blue transition-colors truncate">
                {issue.title}
              </h3>
           </div>
           <div className="self-start sm:self-auto">
              <StatusBadge status={issue.status} />
           </div>
        </div>

        <p className="text-[14px] font-medium text-light-secondary dark:text-dark-secondary leading-relaxed line-clamp-2 h-[44px] mb-8 opacity-80">
          {issue.description}
        </p>

        {/* Footer Logistics */}
        <div className="flex items-center justify-between pt-6 border-t border-light-border/40 dark:border-dark-border/40">
           <div className="flex items-center gap-4 min-w-0">
              {issue.imageUrl ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                   <img src={issue.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-light-bg dark:bg-dark-bg flex items-center justify-center text-light-muted/30 border border-light-border dark:border-dark-border flex-shrink-0">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                </div>
              )}
              <div className="flex flex-col min-w-0">
                 <span className="text-[11px] font-black text-light-muted uppercase tracking-[0.15em] mb-0.5">{timeAgo(issue.createdAt)}</span>
                 <span className="text-[13px] font-bold text-light-primary dark:text-dark-primary truncate group-hover:text-brand-blue/70 transition-colors">
                   {issue.assignedToName || 'Pending Assignment'}
                 </span>
              </div>
           </div>

           <div className="flex items-center gap-2 bg-light-bg dark:bg-dark-bg border border-light-border/60 dark:border-dark-border/60 px-3 py-1.5 rounded-xl shadow-sm">
              <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 1.65 1.65 0 00.33-1.583c-.39-.888-.66-1.825-.66-2.822 0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
              <span className="text-[11px] font-black text-light-primary dark:text-dark-primary">{issue.comments?.length || 0}</span>
           </div>
        </div>
      </div>

      {/* Hover Identification Line */}
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-brand-blue group-hover:w-full transition-all duration-700" />
    </Link>
  )
}