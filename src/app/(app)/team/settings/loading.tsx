import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function TeamSettingsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-32 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-48 rounded shimmer" />
        </div>

        {/* Team info card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
          <div className="h-5 w-24 rounded shimmer-gold" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded shimmer" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
          ))}
          <div className="h-10 w-28 rounded-xl shimmer" />
        </div>

        {/* Members list */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-20 rounded shimmer-gold" />
            <div className="h-9 w-28 rounded-lg shimmer" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full shimmer flex-shrink-0" />
                  <div>
                    <div className="h-4 w-32 rounded shimmer mb-1" />
                    <div className="h-3 w-24 rounded shimmer" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 rounded-full shimmer" />
                  <div className="h-8 w-8 rounded-lg shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-[#141414] border border-red-500/20 rounded-2xl p-6">
          <div className="h-5 w-28 rounded shimmer mb-3" />
          <div className="h-4 w-full rounded shimmer mb-4" />
          <div className="h-10 w-32 rounded-xl shimmer" />
        </div>
      </div>
    </>
  )
}
