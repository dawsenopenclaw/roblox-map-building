import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AdminCharityLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter space-y-8 p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="h-7 w-32 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-48 rounded shimmer" />
          </div>
          <div className="h-9 w-28 rounded-lg shimmer" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg shimmer flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-28 rounded shimmer mb-2" />
                <div className="h-7 w-24 rounded-lg shimmer-gold" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Donations by charity */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-36 rounded shimmer mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <div className="h-4 w-36 rounded shimmer" />
                    <div className="h-4 w-16 rounded shimmer-gold" />
                  </div>
                  <div className="h-2 w-full rounded-full shimmer" />
                </div>
              ))}
            </div>
          </div>

          {/* Monthly history */}
          <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="h-3 w-32 rounded shimmer mb-4" />
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t shimmer" style={{ height: `${40 + i * 8}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Active charities */}
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <div className="h-3 w-32 rounded shimmer mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-[#1c1c1c] rounded-xl">
                <div>
                  <div className="h-4 w-40 rounded shimmer mb-1" />
                  <div className="h-3 w-56 rounded shimmer" />
                </div>
                <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
