import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from './context/AuthContext'

import Navbar               from './components/Navbar'
import BottomTabBar         from './components/BottomTabBar'
import ProtectedRoute       from './components/ProtectedRoute'
import AdminRoute           from './components/AdminRoute'
import RegionalAdminRoute   from './components/RegionalAdminRoute'

// Lazy load pages for mobile performance
const Landing            = lazy(() => import('./pages/Landing'))
const Login              = lazy(() => import('./pages/Login'))
const Register           = lazy(() => import('./pages/Register'))
const Dashboard            = lazy(() => import('./pages/Dashboard'))
const CreateIssue          = lazy(() => import('./pages/CreateIssue'))
const IssueDetails         = lazy(() => import('./pages/IssueDetails'))
const AdminDashboard       = lazy(() => import('./pages/AdminDashboard'))
const Notifications        = lazy(() => import('./pages/Notifications'))
const RegionalAdminPanel   = lazy(() => import('./pages/RegionalAdminPanel'))
const RegionalDashboard    = lazy(() => import('./pages/RegionalDashboard'))
const ZonePerformance      = lazy(() => import('./pages/ZonePerformance'))
const AdminAnalytics      = lazy(() => import('./pages/AdminAnalytics'))
const OAuth2Redirect      = lazy(() => import('./pages/OAuth2Redirect'))
const NotFound             = lazy(() => import('./pages/NotFound'))

// Simple Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-primary dark:text-dark-primary transition-colors duration-300">
      {isAuthenticated && <Navbar />}

      <main className={`flex-1 overflow-x-hidden ${isAuthenticated ? 'pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

            {/* Authenticated */}
            <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/issues/new"   element={<ProtectedRoute><CreateIssue /></ProtectedRoute>} />
            <Route path="/issues/:id"   element={<ProtectedRoute><IssueDetails /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            {/* Super Admin only */}
            <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/regional" element={<AdminRoute><RegionalAdminPanel /></AdminRoute>} />
            <Route path="/admin/zones"    element={<AdminRoute><ZonePerformance /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />

            {/* Regional Admin */}
            <Route path="/regional"       element={<RegionalAdminRoute><RegionalDashboard /></RegionalAdminRoute>} />
            <Route path="/regional/analytics" element={<RegionalAdminRoute><AdminAnalytics /></RegionalAdminRoute>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {isAuthenticated && <BottomTabBar />}
    </div>
  )
}
