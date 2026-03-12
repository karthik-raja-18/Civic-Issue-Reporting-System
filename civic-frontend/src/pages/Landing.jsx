import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="bg-ink-950 text-white min-h-screen font-sans selection:bg-civic-500/30">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-civic-400 to-civic-600 flex items-center justify-center shadow-lg shadow-civic-500/20">
              <Logomark />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">CivicPulse</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary py-2 px-5 rounded-full scale-95 hover:scale-100 transition-transform">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-ink-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary py-2 px-5 rounded-full shadow-lg shadow-civic-500/10">
                  Join Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-civic-500/10 blur-[120px] -z-10 rounded-full" />
        
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-civic-400 text-xs font-semibold mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-civic-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-civic-500"></span>
            </span>
            Empowering Coimbatore Neighborhoods
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-[1.1] mb-6 animate-slide-up">
            Report Issues. <br />
            <span className="bg-gradient-to-r from-civic-400 to-emerald-400 bg-clip-text text-transparent">
              Drive Real Change.
            </span>
          </h1>
          
          <p className="text-ink-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-slide-up delay-100">
            A transparent platform for citizens to report civic problems and for local authorities 
             to resolve them efficiently. Let's build a better Coimbatore together.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link to="/issues/new" className="w-full sm:w-auto btn-primary text-base py-4 px-10 rounded-2xl flex items-center justify-center gap-2 group">
              Report an Issue
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto px-10 py-4 rounded-2xl border border-ink-800 bg-ink-900/50 hover:bg-ink-800 text-ink-100 transition-all">
              Explore Problems
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-12 border-y border-white/5 bg-ink-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem label="Active Users" value="2,400+" />
            <StatItem label="Issues Reported" value="1,850+" />
            <StatItem label="Resolved" value="92%" />
            <StatItem label="Avg. Response" value="24h" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-4xl font-display font-bold">How it works</h2>
              <div className="space-y-12">
                <FeatureItem 
                  num="01" 
                  title="Snap & Report" 
                  desc="Take a photo of any civic issue—potholes, street lights, or waste—and upload it with a single tap." 
                />
                <FeatureItem 
                  num="02" 
                  title="Track in Real-time" 
                  desc="Watch your report move through stages. Get notified when an admin visits or starts work." 
                />
                <FeatureItem 
                  num="03" 
                  title="Verify Resolution" 
                  desc="Once resolved, you'll get a proof photo. You can confirm the fix or reopen it if not satisfied." 
                />
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-civic-500/20 blur-3xl rounded-full" />
              <div className="relative rounded-3xl border border-white/10 bg-ink-900 p-8 shadow-2xl">
                 {/* Mock UI Element */}
                 <div className="space-y-4">
                   <div className="h-4 w-32 bg-ink-800 rounded-full" />
                   <div className="h-40 w-full bg-ink-800 rounded-2xl flex items-center justify-center">
                      <svg className="w-12 h-12 text-ink-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                   </div>
                   <div className="h-4 w-full bg-ink-800 rounded-full" />
                   <div className="h-4 w-2/3 bg-ink-800 rounded-full" />
                   <div className="flex gap-2 pt-2">
                     <div className="h-8 flex-1 bg-civic-500/20 border border-civic-500/30 rounded-lg" />
                     <div className="h-8 flex-1 bg-ink-800 rounded-lg" />
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-civic-600 to-emerald-700 rounded-[32px] p-12 text-center shadow-2xl shadow-civic-900/20">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to make a difference?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of citizens in Coimbatore who are actively improving their communities.
          </p>
          <Link to="/register" className="inline-flex bg-white text-emerald-900 font-bold px-10 py-4 rounded-2xl hover:bg-emerald-50 transition-colors shadow-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5 opacity-60 grayscale">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
              <Logomark />
            </div>
            <span className="font-display font-bold text-lg">CivicPulse</span>
          </div>
          <div className="flex gap-8 text-sm text-ink-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Coimbatore Gov</a>
          </div>
          <p className="text-xs text-ink-600 font-medium">
            © 2026 CivicPulse Reporting.
          </p>
        </div>
      </footer>
    </div>
  )
}

function StatItem({ label, value }) {
  return (
    <div className="text-center group">
      <div className="text-3xl font-display font-bold text-white mb-1 group-hover:text-civic-400 transition-colors">
        {value}
      </div>
      <div className="text-xs text-ink-500 uppercase tracking-widest font-semibold">{label}</div>
    </div>
  )
}

function FeatureItem({ num, title, desc }) {
  return (
    <div className="flex gap-6">
      <span className="font-display font-bold text-ink-700 text-3xl leading-none">{num}</span>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-ink-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

const Logomark = () => (
  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const ArrowRightIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)
