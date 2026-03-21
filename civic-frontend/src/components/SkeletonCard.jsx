export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-2/3 h-5 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      
      <div className="space-y-3">
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
        <div className="w-5/6 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-2">
            <div className="w-20 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
            <div className="w-12 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      </div>
    </div>
  )
}
