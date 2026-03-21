export default function StatusBadge({ status }) {
  const statusConfig = {
    PENDING: { 
      label: 'Pending Inquiry', 
      bg: 'bg-brand-saffron/5', 
      text: 'text-brand-saffron', 
      border: 'border-brand-saffron/20',
      dot: 'bg-brand-saffron'
    },
    IN_PROGRESS: { 
      label: 'Under Investigation', 
      bg: 'bg-gov-info/5', 
      text: 'text-gov-info', 
      border: 'border-gov-info/20',
      dot: 'bg-gov-info'
    },
    RESOLVED: { 
      label: 'Action Completed', 
      bg: 'bg-gov-success/5', 
      text: 'text-gov-success', 
      border: 'border-gov-success/20',
      dot: 'bg-gov-success'
    },
    CLOSED: { 
      label: 'Case Closed', 
      bg: 'bg-light-muted/5 dark:bg-dark-muted/5', 
      text: 'text-light-muted dark:text-dark-muted font-bold', 
      border: 'border-light-border dark:border-dark-border',
      dot: 'bg-current opacity-40'
    },
    REOPENED: { 
      label: 'Reactivated', 
      bg: 'bg-gov-danger/5', 
      text: 'text-gov-danger', 
      border: 'border-gov-danger/20',
      dot: 'bg-gov-danger'
    },
  }

  const config = statusConfig[status] || { 
    label: status.replace(/_/g, ' '), 
    bg: 'bg-light-muted/5 dark:bg-dark-muted/5', 
    text: 'text-light-secondary dark:text-dark-secondary', 
    border: 'border-light-border dark:border-dark-border',
    dot: 'bg-current opacity-40'
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 h-[24px] rounded-full text-[10px] font-bold tracking-[0.05em] uppercase border shadow-sm transition-all duration-300 ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
      {config.label}
    </span>
  )
}

