import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function MaintenanceLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl shimmer mx-auto mb-6" />
          <div className="h-8 w-48 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-full rounded shimmer mb-1" />
          <div className="h-4 w-3/4 rounded shimmer mx-auto mb-6" />
          <div className="h-4 w-32 rounded shimmer mx-auto" />
        </div>
      </div>
    </>
  )
}
