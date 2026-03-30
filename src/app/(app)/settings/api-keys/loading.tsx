import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ApiKeysLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-24 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-56 rounded shimmer" />
          </div>
          <div className="h-10 w-32 rounded-xl shimmer" />
        </div>

        {/* API key rows */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-32 rounded shimmer-gold" />
                    <div className="h-5 w-16 rounded-full shimmer" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-64 rounded-lg shimmer font-mono" />
                    <div className="h-8 w-8 rounded-lg shimmer flex-shrink-0" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-3 w-24 rounded shimmer" />
                    <div className="h-3 w-20 rounded shimmer" />
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <div className="h-8 w-16 rounded-lg shimmer" />
                  <div className="h-8 w-16 rounded-lg shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
