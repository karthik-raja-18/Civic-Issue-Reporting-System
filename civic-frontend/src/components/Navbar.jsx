import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationApi } from '../api/notificationApi'

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread]     = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch unread notification count
  useEffect(() => {
    notificationApi.getAll()
      .then((res) => {
        const count = res.data.data?.filter((n) => !n.read).length || 0
        setUnread(count)
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-civic-500/20 text-civic-400'
        : 'text-ink-300 hover:text-white hover:bg-ink-800'
    }`

  return (
    <header className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md border-b border-ink-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* ── Brand ── */}
        <Link to="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-civic-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-base hidden sm:block">CivicPulse</span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/dashboard"   className={navLinkClass}>
            <IssueIcon /> Issues
          </NavLink>
          <NavLink to="/issues/new"  className={navLinkClass}>
            <PlusIcon /> Report Issue
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldIcon /> Admin
            </NavLink>
          )}
          <NavLink to="/notifications" className={navLinkClass}>
            <div className="relative">
              <BellIcon />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-civic-500 rounded-full
                                 text-white text-[9px] flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            Notifications
          </NavLink>
        </div>

        {/* ── User Menu ── */}
        <div className="flex items-center gap-2">
          {/* User pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-900 border border-ink-700">
            <div className="w-5 h-5 rounded-full bg-civic-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs text-ink-300 max-w-[120px] truncate">{user?.name}</span>
            {isAdmin && <span className="badge-admin text-[10px] px-1.5 py-0">Admin</span>}
          </div>

          <button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 text-xs">
            <LogoutIcon /> <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden btn-ghost p-1.5"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink-800 bg-ink-950 px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {[
            { to: '/dashboard',      label: 'Issues',        icon: <IssueIcon /> },
            { to: '/issues/new',     label: 'Report Issue',  icon: <PlusIcon />  },
            { to: '/notifications',  label: 'Notifications', icon: <BellIcon />  },
            ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: <ShieldIcon /> }] : []),
          ].map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to}
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              {icon} {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}

// ── Tiny inline SVG icons ─────────────────────────────────────────────────────
const IssueIcon  = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
const PlusIcon   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const BellIcon   = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
const ShieldIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const LogoutIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
const MenuIcon   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6"  x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const XIcon      = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
