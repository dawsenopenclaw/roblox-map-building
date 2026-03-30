import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ParentalConsentSuccessLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8">
            <div className="w-14 h-14 rounded-full shimmer mx-auto mb-4" />
            <div className="h-7 w-44 rounded-xl shimmer-gold mx-auto mb-3" />
            <div className="h-4 w-full rounded shimmer mb-1" />
            <div className="h-4 w-3/4 rounded shimmer mx-auto" />
          </div>
        </div>
      </div>
    </>
  )
}
