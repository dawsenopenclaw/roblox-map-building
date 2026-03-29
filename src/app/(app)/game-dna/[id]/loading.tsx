import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function GameDnaReportLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="h-7 w-56 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-40 rounded shimmer" />
        </div>

        {/* Game info card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl shimmer flex-shrink-0" />
            <div className="flex-1">
              <div className="h-5 w-48 rounded shimmer-gold mb-2" />
              <div className="h-3 w-32 rounded shimmer" />
            </div>
            <div className="h-8 w-24 rounded-lg shimmer flex-shrink-0" />
          </div>
        </div>

        {/* Genome grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-4">
              <div className="h-3 w-20 rounded shimmer mb-2" />
              <div className="h-5 w-28 rounded shimmer-gold" />
            </div>
          ))}
        </div>

        {/* Scores radar placeholder */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="h-4 w-28 rounded shimmer-gold mb-4" />
          <div className="w-56 h-56 rounded-full shimmer mx-auto" />
        </div>

        {/* Recommendations */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
          <div className="h-4 w-36 rounded shimmer-gold mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded shimmer flex-shrink-0 mt-0.5" />
                <div className="h-4 rounded shimmer flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
