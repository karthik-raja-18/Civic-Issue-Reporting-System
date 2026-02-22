import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/authApi'

const AuthContext = createContext(null)

// ── Helper: read persisted auth from localStorage ─────────────────────────────
function loadPersistedAuth() {
  try {
    const token = localStorage.getItem('token')
    const user  = JSON.parse(localStorage.getItem('user') || 'null')
    if (token && user) return { token, user }
  } catch {
    // corrupted storage — start fresh
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }) {
  const initial = loadPersistedAuth()
  const [token, setToken]   = useState(initial.token)
  const [user,  setUser]    = useState(initial.user)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persistAuth = useCallback((responseData) => {
    const { token, ...userData } = responseData
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(token)
    setUser(userData)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  // ── Public actions ─────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.register(formData)
      persistAuth(res.data.data)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [persistAuth])

  const login = useCallback(async (formData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(formData)
      persistAuth(res.data.data)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [persistAuth])

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  // ── Derived state ──────────────────────────────────────────────────────────
  const isAuthenticated = Boolean(token)
  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{
      user, token, loading, error,
      isAuthenticated, isAdmin,
      register, login, logout,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
