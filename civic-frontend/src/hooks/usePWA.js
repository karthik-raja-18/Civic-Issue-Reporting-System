import { useState, useEffect } from 'react'

/**
 * usePWA — handles:
 *  - PWA install prompt (beforeinstallprompt)
 *  - Online / offline status
 *  - Service worker update detection
 */
export function usePWA() {
  const [installPrompt,  setInstallPrompt]  = useState(null)
  const [isInstalled,    setIsInstalled]    = useState(false)
  const [isOnline,       setIsOnline]       = useState(navigator.onLine)
  const [updateReady,    setUpdateReady]    = useState(false)

  useEffect(() => {
    // ── Install prompt ──────────────────────────────────────────────
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    // ── Check if already installed ──────────────────────────────────
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
    window.matchMedia('(display-mode: standalone)')
      .addEventListener('change', (e) => setIsInstalled(e.matches))

    // ── Online / offline ────────────────────────────────────────────
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)

    // ── Service worker update ───────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true)
            }
          })
        })
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // ── Trigger install dialog ──────────────────────────────────────────
  const promptInstall = async () => {
    if (!installPrompt) return false
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
    return outcome === 'accepted'
  }

  // ── Apply SW update ─────────────────────────────────────────────────
  const applyUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      })
    }
  }

  return {
    canInstall:   !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    updateReady,
    promptInstall,
    applyUpdate,
  }
}
