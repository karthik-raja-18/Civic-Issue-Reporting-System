export default function AlertMessage({ type = 'error', message, onDismiss }) {
  if (!message) return null

  const styles = {
    error:   'bg-gov-danger/5 border-gov-danger/20 text-gov-danger shadow-gov-danger/5',
    success: 'bg-gov-success/5 border-gov-success/20 text-gov-success shadow-gov-success/5',
    info:    'bg-brand-blue/5 border-brand-blue/20 text-brand-blue shadow-brand-blue/5',
    warning: 'bg-brand-saffron/5 border-brand-saffron/20 text-brand-saffron shadow-brand-saffron/5',
  }

  const icons = {
    error:   <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
    success: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info:    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
    warning: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" /></svg>,
  }

  return (
    <div className={`flex items-start gap-4 px-6 py-4 rounded-2xl border text-[13px] font-bold shadow-lg animate-fade tracking-tight ${styles[type] || styles.error}`}>
      <span className="flex-shrink-0">{icons[type] || icons.error}</span>
      <span className="flex-1 leading-relaxed opacity-90">{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="opacity-40 hover:opacity-100 transition-opacity p-1 -mr-2 -mt-1"
          aria-label="Dismiss System Alert"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  )
}

