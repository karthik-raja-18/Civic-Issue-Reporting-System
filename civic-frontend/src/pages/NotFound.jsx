import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="font-display text-8xl font-bold text-ink-800 mb-4">404</div>
      <h1 className="text-2xl font-display font-bold text-white mb-2">Page not found</h1>
      <p className="text-ink-400 text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/dashboard" className="btn-primary">← Back to Dashboard</Link>
    </div>
  )
}
