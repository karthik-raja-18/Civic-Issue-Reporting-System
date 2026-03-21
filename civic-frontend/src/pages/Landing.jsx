import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import tnSeal from '../assets/tn_seal.png'
import tnegaLogo from '../assets/tnega_logo.png'
import smartCityLogo from '../assets/smart_city_logo.png'
import heritageImg from '../assets/heritage.png'
import ghatsImg from '../assets/ghats.png'
import infraImg from '../assets/infra.png'

// Zone Imports
import zoneNorth from '../assets/zone_north.png'
import zoneSouth from '../assets/zone_south.png'
import zoneEast from '../assets/zone_east.png'
import zoneWest from '../assets/zone_west.png'
import zoneCentral from '../assets/zone_central.png'

export default function Landing() {
  const { isAuthenticated } = useAuth()

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F8F9FA] dark:bg-[#0D1117] min-h-screen font-body transition-colors duration-200 selection:bg-brand-blue/10">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;700&family=Noto+Sans+Tamil:wght@400;500;700&display=swap');
        .tamil-font { font-family: 'Noto Sans Tamil', sans-serif; }
        .gov-pattern { background-image: radial-gradient(#1B3A6B 0.5px, transparent 0.5px); background-size: 24px 24px; }
        .hero-gradient { background: linear-gradient(135deg, rgba(27, 58, 107, 0.05) 0%, rgba(244, 129, 31, 0.02) 100%); }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .zone-card:hover .zone-overlay { opacity: 1; }
      `}</style>

      {/* Institutional Top Bar */}
      <div className="bg-brand-blue min-h-[40px] py-1 flex flex-col sm:flex-row items-center justify-between px-4 lg:px-12 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border-b border-white/10">
        <div className="flex items-center gap-4 sm:gap-6">
           <span className="flex items-center gap-2">
              <img src={tnSeal} alt="TN Gov Seal" className="h-4 sm:h-[22px] w-auto object-contain" />
              <span className="truncate max-w-[120px] sm:max-w-none">Government of Tamil Nadu</span>
           </span>
           <span className="hidden md:inline-block opacity-60">District Administration, Coimbatore</span>
        </div>
        <div className="flex items-center gap-4 mt-1 sm:mt-0">
           <span className="hidden lg:inline-block">Digital India Initiative</span>
           <span className="bg-brand-saffron px-2 py-0.5 rounded text-[8px] sm:text-[9px]">Official Portal</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-dark-surface border-b border-light-border dark:border-dark-border sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <Link to="/" className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white dark:bg-dark-bg rounded-full shadow-md border border-light-border dark:border-dark-border flex items-center justify-center p-1 group-hover:rotate-6 transition-transform overflow-hidden">
                  <img src={logo} alt="CivicPulse" className="w-full h-full object-contain rounded-full" />
               </div>
               <div className="flex flex-col">
                  <span className="font-display font-black text-xl text-brand-blue dark:text-white tracking-tighter leading-none whitespace-nowrap">CivicPulse Coimbatore</span>
                  <span className="text-[9px] font-bold text-brand-saffron uppercase tracking-[0.25em] mt-1">Official Grievance Portal</span>
               </div>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-10">
             <button onClick={() => scrollTo('zones')} className="text-[12px] font-bold text-light-secondary dark:text-dark-secondary hover:text-brand-blue dark:hover:text-blue-400 uppercase tracking-widest transition-colors relative group">
                Zones
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-blue dark:bg-blue-400 transition-all group-hover:w-full"></span>
             </button>
             <button onClick={() => scrollTo('workflow')} className="text-[12px] font-bold text-light-secondary dark:text-dark-secondary hover:text-brand-blue dark:hover:text-blue-400 uppercase tracking-widest transition-colors relative group text-nowrap">
                Resolution Guide
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-blue dark:bg-blue-400 transition-all group-hover:w-full"></span>
             </button>
          </nav>

          <div className="flex items-center gap-4">
             {isAuthenticated ? (
               <Link to="/dashboard" className="h-10 px-6 rounded-lg bg-[#1B3A6B] text-white font-bold text-xs uppercase tracking-widest flex items-center shadow-lg shadow-brand-blue/10 hover:bg-[#142d54] transition-all">
                  Dashboard
               </Link>
             ) : (
               <div className="flex items-center gap-3">
                  <Link to="/login" className="hidden sm:inline-block text-xs font-bold text-light-secondary dark:text-dark-secondary uppercase tracking-widest hover:text-brand-blue transition-colors px-2">
                    Login
                  </Link>
                  <Link to="/register" className="h-10 px-8 rounded-lg bg-[#1B3A6B] text-white font-bold text-xs uppercase tracking-widest flex items-center shadow-lg shadow-brand-blue/10 hover:bg-[#142d54] transition-all">
                    Register
                  </Link>
               </div>
             )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 hero-gradient gov-pattern">
         <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="text-left animate-fade">
               <div className="flex flex-col gap-2 mb-8">
                  <p className="tamil-font text-[22px] font-bold text-[#1B3A6B] dark:text-blue-400">வணக்கம் கோயம்புத்தூர் — Welcome Coimbatore</p>
                  <div className="h-1 w-24 bg-[#F4811F] rounded-full shadow-[0_0_10px_#F4811F/30]" />
               </div>
               <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black leading-[1.05] mb-8 text-light-primary dark:text-white tracking-tighter">
                  Towards a <span className="text-brand-blue dark:text-blue-400">Cleaner</span> and <span className="text-brand-saffron">Smarter</span> Municipality.
               </h1>
               <p className="text-light-secondary dark:text-dark-secondary text-lg lg:text-xl max-w-xl mb-10 leading-relaxed font-regular">
                  CivicPulse is the official bridge connecting residents with professional digital governance. Report and resolve municipal issues with real-time tracking.
               </p>
               <div className="flex flex-wrap gap-4">
                  <Link to="/register" className="h-14 px-10 rounded-xl bg-brand-blue text-white font-bold text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-brand-blue/20 hover:scale-[1.02] transition-all group">
                     Register Issue
                     <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                     </svg>
                  </Link>
                  <button onClick={() => scrollTo('workflow')} className="h-14 px-8 rounded-xl bg-white dark:bg-dark-surface text-brand-blue dark:text-white border border-brand-blue/10 font-bold text-sm uppercase tracking-widest flex items-center hover:bg-[#F0F4F8] transition-all shadow-md">
                     Resolution Guide
                  </button>
               </div>
            </div>

            <div className="relative">
               <div className="grid grid-cols-2 gap-4 animate-float">
                  <div className="space-y-4 pt-12">
                     <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#1C2526] hover:scale-105 transition-transform duration-500">
                        <img src={infraImg} alt="Smart Infra" className="w-full h-44 object-cover" />
                        <div className="bg-white dark:bg-dark-surface p-3 text-center">
                           <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-blue-400 uppercase tracking-widest text-nowrap">Smart City Infrastructure</span>
                        </div>
                     </div>
                     <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#1C2526] hover:scale-105 transition-transform duration-500">
                        <img src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80" alt="Industry" className="w-full h-36 object-cover" />
                        <div className="bg-white dark:bg-dark-surface p-3 text-center">
                           <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-blue-400 uppercase tracking-widest text-nowrap">Textile Innovation</span>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4 pt-4">
                     <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#1C2526] hover:scale-105 transition-transform duration-500">
                        <img src={heritageImg} alt="Heritage" className="w-full h-[260px] object-cover" />
                        <div className="bg-white dark:bg-dark-surface p-3 text-center">
                           <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-blue-400 uppercase tracking-widest text-nowrap">Cultural Heritage</span>
                        </div>
                     </div>
                     <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#1C2526] hover:scale-105 transition-transform duration-500">
                        <img src={ghatsImg} alt="Sanctuary" className="w-full h-32 object-cover" />
                        <div className="bg-white dark:bg-dark-surface p-3 text-center">
                           <span className="text-[10px] font-bold text-[#1B3A6B] dark:text-blue-400 uppercase tracking-widest text-nowrap">Western Ghats</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* TN Government Links Bar */}
      <section className="bg-[#1B3A6B] py-6 shadow-xl relative z-10">
         <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center justify-between min-w-[800px] gap-8">
               <span className="text-[11px] font-bold text-brand-saffron uppercase tracking-widest border-r border-white/20 pr-8 whitespace-nowrap leading-none">External District Resources</span>
               {[
                 ['e-Services', 'https://eservices.tn.gov.in'],
                 ['Corporation Portal', 'https://ccmc.gov.in'],
                 ['Collectorate', 'https://coimbatore.nic.in'],
                 ['CM Helpline', 'https://cmhelpline.tn.gov.in'],
                 ['TNEGA', 'https://tnega.tn.gov.in']
               ].map(([label, url]) => (
                 <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white/70 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap">
                   {label}
                   <svg className="w-2.5 h-2.5 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"/></svg>
                 </a>
               ))}
            </div>
         </div>
      </section>

      {/* CORE WORKFLOW SECTION */}
      <section id="workflow" className="py-32 bg-white dark:bg-[#0D1117] relative scroll-mt-20">
         <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-20">
            <div className="flex flex-col items-center gap-4">
               <span className="text-brand-blue dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.5em] mb-2">Resolution Guide</span>
               <h2 className="text-4xl lg:text-6xl font-display font-black text-light-primary dark:text-white tracking-tight leading-none mb-6">How It Works.</h2>
               <p className="text-light-muted dark:text-dark-muted font-medium max-w-2xl leading-relaxed">
                  A transparent, four-step digital workflow designed to ensure every citizen grievance in Coimbatore is addressed with accountability.
               </p>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
            <div className="hidden lg:block absolute top-[40px] left-0 w-full h-1 bg-[#1B3A6B]/10 -z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
               {[
                 { step: "01", title: "Report Issue", desc: "Submit your grievance via mobile or web with geostamped photos and location evidence.", icon: "📑", color: "bg-brand-blue" },
                 { step: "02", title: "Route & Verify", desc: "Our engine routes the issue to the Zonal Administrator for immediate verification.", icon: "⚙️", color: "bg-brand-saffron" },
                 { step: "03", title: "Action & Resolve", desc: "Field officers are dispatched to resolve the issue. Status updates are sent to your dashboard.", icon: "🛠️", color: "bg-blue-600" },
                 { step: "04", title: "Citizen Closure", desc: "The case is only closed after you confirm the resolution and provide your final feedback.", icon: "✅", color: "bg-green-600" }
               ].map((item, idx) => (
                 <div key={item.step} className="flex flex-col items-center text-center group">
                    <div className={`w-20 h-20 rounded-[24px] ${item.color} text-white flex items-center justify-center text-3xl shadow-xl shadow-brand-blue/5 mb-8 group-hover:-translate-y-3 transition-all duration-500 font-display relative`}>
                       {item.icon}
                       <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-dark-surface border-2 border-brand-blue/10 flex items-center justify-center text-[10px] font-black text-brand-blue shadow-sm">
                          {item.step}
                       </div>
                    </div>
                    <h3 className="text-xl font-bold text-light-primary dark:text-white mb-4 tracking-tight group-hover:text-brand-blue transition-colors">{item.title}</h3>
                    <p className="text-light-muted dark:text-dark-muted text-sm font-medium leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ZONES SECTION */}
      <section id="zones" className="py-32 bg-[#F8F9FA] dark:bg-[#080B10] border-y border-light-border dark:border-dark-border scroll-mt-20 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-20">
            <span className="text-brand-saffron text-[11px] font-black uppercase tracking-[0.5em] mb-4 block">District Jurisdictions</span>
            <h2 className="text-4xl lg:text-6xl font-display font-black text-[#1B3A6B] dark:text-white tracking-tight leading-none mb-6">Explore the Zones.</h2>
            <p className="text-light-muted dark:text-dark-muted font-medium max-w-2xl mx-auto leading-relaxed">
               Coimbatore District is divided into five specialized administrative zones, each with unique socio-economic signatures.
            </p>
         </div>

         <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { id: 'north', name: 'North Zone', symbol: '🏢', feature: 'IT & Industrial Hub', img: zoneNorth, desc: 'Senthil Nagar, Saravanampatti, Ganapathy' },
              { id: 'south', name: 'South Zone', symbol: '🌴', feature: 'Agriculture & Agri-Tech', img: zoneSouth, desc: 'Pollachi Road, Eachanari, Sundarapuram' },
              { id: 'east', name: 'East Zone', symbol: '🧵', feature: 'Textiles & Logistics', img: zoneEast, desc: 'Peelamedu, Singanallur, Ondipudur' },
              { id: 'west', name: 'West Zone', symbol: '⛰️', feature: 'Western Ghats & Nature', img: zoneWest, desc: 'Vadavalli, Thondamuthur, Perur' },
              { id: 'central', name: 'Central Zone', symbol: '🕋', feature: 'Commerce & Governance', img: zoneCentral, desc: 'RS Puram, Town Hall, Gandhipuram' }
            ].map((zone) => (
              <div key={zone.id} className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-lg border border-white/10 zone-card">
                 <img src={zone.img} alt={zone.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 <div className="absolute inset-x-0 bottom-0 p-6 text-left relative z-20">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B3A6B] via-[#1B3A6B]/40 to-transparent opacity-80 -z-10" />
                    <div className="text-3xl mb-3">{zone.symbol}</div>
                    <p className="text-brand-saffron text-[9px] font-black uppercase tracking-widest mb-1">{zone.feature}</p>
                    <h3 className="text-white text-xl font-display font-black tracking-tight mb-2">{zone.name}</h3>
                    <p className="text-white/60 text-[10px] leading-relaxed font-medium transition-opacity duration-300">
                       {zone.desc}
                    </p>
                 </div>
                 <div className="absolute inset-0 bg-brand-blue/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
         </div>

         <div className="mt-20 text-center">
            <Link to="/register" className="h-16 px-12 rounded-2xl bg-[#1B3A6B] hover:bg-[#142d54] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-blue/30 transition-all flex items-center justify-center inline-flex gap-4">
               Register Grievance in Your Zone
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
         </div>
      </section>

      {/* Institutional Footer */}
      <footer className="py-20 bg-white dark:bg-dark-bg border-t border-light-border dark:border-dark-border transition-colors">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-20 pb-20 border-b border-light-border/50 dark:border-dark-border/50">
               {/* Identity Section */}
               <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#1B3A6B]/5 rounded-full flex items-center justify-center p-2 border border-[#1B3A6B]/10 overflow-hidden">
                        <img src={logo} alt="CivicPulse" className="w-full h-full object-contain rounded-full" />
                     </div>
                     <div className="flex flex-col">
                        <span className="font-display font-black text-xl text-brand-blue dark:text-white tracking-tighter">CivicPulse</span>
                        <span className="text-[10px] font-bold text-brand-saffron uppercase tracking-[0.2em]">Coimbatore District</span>
                     </div>
                  </div>
                  <p className="text-light-muted dark:text-dark-muted text-sm font-medium leading-relaxed">
                     The official digital bridge for municipal reporting and administrative transparency across the five zones of Coimbatore.
                  </p>
               </div>

               {/* Quick Contact NEXUS */}
               <div className="flex flex-col gap-6">
                  <h4 className="text-[11px] font-black text-[#1B3A6B] dark:text-blue-400 uppercase tracking-[0.4em]">District Contact Nexus</h4>
                  <div className="space-y-4">
                     <div className="flex items-start gap-4 group">
                        <div className="p-2 rounded-lg bg-[#1B3A6B]/5 text-[#1B3A6B] dark:text-blue-400 group-hover:bg-brand-blue group-hover:text-white transition-all">📍</div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-light-primary dark:text-white uppercase tracking-wider mb-1">Administrative HQ</span>
                           <span className="text-xs text-light-muted dark:text-dark-muted font-medium">District Collectorate, State Bank Road, Coimbatore - 641018</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 group">
                        <div className="p-2 rounded-lg bg-[#1B3A6B]/5 text-[#1B3A6B] dark:text-blue-400 group-hover:bg-brand-blue group-hover:text-white transition-all">📞</div>
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-light-primary dark:text-white uppercase tracking-wider mb-1">Citizen Helpline</span>
                           <span className="text-xs text-light-muted dark:text-dark-muted font-medium">0422 - 2300131 / 1800-425-422</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Digital Reach */}
               <div className="flex flex-col gap-6">
                  <h4 className="text-[11px] font-black text-[#1B3A6B] dark:text-blue-400 uppercase tracking-[0.4em]">Digital Reach</h4>
                  <div className="flex flex-col gap-3">
                     <div className="flex items-center gap-4 group">
                        <div className="p-2 rounded-lg bg-[#1B3A6B]/5 text-[#1B3A6B] dark:text-blue-400 group-hover:bg-brand-blue group-hover:text-white transition-all">✉️</div>
                        <span className="text-xs text-light-muted dark:text-dark-muted font-bold group-hover:text-brand-blue cursor-pointer">collector-cbe@nic.in</span>
                     </div>
                     <div className="flex items-center gap-4 group">
                        <div className="p-2 rounded-lg bg-[#1B3A6B]/5 text-[#1B3A6B] dark:text-blue-400 group-hover:bg-brand-blue group-hover:text-white transition-all">🌐</div>
                        <span className="text-xs text-light-muted dark:text-dark-muted font-bold group-hover:text-brand-blue cursor-pointer">coimbatore.nic.in</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-center gap-12">
               <div className="flex flex-wrap justify-center gap-10 sm:gap-20 transition-opacity">
                  <img src={tnSeal} alt="TN" className="h-16 object-contain hover:scale-110 transition-transform duration-500" />
                  <img src={smartCityLogo} alt="Smart City" className="h-16 object-contain hover:scale-110 transition-transform duration-500" />
                  <img src={tnegaLogo} alt="TNEGA" className="h-16 object-contain hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em]">Digital India</span>
                     <div className="w-10 h-10 rounded-full bg-[#1B3A6B] flex items-center justify-center text-[10px] text-white font-black shadow-xl ring-4 ring-[#1B3A6B]/10">IN</div>
                  </div>
               </div>

               <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                     <span className="w-12 h-px bg-light-border dark:bg-dark-border" />
                     <p className="text-[11px] font-bold text-light-primary dark:text-white uppercase tracking-[0.5em]">Municipal Authority • 2026</p>
                     <span className="w-12 h-px bg-light-border dark:bg-dark-border" />
                  </div>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted font-semibold max-w-xl mx-auto leading-relaxed opacity-60">
                     Official Citizen Portal of Coimbatore District. <br/>
                     Developed in collaboration with TNEGA & Smart City Initiative.
                  </p>
               </div>
            </div>
         </div>
      </footer>
    </div>
  )
}
