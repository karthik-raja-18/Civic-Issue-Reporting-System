import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePWA } from '../hooks/usePWA'

/**
 * PWABanner — shows three types of banners:
 *  1. Offline warning (always shown when offline)
 *  2. Install prompt card (shown once, dismissible)
 *  3. Update available banner (when new SW is ready)
 */
export default function PWABanner() {
  const { t }                                           = useTranslation()
  const { canInstall, isOnline, updateReady,
          promptInstall, applyUpdate }                  = usePWA()
  const [installDismissed, setInstallDismissed]         = useState(
    () => localStorage.getItem('pwa-install-dismissed') === 'true'
  )
  const [onlineBannerVisible, setOnlineBannerVisible]   = useState(false)

  // Show "back online" flash for 3 seconds
  // (tracked via previous isOnline state — simplified here)

  const dismissInstall = () => {
    setInstallDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-2 p-3 pointer-events-none">

      {/* ── 1. Offline banner ── */}
      {!isOnline && (
        <div className="pointer-events-auto mx-auto w-full max-w-md
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-amber-50 dark:bg-amber-900/30
                        border border-amber-200 dark:border-amber-700/50
                        shadow-lg">
          <span className="text-lg">📡</span>
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-semibold">
              {t('pwa.offlineBanner')}
            </p>
          </div>
        </div>
      )}

      {/* ── 2. Update available ── */}
      {updateReady && (
        <div className="pointer-events-auto mx-auto w-full max-w-md
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-[#1B3A6B] text-white shadow-lg">
          <span className="text-lg">🔄</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('pwa.updateAvailable')}</p>
            <p className="text-blue-200 text-xs">{t('pwa.updateSub')}</p>
          </div>
          <button
            onClick={applyUpdate}
            className="flex-shrink-0 bg-white text-[#1B3A6B] text-xs font-bold
                       px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {t('pwa.update')}
          </button>
        </div>
      )}

      {/* ── 3. Install prompt ── */}
      {canInstall && !installDismissed && (
        <div className="pointer-events-auto mx-auto w-full max-w-md
                        flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-white dark:bg-[#161B22]
                        border border-[#D0D7DE] dark:border-[#30363D]
                        shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#1B3A6B] flex items-center
                          justify-center flex-shrink-0 text-white text-lg font-bold">
            CP
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#1C2526] dark:text-[#E6EDF3] text-sm font-semibold truncate">
              {t('pwa.installTitle')}
            </p>
            <p className="text-[#57606A] dark:text-[#8B949E] text-xs truncate">
              {t('pwa.installSub')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={dismissInstall}
              className="text-[#8C959F] text-xs hover:text-[#57606A] transition-colors px-2 py-1"
            >
              {t('pwa.notNow')}
            </button>
            <button
              onClick={async () => {
                const accepted = await promptInstall()
                if (accepted) dismissInstall()
              }}
              className="bg-[#F4811F] text-white text-xs font-semibold
                         px-3 py-1.5 rounded-lg hover:bg-[#e07318] transition-colors"
            >
              {t('pwa.install')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
