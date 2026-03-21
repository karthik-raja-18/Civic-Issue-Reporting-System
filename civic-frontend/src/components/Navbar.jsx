import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationApi } from '../api/notificationApi'
import logo from '../assets/logo.png'
import LanguageToggle from './LanguageToggle'
import { useTranslation } from 'react-i18next'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const isAdmin         = user?.role === 'ADMIN'
  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN'

  useEffect(() => {
    if (!user) return
    notificationApi.getAll()
      .then(res => {
        const count = (res.data.data || []).filter(n => !n.read).length
        setUnread(count)
      })
      .catch(() => {})
  }, [user])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('civicpulse-theme', newTheme)
    setIsDark(!isDark)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `relative flex items-center h-full px-3 sm:px-5 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest transition-all duration-300 ${
      isActive
        ? 'text-brand-blue dark:text-blue-400 bg-brand-blue/5 dark:bg-blue-900/10'
        : 'text-light-secondary dark:text-dark-secondary hover:text-brand-blue dark:hover:text-blue-400'
    }`

  const navLinks = [
    { to: '/dashboard', label: t('nav.home'), icon: <GridIcon /> },
    ...(!isAdmin && !isRegionalAdmin
      ? [{ to: '/issues/new', label: t('nav.report'), icon: <PlusIcon /> }]
      : []),
    ...(isAdmin ? [
      { to: '/admin',           label: 'Admin Panel', icon: <ShieldIcon /> },
      { to: '/admin/regional',  label: 'Regional Admins', icon: <MapIcon /> },
      { to: '/admin/zones',     label: 'Zone SLA', icon: <GridIcon /> },
      { to: '/admin/analytics', label: 'District Metrics', icon: <MonitoringIcon /> },
    ] : []),
    ...(isRegionalAdmin ? [
      { to: '/regional',           label: 'Dashboard', icon: <MapIcon /> },
      { to: '/regional/analytics', label: 'My Performance', icon: <MonitoringIcon /> },
    ] : []),
    {
      to: '/notifications',
      label: t('nav.notifications'),
      icon: <BellIcon />,
      badge: unread > 0 ? unread : null,
    },
  ]

  if (!user) return null

  return (
    <header className="sticky top-0 z-[60] h-16 bg-light-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-light-border dark:border-dark-border transition-all duration-300 shadow-sm">
      <nav className="container-civic h-full flex items-center justify-between">
        
        {/* Left Side: Logo & Desktop Nav */}
        <div className="flex items-center h-full gap-10">
          <Link to={isAdmin ? '/admin' : isRegionalAdmin ? '/regional' : '/dashboard'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-dark-surface flex items-center justify-center shadow-lg shadow-brand-blue/10 group-hover:scale-105 transition-transform overflow-hidden border border-light-border dark:border-dark-border">
               <img src={logo} alt="CivicPulse Logo" className="w-[85%] h-[85%] object-contain" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-[17px] font-display font-black text-light-primary dark:text-dark-primary leading-none tracking-tight">
                 CivicPulse
               </h1>
               <span className="hidden xs:inline-block text-[9px] text-brand-saffron font-black mt-1 uppercase tracking-[0.2em] leading-none">
                 Coimbatore District
               </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center h-full">
            {navLinks.map(({ to, label, icon, badge }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <span className="flex items-center gap-3">
                  <div className="relative">
                    {icon}
                    {badge != null && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gov-danger
                                       rounded-full text-white text-[0px] flex items-center
                                       justify-center font-bold ring-2 ring-light-surface dark:ring-dark-surface animate-pulse">
                        {badge}
                      </span>
                    )}
                  </div>
                  {label}
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right Side: Language, Theme, Profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <LanguageToggle compact />
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-light-border dark:border-dark-border text-light-secondary dark:text-dark-secondary hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all overflow-hidden relative group"
            aria-label="Toggle Theme"
          >
            <div className="relative z-10">
               {isDark ? <SunIcon /> : <MoonIcon />}
            </div>
          </button>

          {/* Role Badge & User */}
          <div className="hidden sm:flex items-center gap-2 md:gap-4 pl-2 md:pl-4 border-l border-light-border dark:border-dark-border">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[13px] font-bold text-light-primary dark:text-dark-primary leading-none tracking-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-gov-danger/10 text-gov-danger border border-gov-danger/20 uppercase tracking-[0.1em]">
                    System Admin
                  </span>
                )}
                {isRegionalAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-brand-saffron/10 text-brand-saffron border border-brand-saffron/20 uppercase tracking-[0.1em]">
                    {user?.zone || 'Zone'} Admin
                  </span>
                )}
                {!isAdmin && !isRegionalAdmin && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-brand-blue/10 text-brand-blue dark:text-blue-400 border border-brand-blue/20 uppercase tracking-[0.1em]">
                    Citizen
                  </span>
                )}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-light-surface to-light-bg dark:from-dark-surface dark:to-dark-bg border border-light-border dark:border-dark-border flex items-center justify-center text-brand-blue dark:text-blue-400 text-xs font-black shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-gov-danger hover:bg-gov-danger/5 border border-transparent hover:border-gov-danger/10 transition-all"
            title="Secure Logout"
          >
            <LogoutIcon />
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2.5 rounded-xl border border-light-border dark:border-dark-border text-light-secondary dark:text-dark-secondary hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-[100] bg-black/60 backdrop-blur-sm animate-fade" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-0 right-0 w-72 h-full bg-light-surface dark:bg-dark-surface p-6 flex flex-col gap-3 shadow-2xl animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="mb-6 pb-6 border-b border-light-border dark:border-dark-border">
               <p className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.2em] mb-4">Navigation Terminal</p>
               {navLinks.map(({ to, label, icon }) => (
                 <NavLink 
                    key={to} 
                    to={to} 
                    className={({ isActive }) => `flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold uppercase tracking-widest transition-all ${isActive ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30' : 'text-light-secondary dark:text-dark-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
                    onClick={() => setMenuOpen(false)}
                 >
                    {icon} {label}
                 </NavLink>
               ))}
               <div className="pt-4">
                  <LanguageToggle />
               </div>
            </div>
            
            <div className="mt-auto p-4 bg-light-bg dark:bg-dark-bg rounded-2xl border border-light-border dark:border-dark-border">
               <p className="text-[11px] font-bold text-light-primary dark:text-dark-primary mb-1">{user?.name}</p>
               <p className="text-[10px] text-light-muted dark:text-dark-muted font-medium mb-3 truncate">{user?.email}</p>
               <button onClick={handleLogout} className="btn btn-primary w-full h-10 text-[11px] bg-gov-danger shadow-none">Terminate Session</button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// Icons
const GridIcon   = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const PlusIcon   = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)
const BellIcon   = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)
const ShieldIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)
const MapIcon    = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6-2.7a.75.75 0 00.497-.691V3.304a.75.75 0 00-1.01-.691L15.5 4.406 8.5 2.03a.75.75 0 00-.503 0L1.997 4.733a.75.75 0 00-.497.691V18.696c0 .298.177.568.452.682l5.548 2.304a.75.75 0 00.503 0l6.997-2.306z" />
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
)
const SunIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
)
const MoonIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
)
const MenuIcon   = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)
const XIcon      = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const MonitoringIcon = () => (
   <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
   </svg>
)
