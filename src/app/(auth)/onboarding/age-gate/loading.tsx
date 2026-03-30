import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AgeGateLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
            <div className="h-7 w-40 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-64 rounded shimmer mb-6" />
            <div className="space-y-4">
              <div>
                <div className="h-3 w-24 rounded shimmer mb-2" />
                <div className="h-12 w-full rounded-lg shimmer" />
              </div>
              <div className="h-12 w-full rounded-lg shimmer-gold" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
