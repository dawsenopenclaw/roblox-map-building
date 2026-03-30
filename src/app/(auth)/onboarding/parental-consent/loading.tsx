import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ParentalConsentLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
            <div className="w-14 h-14 rounded-full shimmer mx-auto mb-4" />
            <div className="h-6 w-48 rounded-xl shimmer-gold mx-auto mb-2 text-center" />
            <div className="h-4 w-full rounded shimmer mb-1" />
            <div className="h-4 w-3/4 rounded shimmer mx-auto mb-6" />
            <div className="space-y-3">
              <div>
                <div className="h-3 w-28 rounded shimmer mb-2" />
                <div className="h-12 w-full rounded-lg shimmer" />
              </div>
              <div className="h-11 w-full rounded-lg shimmer-gold" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
