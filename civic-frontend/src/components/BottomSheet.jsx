import { useEffect, useState } from 'react'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
    } else {
      setTimeout(() => setMounted(false), 300)
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!mounted && !isOpen) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1C2128] rounded-t-[2.5rem] shadow-2xl transition-transform duration-500 ease-out transform pb-[env(safe-area-inset-bottom)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex flex-col p-6 pt-2">
          {/* Handle icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          
          {title && (
            <h3 className="text-lg font-bold text-light-primary dark:text-dark-primary mb-6 px-2">
              {title}
            </h3>
          )}
          
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
