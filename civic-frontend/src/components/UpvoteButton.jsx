import { useState, useEffect } from 'react'
import { issueApi } from '../api/issueApi'

/**
 * UpvoteButton
 *
 * Shows upvote count and allows logged-in citizens to upvote.
 * Gets GPS location before upvoting (proximity check on backend).
 *
 * Props:
 *   issueId      — issue to upvote
 *   initialCount — upvote count from issue data
 *   initialVoted — whether current user already upvoted
 *   disabled     — disable if user is the reporter or issue is closed
 *   size         — 'sm' | 'md' (default 'md')
 */
export default function UpvoteButton({
  issueId,
  initialCount = 0,
  initialVoted = false,
  disabled = false,
  size = 'md',
}) {
  const [count,    setCount]    = useState(initialCount)
  const [voted,    setVoted]    = useState(initialVoted)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [locating, setLocating] = useState(false)

  const small = size === 'sm'

  const handleUpvote = async () => {
    if (disabled || loading) return
    setError(null)
    setLocating(true)

    // Get GPS coordinates for proximity check
    let lat = null, lng = null
    try {
      if (navigator.geolocation) {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject,
            { timeout: 6000, enableHighAccuracy: false }))
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      }
    } catch {
      // GPS denied or unavailable — proceed without coordinates
      // Backend will skip proximity check if no coordinates sent
    }
    setLocating(false)
    setLoading(true)

    try {
      const res  = await issueApi.upvote(issueId, lat, lng)
      const data = res.data.data
      setCount(data.upvoteCount)
      setVoted(data.hasUpvoted)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not upvote'
      setError(msg)
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  const isActive = voted && !disabled

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleUpvote}
        disabled={disabled || loading || locating}
        title={
          disabled
            ? 'Cannot upvote your own issue or a closed issue'
            : voted
              ? 'Remove upvote'
              : 'Upvote this issue — must be within 500m'
        }
        className={`flex items-center gap-2 rounded-lg font-medium transition-all
                    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                    ${small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
                    ${isActive
                      ? 'bg-[#F4811F]/15 border border-[#F4811F]/50 text-[#F4811F]'
                      : 'bg-[#F5F7FA] dark:bg-[#1C2333] border border-[#D0D7DE] dark:border-[#30363D] text-[#57606A] dark:text-[#8B949E] hover:border-[#F4811F]/40 hover:text-[#F4811F]'
                    }`}
      >
        {/* Triangle upvote icon */}
        {locating ? (
          <span className={`${small ? 'w-3 h-3' : 'w-4 h-4'} border-2
                           border-current border-t-transparent rounded-full animate-spin`} />
        ) : loading ? (
          <span className={`${small ? 'w-3 h-3' : 'w-4 h-4'} border-2
                           border-current border-t-transparent rounded-full animate-spin`} />
        ) : (
          <svg
            className={small ? 'w-3 h-3' : 'w-4 h-4'}
            viewBox="0 0 24 24"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 20h20L12 2z" />
          </svg>
        )}

        <span className="font-display font-bold">
          {locating ? 'Getting location…' : count}
        </span>

        {!small && (
          <span className="font-normal opacity-70">
            {count === 1 ? 'upvote' : 'upvotes'}
          </span>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <p className="text-[#C0392B] text-xs max-w-[200px] leading-tight">
          {error}
        </p>
      )}

      {/* Proximity hint */}
      {!voted && !disabled && !error && (
        <p className="text-[#8C959F] text-[10px]">
          📍 Must be within 500m
        </p>
      )}
    </div>
  )
}
