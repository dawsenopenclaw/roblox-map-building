import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function WelcomeLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full shimmer" />
            ))}
          </div>

          {/* Step card */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
            <div className="h-7 w-48 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-64 rounded shimmer mb-8" />

            {/* Interest tiles */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg shimmer mb-2" />
                  <div className="h-4 w-20 rounded shimmer mb-1" />
                  <div className="h-3 w-28 rounded shimmer" />
                </div>
              ))}
            </div>

            <div className="h-11 w-full rounded-xl shimmer-gold" />
          </div>
        </div>
      </div>
    </>
  )
}
