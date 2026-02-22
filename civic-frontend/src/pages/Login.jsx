import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AlertMessage from '../components/AlertMessage'
import Spinner from '../components/Spinner'

export default function Login() {
  const { login, loading, error, clearError, isAuthenticated } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })

  // Already logged in → redirect
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  const handleChange = (e) => {
    clearError()
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form)
    if (result.success) navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ink-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                        bg-civic-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-civic-500/15 border border-civic-500/20 mb-4">
            <svg className="w-6 h-6 text-civic-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Welcome back</h1>
          <p className="text-ink-400 text-sm mt-1">Sign in to CivicPulse</p>
        </div>

        {/* Card */}
        <div className="card border-ink-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AlertMessage type="error" message={error} onDismiss={clearError} />

            <div>
              <label className="label">Email address</label>
              <input
                type="email" name="email"
                className="input" placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                required autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password" name="password"
                className="input" placeholder="••••••••"
                value={form.password} onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-civic-400 hover:text-civic-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
