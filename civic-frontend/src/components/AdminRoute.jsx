import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route — only ADMIN can access. Others get redirected.
 */
export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin)         return <Navigate to="/dashboard" replace />
  return children
}
