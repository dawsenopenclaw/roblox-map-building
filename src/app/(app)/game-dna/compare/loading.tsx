import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function GameDnaCompareLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-36 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-64 rounded shimmer" />
        </div>

        {/* Game selector row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
              <div className="h-3 w-16 rounded shimmer mb-2" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
          ))}
        </div>

        {/* Radar chart placeholder */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="h-4 w-32 rounded shimmer-gold mb-4" />
          <div className="w-64 h-64 rounded-full shimmer mx-auto" />
        </div>

        {/* Side-by-side genome comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="h-5 w-40 rounded shimmer-gold mb-2" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-28 rounded shimmer" />
                  <div className="h-4 w-24 rounded-full shimmer" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
