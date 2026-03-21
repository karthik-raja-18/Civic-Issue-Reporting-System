import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 animate-fade">
      <div className="relative mb-8">
        <div className="text-[12rem] font-black font-display text-light-border dark:text-dark-border select-none leading-none opacity-50">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-24 h-24 rounded-3xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-2xl animate-pulse">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" /></svg>
           </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-display font-black text-light-primary dark:text-dark-primary tracking-tight mb-4">
        Resource Unreachable
      </h1>
      <p className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-[0.25em] max-w-md mx-auto mb-12 opacity-60">
        The requested administrative registry path is either invalid or decommissioned from the central governance network.
      </p>
      
      <Link 
        to="/dashboard" 
        className="h-14 px-10 bg-brand-blue text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-blue/20 hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        Return to Command
      </Link>
    </div>
  )
}
