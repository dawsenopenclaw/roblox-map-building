import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function OfflineLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full shimmer mx-auto mb-6" />
          <div className="h-8 w-36 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-full rounded shimmer mb-1" />
          <div className="h-4 w-3/4 rounded shimmer mx-auto mb-6" />
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 mb-4">
            <div className="h-4 w-32 rounded shimmer mb-3" />
            <div className="h-3 w-24 rounded shimmer" />
          </div>
          <div className="h-10 w-36 rounded-xl shimmer mx-auto" />
        </div>
      </div>
    </>
  )
}
