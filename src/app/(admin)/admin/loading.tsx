import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AdminOverviewLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="h-7 w-28 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-48 rounded-md shimmer" />
          </div>
        </div>

        {/* Stat cards — 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg shimmer flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-20 rounded-md shimmer mb-2" />
                <div className="h-7 w-24 rounded-lg shimmer-gold" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="xl:col-span-2 bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-32 rounded-md shimmer mb-1" />
            <div className="h-3 w-24 rounded-md shimmer mb-6" />
            <div className="flex items-end gap-1 h-40">
              {Array.from({ length: 17 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t shimmer"
                  style={{ height: `${30 + Math.round(Math.sin(i) * 25 + 25)}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <div className="h-3 w-10 rounded shimmer" />
              <div className="h-3 w-10 rounded shimmer" />
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-4 w-32 rounded-md shimmer-gold mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-[#1c1c1c] last:border-0">
                  <div className="h-4 w-8 rounded shimmer flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-full rounded shimmer" />
                    <div className="h-3 w-2/3 rounded shimmer" />
                  </div>
                  <div className="h-3 w-10 rounded shimmer flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
