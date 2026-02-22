/**
 * Format ISO date string to readable format.
 * @param {string} iso
 */
export function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  }).format(new Date(iso))
}

/**
 * Format relative time (e.g. "3 days ago")
 * @param {string} iso
 */
export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return formatDate(iso)
}

/**
 * Extract a user-friendly error message from an Axios error.
 * @param {any} err
 */
export function extractError(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error  ||
    err?.message ||
    'Something went wrong. Please try again.'
  )
}

/**
 * Map IssueStatus → display label and colour class.
 */
export const STATUS_META = {
  PENDING:     { label: 'Pending',     css: 'badge-pending'  },
  IN_PROGRESS: { label: 'In Progress', css: 'badge-progress' },
  RESOLVED:    { label: 'Resolved',    css: 'badge-resolved' },
}

export const CATEGORY_OPTIONS = [
  'Roads & Potholes',
  'Streetlights',
  'Drainage & Flooding',
  'Garbage & Waste',
  'Parks & Recreation',
  'Public Safety',
  'Water Supply',
  'Noise Pollution',
  'Infrastructure',
  'Other',
]
