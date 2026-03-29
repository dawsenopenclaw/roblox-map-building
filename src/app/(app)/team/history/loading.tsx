import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function TeamHistoryLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-40 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-32 rounded shimmer" />
          </div>
          <div className="h-4 w-20 rounded shimmer" />
        </div>

        {/* Version list */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full shimmer flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-16 rounded-full shimmer-gold" />
                      <div className="h-4 w-48 rounded shimmer" />
                    </div>
                    <div className="h-3 w-32 rounded shimmer" />
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <div className="h-8 w-20 rounded-lg shimmer" />
                  <div className="h-8 w-20 rounded-lg shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
