import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Navbar           from './components/Navbar'
import ProtectedRoute   from './components/ProtectedRoute'
import AdminRoute       from './components/AdminRoute'

import Login            from './pages/Login'
import Register         from './pages/Register'
import Dashboard        from './pages/Dashboard'
import CreateIssue      from './pages/CreateIssue'
import IssueDetails     from './pages/IssueDetails'
import AdminDashboard   from './pages/AdminDashboard'
import Notifications    from './pages/Notifications'
import NotFound         from './pages/NotFound'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar only shown when authenticated */}
      {isAuthenticated && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          }/>
          <Route path="/issues/new" element={
            <ProtectedRoute><CreateIssue /></ProtectedRoute>
          }/>
          <Route path="/issues/:id" element={
            <ProtectedRoute><IssueDetails /></ProtectedRoute>
          }/>
          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          }/>

          {/* Admin-only route */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          }/>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
