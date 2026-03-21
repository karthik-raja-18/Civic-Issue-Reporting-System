import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * /oauth2/redirect
 *
 * Catches the backend redirect after Google OR GitHub OAuth.
 * URL looks like:
 *   /oauth2/redirect?token=XXX&userId=1&name=John&email=j@g.com&role=USER&avatar=URL
 */
export default function OAuth2Redirect() {
  const [searchParams]     = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate           = useNavigate()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const token  = searchParams.get('token')
    const error  = searchParams.get('error')

    if (error || !token) {
      setStatus('error')
      setTimeout(() => navigate('/login?error=oauth_failed', { replace: true }), 2500)
      return
    }

    const userId = searchParams.get('userId')
    const name   = searchParams.get('name')
    const email  = searchParams.get('email')
    const role   = searchParams.get('role')
    const avatar = searchParams.get('avatar') || ''

    loginWithToken(token, {
      id:        parseInt(userId),
      name:      decodeURIComponent(name   || ''),
      email:     email  || '',
      role:      role   || 'USER',
      avatarUrl: avatar ? decodeURIComponent(avatar) : null,
    })

    // Redirect based on role
    const dest = role === 'ADMIN'          ? '/admin'
               : role === 'REGIONAL_ADMIN' ? '/regional'
               : '/dashboard'

    navigate(dest, { replace: true })
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0D1117]
                    flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161B22]
                      border border-[#D0D7DE] dark:border-[#30363D]
                      rounded-xl p-8 max-w-sm w-full text-center shadow-sm">

        {status === 'processing' && (
          <>
            <div className="w-12 h-12 rounded-full border-2
                            border-[#D0D7DE] dark:border-[#30363D]
                            border-t-[#1B3A6B] dark:border-t-[#4A90D9]
                            animate-spin mx-auto mb-4" />
            <h2 className="font-display font-bold
                           text-[#1C2526] dark:text-[#E6EDF3] text-lg mb-1">
              Signing you in…
            </h2>
            <p className="text-[#57606A] dark:text-[#8B949E] text-sm">
              Setting up your CivicPulse account
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20
                            flex items-center justify-center mx-auto mb-4 text-2xl">
              ❌
            </div>
            <h2 className="font-display font-bold
                           text-[#1C2526] dark:text-[#E6EDF3] text-lg mb-1">
              Sign-in Failed
            </h2>
            <p className="text-[#57606A] dark:text-[#8B949E] text-sm">
              Redirecting to login…
            </p>
          </>
        )}
      </div>
    </div>
  )
}
