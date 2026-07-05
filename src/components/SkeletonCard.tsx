export default function SkeletonCard({ count = 7 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 shadow-card flex items-center gap-4 animate-pulse"
        >
          <div className="w-[68px] h-[68px] rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}
