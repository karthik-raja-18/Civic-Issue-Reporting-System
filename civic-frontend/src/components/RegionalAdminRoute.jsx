import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protects routes for REGIONAL_ADMIN only.
 * ADMIN can also access these routes.
 */
export default function RegionalAdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const allowed = user?.role === 'REGIONAL_ADMIN' || user?.role === 'ADMIN'
  if (!allowed) return <Navigate to="/dashboard" replace />

  return children
}
