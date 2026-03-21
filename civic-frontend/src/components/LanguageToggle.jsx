import { useTranslation } from 'react-i18next'

/**
 * LanguageToggle — switches between English and Tamil
 * Used in Navbar
 */
export default function LanguageToggle({ compact = false }) {
  const { i18n } = useTranslation()
  const isTamil  = i18n.language === 'ta'

  const toggle = () => {
    i18n.changeLanguage(isTamil ? 'en' : 'ta')
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isTamil ? 'Switch to English' : 'தமிழில் மாற்று'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
                   border border-[#D0D7DE] dark:border-[#30363D]
                   bg-transparent text-[#57606A] dark:text-[#8B949E]
                   hover:bg-[#F5F7FA] dark:hover:bg-[#1C2333]
                   transition-colors text-xs font-medium"
      >
        <span className="text-base leading-none">{isTamil ? '🇬🇧' : '🇮🇳'}</span>
        <span className="font-semibold" style={{ fontFamily: isTamil ? 'DM Sans' : 'Noto Sans Tamil, DM Sans' }}>
          {isTamil ? 'EN' : 'த'}
        </span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg
                    bg-[#F5F7FA] dark:bg-[#0D1117]
                    border border-[#D0D7DE] dark:border-[#30363D]">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          !isTamil
            ? 'bg-white dark:bg-[#1C2333] text-[#1C2526] dark:text-[#E6EDF3] shadow-sm'
            : 'text-[#57606A] dark:text-[#8B949E] hover:text-[#1C2526] dark:hover:text-[#E6EDF3]'
        }`}
      >
        English
      </button>
      <button
        onClick={() => i18n.changeLanguage('ta')}
        style={{ fontFamily: 'Noto Sans Tamil, DM Sans' }}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          isTamil
            ? 'bg-white dark:bg-[#1C2333] text-[#1C2526] dark:text-[#E6EDF3] shadow-sm'
            : 'text-[#57606A] dark:text-[#8B949E] hover:text-[#1C2526] dark:hover:text-[#E6EDF3]'
        }`}
      >
        தமிழ்
      </button>
    </div>
  )
}
