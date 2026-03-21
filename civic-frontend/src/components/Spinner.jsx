export default function Spinner({ size = 'md', center = false }) {
  const sizes = { 
    sm: 'w-4 h-4', 
    md: 'w-7 h-7', 
    lg: 'w-12 h-12' 
  }

  const el = (
    <div className={`${sizes[size]} relative`}>
      <svg className="animate-spin text-brand-blue" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0110 10h-2a8 8 0 00-8-8V2z" />
      </svg>
    </div>
  )

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade">
        {el}
        <span className="text-[10px] font-black text-light-muted uppercase tracking-[0.3em] opacity-40">System Processing...</span>
      </div>
    )
  }
  return el
}

