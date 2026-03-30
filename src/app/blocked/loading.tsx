import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function BlockedLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="h-8 w-56 rounded-full shimmer mx-auto mb-8" />
          <div className="w-20 h-20 rounded-2xl shimmer mx-auto mb-6" />
          <div className="h-8 w-64 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-full rounded shimmer mb-1" />
          <div className="h-4 w-4/5 rounded shimmer mx-auto" />
        </div>
      </div>
    </>
  )
}
