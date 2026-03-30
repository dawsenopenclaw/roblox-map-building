import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function TeamLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-40 rounded-md shimmer" />
          </div>
          <div className="h-10 w-28 rounded-xl shimmer" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams list panel */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded-md shimmer mb-1" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#141414] border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-4 w-32 rounded-md shimmer-gold" />
                  <div className="h-5 w-16 rounded-full shimmer" />
                </div>
                <div className="h-3 w-20 rounded-md shimmer" />
              </div>
            ))}
          </div>

          {/* Team detail panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Team header card */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="h-6 w-44 rounded-xl shimmer-gold mb-2" />
                  <div className="h-4 w-64 rounded-md shimmer" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-20 rounded-lg shimmer" />
                  <div className="h-7 w-20 rounded-lg shimmer" />
                </div>
              </div>
              {/* Presence row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded-full shimmer" />
                  ))}
                </div>
                <div className="h-7 w-32 rounded-lg shimmer" />
              </div>
            </div>

            {/* Members list card */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <div className="h-4 w-28 rounded-md shimmer-gold" />
              </div>
              <div className="divide-y divide-white/5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full shimmer" />
                      <div>
                        <div className="h-4 w-28 rounded-md shimmer mb-1" />
                        <div className="h-3 w-20 rounded-md shimmer" />
                      </div>
                    </div>
                    <div className="h-5 w-16 rounded-full shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed card */}
            <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <div className="h-4 w-20 rounded-md shimmer-gold" />
              </div>
              <div className="p-4 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full shimmer flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 w-3/4 rounded-md shimmer mb-1.5" />
                      <div className="h-3 w-1/3 rounded-md shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
