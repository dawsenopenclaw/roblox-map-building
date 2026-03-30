import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AdminUsersLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter space-y-6 p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-20 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-32 rounded shimmer" />
          </div>
          <div className="h-9 w-24 rounded-lg shimmer" />
        </div>

        {/* Search bar */}
        <div className="h-12 w-full rounded-xl shimmer" />

        {/* Table */}
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1c1c1c]">
            {[120, 80, 70, 70, 80, 70, 60].map((w, i) => (
              <div key={i} className="h-3 rounded shimmer flex-shrink-0" style={{ width: w }} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[#1c1c1c] last:border-0">
              <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: 120 }}>
                <div className="h-4 w-28 rounded shimmer" />
                <div className="h-3 w-36 rounded shimmer" />
              </div>
              <div className="h-5 w-16 rounded-full shimmer flex-shrink-0" />
              <div className="h-5 w-16 rounded-full shimmer flex-shrink-0" />
              <div className="h-4 w-16 rounded shimmer flex-shrink-0" />
              <div className="h-3 w-20 rounded shimmer flex-shrink-0" />
              <div className="h-5 w-14 rounded-full shimmer flex-shrink-0" />
              <div className="w-7 h-7 rounded-lg shimmer flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
