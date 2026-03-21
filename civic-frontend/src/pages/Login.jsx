import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AlertMessage from '../components/AlertMessage'
import Spinner from '../components/Spinner'
import GoogleLoginButton from '../components/GoogleLoginButton'
import logo from '../assets/logo.png'

export default function Login() {
  const { login, loading, error, clearError, isAuthenticated } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'
  const searchParams = new URLSearchParams(location.search)
  const urlParamsError = searchParams.get('error')

  const [form, setForm] = useState({ email: '', password: '' })

  useEffect(() => {
    if (isAuthenticated) {
      const role = localStorage.getItem('civicpulse-role')
      if (role === 'ADMIN') navigate('/admin', { replace: true })
      else if (role === 'REGIONAL_ADMIN') navigate('/regional', { replace: true })
      else navigate(from, { replace: true })
    }
  }, [isAuthenticated, from, navigate])

  const handleChange = (e) => {
    clearError()
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login({ email: form.email, password: form.password })
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F7FA] dark:bg-[#0D1117] font-body transition-colors duration-300">
      
      {/* ── Advanced CSS Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;700&family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-up { animation: fadeInUp 0.4s ease forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }

        .hero-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.15;
          mix-blend-mode: overlay;
        }

        .hero-overlay {
          background: linear-gradient(
            to bottom,
            rgba(10, 22, 40, 0.2) 0%,
            rgba(10, 22, 40, 0.1) 40%,
            rgba(27, 58, 107, 0.7) 75%,
            rgba(10, 22, 40, 0.92) 100%
          );
        }

        .photo-card {
           background: rgba(255, 255, 255, 0.08);
           backdrop-filter: blur(12px);
           -webkit-backdrop-filter: blur(12px);
           border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .tamil-font { font-family: 'Noto Sans Tamil', sans-serif; }
      `}</style>

      {/* ── Left Panel (Desktop Branding) ── */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col justify-between p-12 overflow-hidden selection:bg-brand-saffron/30">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#F4811F] z-30" />
        
        {/* Hero Image Background */}
        <div className="absolute inset-0 bg-[#0A1628]">
          <img 
            src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=90" 
            alt="Coimbatore City" 
            className="w-full h-full object-cover blur-[0.5px] scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 z-10" style={{
            background: 'linear-gradient(to bottom, rgba(10,22,40,0.6) 0%, rgba(10,22,40,0.4) 40%, rgba(27,58,107,0.85) 75%, rgba(10,22,40,0.98) 100%)'
          }} />
          <div className="absolute inset-0 hero-noise z-20 pointer-events-none" />
        </div>

        {/* Top Header inside panel */}
        <div className="relative z-30 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Official Logo Integration */}
             <Link to="/" className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1.5 shadow-xl border border-white/20 hover:scale-110 transition-transform overflow-hidden">
                <img src={logo} alt="CivicPulse Logo" className="w-full h-full object-contain rounded-full" />
             </Link>
             <div className="h-10 w-px bg-white/30 mx-1" />
             <Link to="/" className="flex flex-col group">
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.25em] leading-tight">Government of Tamil Nadu</span>
                <span className="text-white font-display text-xl font-extrabold tracking-tight drop-shadow-md group-hover:text-brand-saffron transition-colors">CivicPulse Coimbatore</span>
             </Link>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-30 mb-auto mt-24 opacity-0 animate-fade-up">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-xl mb-6">
              <span className="w-2 h-2 rounded-full bg-[#128807] shadow-[0_0_8px_#128807]" />
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">District Portal — 2026</span>
           </div>
           
           <h1 className="text-5xl font-display font-extrabold text-white leading-[1.1] mb-6 drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
              Empowering Citizens of <br/>
              <span className="text-brand-saffron drop-shadow-sm">Coimbatore.</span>
           </h1>

           <div className="space-y-4 mb-10">
              <p className="tamil-font text-[18px] text-white font-semibold tracking-wide border-l-4 border-brand-saffron pl-4 bg-white/5 py-1">குடிமக்கள் சேவை — Citizen Services</p>
              <p className="text-sm text-white/80 leading-relaxed max-w-sm font-medium drop-shadow-md">
                 Official digital infrastructure for localized reporting, infrastructure tracking, and administrative resolution.
              </p>
           </div>

           <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                ['📍', 'GPS Reporting', 'Auto-tagged coordinates'],
                ['🤖', 'AI Verified', 'Advanced image validation'],
                ['📊', 'Zone Tracking', 'Real-time performance'],
                ['🔔', 'Live Updates', 'Direct SMS & push alerts'],
              ].map(([icon, title, sub]) => (
                <div key={title} className="flex gap-3 items-start group">
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {icon}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-white/90">{title}</span>
                      <span className="text-[11px] text-white/50">{sub}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Bottom Photo Strip Overlay */}
        <div className="relative z-30 flex gap-4 mt-12 opacity-0 animate-fade-up delay-100">
           {[
             ['Road Repair', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70'],
             ['Clean Streets', 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=400&q=70'],
             ['Lighting', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=70']
           ].map(([label, url]) => (
             <div key={label} className="photo-card p-1.5 w-[140px] transition-all hover:-translate-y-1 cursor-default">
                <div className="h-20 rounded-lg overflow-hidden mb-2">
                   <img src={url} alt={label} className="w-full h-full object-cover" />
                </div>
                <div className="px-1 py-0.5">
                   <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest leading-none">{label}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Footer info in panel */}
        <div className="relative z-30 border-t border-white/10 pt-8 mt-12 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-saffron">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                 </svg>
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Technological Partner</span>
                 <span className="text-[11px] text-white/80 font-bold">Tamil Nadu e-Governance Agency</span>
              </div>
           </div>
           <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Digital India 2026</span>
        </div>
      </div>

      {/* ── Right Panel (Form Section) ── */}
      <div className="flex-1 flex flex-col relative overflow-y-auto selection:bg-[#1B3A6B]/10">
        <div className="absolute top-0 right-0 w-full h-[3px] bg-[#F4811F] z-10" />
        
        {/* Mobile Header Banner */}
        <div className="lg:hidden h-48 relative overflow-hidden flex items-center justify-center">
           <img 
             src="https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80" 
             className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
             alt="Banner" 
           />
           <div className="absolute inset-0 bg-[#1B3A6B]/85 backdrop-blur-sm" />
           <div className="relative z-10 text-center px-6">
              <h2 className="text-3xl font-display font-extrabold text-white">CivicPulse</h2>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Coimbatore District Municipal Portal</p>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-16">
           <div className="w-full max-w-[420px] opacity-0 animate-fade-up delay-100">
              
              {/* CMC Seal CSS/SVG */}
              <Link to="/" className="flex justify-center mb-6 focus:outline-none">
                 <div className="p-1 rounded-full bg-white dark:bg-dark-surface shadow-md border border-[#1B3A6B]/10 transition-all hover:rotate-3 hover:scale-110 duration-500">
                    <svg viewBox="0 0 100 100" width="56" height="56">
                      <circle cx="50" cy="50" r="48" fill="none" stroke="#1B3A6B" strokeWidth="2.5" className="dark:stroke-blue-400" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#1B3A6B" strokeWidth="0.5" opacity="0.4" className="dark:stroke-blue-400" />
                      <g transform="translate(50,50)">
                         {[...Array(8)].map((_, i) => (
                           <line key={i} x1="0" y1="8" x2="0" y2="24" stroke="#1B3A6B" strokeWidth="2" transform={`rotate(${i * 45})`} className="dark:stroke-blue-400" />
                         ))}
                      </g>
                      <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1B3A6B" className="dark:fill-[#E6EDF3]">CMC</text>
                      <path id="topArcText" fill="none" d="M 15,50 A 35,35 0 0,1 85,50"/>
                      <text fontSize="7.5" fill="#1B3A6B" fontWeight="700" className="dark:fill-blue-400 uppercase tracking-tighter">
                        <textPath href="#topArcText" startOffset="10%">COIMBATORE CITY</textPath>
                      </text>
                      <path id="botArcText" fill="none" d="M 15,50 A 35,35 0 0,0 85,50"/>
                      <text fontSize="7.5" fill="#1B3A6B" fontWeight="700" className="dark:fill-blue-400 uppercase tracking-tighter">
                        <textPath href="#botArcText" startOffset="11%">MUNICIPAL CORP.</textPath>
                      </text>
                    </svg>
                 </div>
              </Link>

              <div className="text-center mb-8">
                 <h1 className="text-2xl font-display font-extrabold text-[#1C2526] dark:text-[#E6EDF3] tracking-tight">Sign In to CivicPulse</h1>
                 <p className="text-[13px] text-[#57606A] dark:text-[#8B949E] mt-2 font-medium">District Civic Services & Grievance Portal</p>
              </div>

               <AlertMessage 
                 type="error" 
                 message={
                   urlParamsError === 'account_not_registered' ? "Account does not exist! Please create an account via Manual Registration first." :
                   urlParamsError === 'account_already_exists' ? "Account already exists! Please login here instead." :
                   error
                 } 
                 onDismiss={() => {
                   clearError()
                   navigate('/login', { replace: true })
                 }} 
               />

              <div className="space-y-3 mb-6">
                 <GoogleLoginButton className="shadow-sm border-[#D0D7DE] dark:border-[#30363D] h-11" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                 <div className="flex-1 h-px bg-[#D0D7DE] dark:bg-[#30363D]" />
                 <span className="text-[10px] font-black text-[#8C959F] uppercase tracking-widest px-2">Institutional Access</span>
                 <div className="flex-1 h-px bg-[#D0D7DE] dark:bg-[#30363D]" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#1C2526] dark:text-[#E6EDF3] uppercase tracking-[0.15em] ml-1">Email ID</label>
                    <input 
                      type="email" name="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="you@coimbatore.tn.gov.in"
                      className="w-full h-11 px-4 rounded-xl border border-[#D0D7DE] dark:border-[#30363D] bg-white dark:bg-[#0D1117] text-sm text-[#1C2526] dark:text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] transition-all placeholder:text-[#8C959F]"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                       <label className="text-[11px] font-bold text-[#1C2526] dark:text-[#E6EDF3] uppercase tracking-[0.15em]">Security PIN</label>
                       <Link to="/forgot-password" size="sm" className="text-[11px] font-bold text-[#1B3A6B] dark:text-blue-400 hover:underline">Forgot Access?</Link>
                    </div>
                    <input 
                      type="password" name="password" required
                      value={form.password} onChange={handleChange}
                      placeholder="••••••••••••"
                      className="w-full h-11 px-4 rounded-xl border border-[#D0D7DE] dark:border-[#30363D] bg-white dark:bg-[#0D1117] text-sm text-[#1C2526] dark:text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] transition-all placeholder:text-[#8C959F]"
                    />
                 </div>

                 <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full h-12 rounded-xl bg-[#1B3A6B] hover:bg-[#142d54] active:bg-[#0a1b38] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#1B3A6B]/10 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 disabled:grayscale-[0.5]"
                 >
                   {loading ? <Spinner size="sm" /> : <>Access System Portal</>}
                 </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#D0D7DE]/50 dark:border-[#30363D]/50 text-center">
                 <p className="text-sm text-[#57606A] dark:text-[#8B949E] font-medium">
                    New Citizen User? <Link to="/register" className="text-[#F4811F] font-bold hover:underline ml-1">Establish verified account</Link>
                 </p>
              </div>

              {/* Security Note & Tricolor */}
              <div className="mt-12 flex flex-col items-center gap-6">
                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1B3A6B]/5 dark:bg-white/5 border border-[#1B3A6B]/10 dark:border-white/10">
                    <span className="text-xs">🔒</span>
                    <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-blue-200 uppercase tracking-widest">256-bit SSL secured · Govt. of Tamil Nadu</span>
                 </div>

                 <div className="flex flex-col items-center gap-3">
                    <div className="flex flex-col w-12 h-6 border-[0.5px] border-black/5 overflow-hidden rounded-sm shadow-sm">
                       <div className="h-1/3 bg-[#FF9933]" />
                       <div className="h-1/3 bg-white flex items-center justify-center">
                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#000080" strokeWidth="2">
                             <circle cx="12" cy="12" r="10" />
                             {[...Array(24)].map((_, i) => (
                               <line key={i} x1="12" y1="2" x2="12" y2="12" transform={`rotate(${i * 15} 12 12)`} />
                             ))}
                          </svg>
                       </div>
                       <div className="h-1/3 bg-[#138808]" />
                    </div>
                    <p className="text-[9px] text-[#8C959F] font-black uppercase tracking-[0.3em] text-center">
                       © 2026 Coimbatore Smart City Initiative
                    </p>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  )
}
