import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/axiosConfig'

/**
 * PhoneSetup — shown as a prompt in the dashboard for users
 * who haven't added a phone number yet.
 * Adding a phone enables:
 *   - SMS status notifications
 *   - YES/NO resolution confirmation via SMS
 *   - WhatsApp issue updates
 */
export default function PhoneSetup({ onDismiss, onSaved }) {
  const { t }             = useTranslation()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!phone.trim()) return
    // Basic validation — must start with + and have 10+ digits
    const clean = phone.trim()
    if (!/^\+\d{10,15}$/.test(clean)) {
      setError('Enter a valid phone number with country code (e.g. +919876543210)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.put('/api/users/phone', { phone: clean })
      setSuccess(true)
      setTimeout(() => onSaved?.(clean), 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save phone number')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white dark:bg-[#161B22]
                      border border-[#D0D7DE] dark:border-[#30363D]
                      rounded-lg p-5 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-[#2D7A3A] text-sm">Phone number saved!</p>
          <p className="text-[#57606A] dark:text-[#8B949E] text-xs mt-0.5">
            You'll now receive SMS updates on your issue status.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#161B22]
                    border border-[#F4811F]/30
                    rounded-lg p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">📱</span>
        <div>
          <p className="font-display font-bold text-[#1C2526] dark:text-[#E6EDF3] text-sm">
            Enable SMS Notifications
          </p>
          <p className="text-[#57606A] dark:text-[#8B949E] text-xs mt-0.5 leading-relaxed">
            Add your phone number to receive SMS updates when your issue status changes.
            You can also reply <strong>YES</strong> or <strong>NO</strong> to confirm resolution — no app needed.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(null) }}
          placeholder="+919876543210"
          className="flex-1 h-9 px-3 rounded-md text-sm
                     bg-[#F5F7FA] dark:bg-[#0D1117]
                     border border-[#D0D7DE] dark:border-[#30363D]
                     text-[#1C2526] dark:text-[#E6EDF3]
                     placeholder-[#8C959F]
                     focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30
                     focus:border-[#1B3A6B] dark:focus:border-[#4A90D9]"
        />
        <button
          onClick={handleSave}
          disabled={loading || !phone.trim()}
          className="h-9 px-4 rounded-md text-sm font-semibold text-white
                     bg-[#F4811F] hover:bg-[#e07318]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onDismiss}
          className="h-9 px-3 rounded-md text-sm text-[#8C959F]
                     hover:text-[#57606A] transition-colors"
        >
          Later
        </button>
      </div>

      {error && (
        <p className="text-[#C0392B] text-xs mt-2">{error}</p>
      )}

      <p className="text-[#8C959F] text-xs mt-2">
        Include country code. India: +91XXXXXXXXXX
        Your number is only used for CivicPulse notifications.
      </p>
    </div>
  )
}
