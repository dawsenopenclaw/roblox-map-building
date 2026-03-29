import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function WebhooksLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-28 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-56 rounded shimmer" />
          </div>
          <div className="h-10 w-36 rounded-xl shimmer" />
        </div>

        {/* Webhook endpoint cards */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="h-5 w-64 rounded shimmer mb-2 font-mono" />
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-5 w-20 rounded-full shimmer" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="h-5 w-12 rounded-full shimmer" />
                  <div className="h-8 w-8 rounded-lg shimmer" />
                </div>
              </div>
              {/* Recent deliveries */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded shimmer flex-shrink-0" />
                    <div className="h-3 w-36 rounded shimmer" />
                    <div className="h-3 w-12 rounded shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
