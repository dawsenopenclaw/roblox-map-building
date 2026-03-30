import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ApiKeyDetailLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-20 rounded shimmer" />
          <div className="h-4 w-4 rounded shimmer" />
          <div className="h-4 w-32 rounded shimmer-gold" />
        </div>

        {/* Key info card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="h-6 w-40 rounded shimmer-gold mb-2" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-56 rounded-lg shimmer font-mono" />
                <div className="h-8 w-8 rounded-lg shimmer" />
              </div>
            </div>
            <div className="h-9 w-20 rounded-lg shimmer flex-shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-16 rounded shimmer mb-1" />
                <div className="h-4 w-20 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-12 rounded-lg shimmer" />
          ))}
        </div>

        {/* Usage chart */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="h-4 w-32 rounded shimmer-gold mb-4" />
          <div className="flex items-end gap-1 h-40">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t shimmer" style={{ height: `${20 + (i % 7) * 10}%` }} />
            ))}
          </div>
        </div>

        {/* Top endpoints */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
          <div className="h-4 w-32 rounded shimmer-gold mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-12 rounded shimmer flex-shrink-0" />
                <div className="h-4 rounded shimmer flex-1" />
                <div className="h-4 w-16 rounded shimmer flex-shrink-0" />
                <div className="h-4 w-16 rounded shimmer flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
