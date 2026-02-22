export default function AlertMessage({ type = 'error', message, onDismiss }) {
  if (!message) return null

  const styles = {
    error:   'bg-red-500/10 border-red-500/30 text-red-400',
    success: 'bg-civic-500/10 border-civic-500/30 text-civic-400',
    info:    'bg-blue-500/10 border-blue-500/30 text-blue-400',
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm animate-fade-in ${styles[type]}`}>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity text-lg leading-none -mt-0.5">
          ×
        </button>
      )}
    </div>
  )
}
