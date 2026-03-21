export default function GoogleLoginButton({ 
  label = 'Continue with Google', 
  className = '',
  action = 'login' 
}) {
  return (
    <button
      type="button"
      onClick={() => { 
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google?action=${action}` 
      }}
      className={`w-full flex items-center justify-center gap-3
                  px-4 py-2.5 rounded-md text-sm font-medium
                  bg-white dark:bg-[#1C2333]
                  border border-[#D0D7DE] dark:border-[#30363D]
                  text-[#1C2526] dark:text-[#E6EDF3]
                  hover:bg-[#F5F7FA] dark:hover:bg-[#262D3A]
                  active:scale-[0.98] transition-all duration-100
                  shadow-sm ${className}`}
    >
      {/* Official Google colours SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  )
}
