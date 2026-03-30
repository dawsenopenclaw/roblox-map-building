import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function SuspendedLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
            <div className="w-16 h-16 rounded-2xl shimmer mx-auto mb-4" />
            <div className="h-7 w-44 rounded-xl shimmer-gold mx-auto mb-3" />
            <div className="h-5 w-28 rounded-full shimmer mx-auto mb-4" />
            <div className="h-4 w-full rounded shimmer mb-1" />
            <div className="h-4 w-4/5 rounded shimmer mx-auto mb-6" />
            <div className="h-10 w-40 rounded-lg shimmer mx-auto" />
          </div>
        </div>
      </div>
    </>
  )
}
