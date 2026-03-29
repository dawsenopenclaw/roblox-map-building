import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ParentalConsentVerifyLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#141414] border border-white/10 rounded-xl p-8">
            <div className="w-8 h-8 rounded-full shimmer mx-auto mb-4" />
            <div className="h-6 w-40 rounded-xl shimmer-gold mx-auto mb-2" />
            <div className="h-4 w-64 rounded shimmer mx-auto" />
          </div>
        </div>
      </div>
    </>
  )
}
