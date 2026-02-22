import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AlertMessage from '../components/AlertMessage'
import Spinner from '../components/Spinner'

export default function Register() {
  const { register, loading, error, clearError, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    clearError()
    setLocalError(null)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }
    const result = await register({ name: form.name, email: form.email, password: form.password })
    if (result.success) navigate('/dashboard', { replace: true })
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ink-950">
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
          <h1 className="text-2xl font-display font-bold text-white">Create account</h1>
          <p className="text-ink-400 text-sm mt-1">Join CivicPulse and report issues</p>
        </div>

        <div className="card border-ink-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <AlertMessage
              type="error"
              message={displayError}
              onDismiss={() => { clearError(); setLocalError(null) }}
            />

            <div>
              <label className="label">Full name</label>
              <input
                type="text" name="name"
                className="input" placeholder="Jane Smith"
                value={form.name} onChange={handleChange}
                required autoFocus
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email" name="email"
                className="input" placeholder="you@example.com"
                value={form.email} onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password" name="password"
                className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password" name="confirm"
                className={`input ${form.confirm && form.confirm !== form.password ? 'input-error' : ''}`}
                placeholder="Repeat password"
                value={form.confirm} onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-civic-400 hover:text-civic-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
