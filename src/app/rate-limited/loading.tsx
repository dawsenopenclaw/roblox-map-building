import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function RateLimitedLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full shimmer mx-auto mb-6" />
          <div className="h-8 w-44 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-full rounded shimmer mb-1" />
          <div className="h-4 w-4/5 rounded shimmer mx-auto mb-6" />

          {/* Countdown */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="h-14 w-20 rounded-xl shimmer-gold mx-auto mb-2" />
            <div className="h-3 w-28 rounded shimmer mx-auto" />
          </div>

          {/* Upgrade perks */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 text-left">
            <div className="h-4 w-32 rounded shimmer mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded shimmer flex-shrink-0" />
                  <div className="h-3 w-48 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
