import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { notificationApi } from '../api/notificationApi'

export default function BottomTabBar() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [unread, setUnread] = useState(0)

  const isAdmin = user?.role === 'ADMIN'
  const isRegionalAdmin = user?.role === 'REGIONAL_ADMIN'

  useEffect(() => {
    if (!user) return
    const fetchCount = () => {
      notificationApi.getAll()
        .then(res => {
          const count = (res.data.data || []).filter(n => !n.read).length
          setUnread(count)
        })
        .catch(() => {})
    }
    fetchCount()
    const int = setInterval(fetchCount, 30000)
    return () => clearInterval(int)
  }, [user])

  if (!user) return null

  const citizenTabs = [
    { to: '/dashboard', label: t('nav.home'), icon: <HomeIcon /> },
    { to: '/issues/new', label: t('nav.report'), icon: <PlusIcon />, fab: true },
    { to: '/dashboard?mine=true', label: 'My Issues', icon: <ListIcon /> },
    { to: '/notifications', label: 'Alerts', icon: <BellIcon />, badge: unread },
    { to: '/profile', label: 'Profile', icon: <UserIcon /> },
  ]

  const adminTabs = [
    { to: isAdmin ? '/admin' : '/regional', label: 'Dashboard', icon: <ChartIcon /> },
    { to: '/dashboard', label: 'Issues', icon: <ListIcon /> },
    { to: isAdmin ? '/admin/analytics' : '/regional/analytics', label: 'Metrics', icon: <ChartIcon /> },
    { to: '/notifications', label: 'Alerts', icon: <BellIcon />, badge: unread },
    { to: '/profile', label: 'Profile', icon: <UserIcon /> },
  ]

  const tabs = (isAdmin || isRegionalAdmin) ? adminTabs : citizenTabs

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-light-surface/95 dark:bg-[#161B22]/95 backdrop-blur-lg border-t border-light-border dark:border-dark-border pb-[env(safe-area-inset-bottom)] h-[calc(56px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-14 relative">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 min-w-0 transition-all duration-200 h-full relative
              ${tab.fab ? 'z-20' : ''}
              ${isActive ? 'text-brand-blue dark:text-blue-400' : 'text-light-secondary dark:text-dark-secondary'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && !tab.fab && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-brand-blue dark:bg-blue-400 rounded-full" />
                )}
                
                <div className={`
                  relative flex items-center justify-center
                  ${tab.fab ? 'w-14 h-14 bg-brand-saffron rounded-full -mt-7 shadow-lg border-4 border-light-surface dark:border-[#161B22] text-white active:scale-95 transition-transform' : 'w-6 h-6'}
                `}>
                  {tab.icon}
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gov-danger rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 border-2 border-light-surface dark:border-[#161B22]">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                
                <span className={`text-[10px] font-medium mt-1 truncate w-full text-center ${tab.fab ? 'mt-0' : ''}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Icons
const HomeIcon = () => (
  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const PlusIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)
const ListIcon = () => (
  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)
const BellIcon = () => (
  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)
const UserIcon = () => (
  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const ChartIcon = () => (
  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
)
const MapIcon = () => (
  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446l6-2.7a.75.75 0 00.497-.691V3.304a.75.75 0 00-1.01-.691L15.5 4.406 8.5 2.03a.75.75 0 00-.503 0L1.997 4.733a.75.75 0 00-.497.691V18.696c0 .298.177.568.452.682l5.548 2.304a.75.75 0 00.503 0l6.997-2.306z" />
  </svg>
)
