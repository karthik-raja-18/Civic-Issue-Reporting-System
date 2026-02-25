import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationApi } from '../api/notificationApi'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [unread,   setUnread]   = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN'

  useEffect(() => {
    notificationApi.getAll()
      .then(res => {
        const count = (res.data.data || []).filter(n => !n.read).length
        setUnread(count)
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-civic-500/20 text-civic-400'
        : 'text-ink-300 hover:text-white hover:bg-ink-800'
    }`

  // ✅ Build nav links based on role:
  // Regular USER   → Issues + Report Issue + Notifications
  // ADMIN          → Issues + Admin + Zone Admins + Notifications (NO Report Issue)
  // REGIONAL_ADMIN → Issues + My Zone + Notifications (NO Report Issue)
  const navLinks = [
    // All roles see Issues
    { to: '/dashboard', label: 'Issues', icon: <GridIcon /> },

    // ✅ Report Issue — ONLY for regular USER, not admin/regional admin
    ...(!isAdmin && !isRegionalAdmin
      ? [{ to: '/issues/new', label: 'Report Issue', icon: <PlusIcon /> }]
      : []),

    // Admin-only links
    ...(isAdmin ? [
      { to: '/admin',          label: 'Admin Dashboard', icon: <ShieldIcon /> },
      { to: '/admin/regional', label: 'Zone Admins',     icon: <MapIcon />    },
    ] : []),

    // Regional admin link
    ...(isRegionalAdmin ? [
      { to: '/regional', label: 'My Zone', icon: <MapIcon /> },
    ] : []),

    // All roles see Notifications
    {
      to: '/notifications',
      label: 'Notifications',
      icon: <BellIcon />,
      badge: unread > 0 ? unread : null,
    },
  ]

  return (
    <header className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-civic-500 flex items-center justify-center">
            <HomeIcon />
          </div>
          <span className="font-display font-bold text-white text-base hidden sm:block">
            CivicPulse
          </span>
          {/* Zone badge for regional admin */}
          {isRegionalAdmin && user?.zone && (
            <span className="hidden sm:block text-xs font-mono font-bold
                             bg-amber-500/15 text-amber-400 border border-amber-500/30
                             px-2 py-0.5 rounded-full">
              {user.zone}
            </span>
          )}
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon, badge }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              {badge != null ? (
                <div className="relative">
                  {icon}
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-civic-500
                                   rounded-full text-white text-[9px] flex items-center
                                   justify-center font-bold leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                </div>
              ) : icon}
              {label}
            </NavLink>
          ))}
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg
                          bg-ink-900 border border-ink-700">
            <div className="w-5 h-5 rounded-full bg-civic-700 flex items-center justify-center
                            text-white text-[10px] font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs text-ink-300 max-w-[100px] truncate">{user?.name}</span>
            {isAdmin && (
              <span className="badge-admin text-[10px] px-1.5 py-0">Admin</span>
            )}
            {isRegionalAdmin && (
              <span className="text-[10px] px-1.5 py-0 rounded-full border
                               bg-amber-500/15 text-amber-400 border-amber-500/30">
                Regional
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10
                       px-3 py-1.5 text-xs gap-1.5"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button className="md:hidden btn-ghost p-1.5"
            onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink-800 bg-ink-950
                        px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}
              onClick={() => setMenuOpen(false)}>
              {icon} {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}

// Icons
const HomeIcon   = () => (
  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2.5">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const GridIcon   = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const PlusIcon   = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5"  y1="12" x2="19" y2="12"/>
  </svg>
)
const BellIcon   = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const ShieldIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const MapIcon    = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8"  y1="2" x2="8"  y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
)
const LogoutIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
const MenuIcon   = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const XIcon      = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
       stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6"  x2="6"  y2="18"/>
    <line x1="6"  y1="6"  x2="18" y2="18"/>
  </svg>
)