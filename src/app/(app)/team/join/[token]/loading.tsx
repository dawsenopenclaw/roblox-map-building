import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function JoinTeamLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8">
            {/* Icon placeholder */}
            <div className="w-16 h-16 rounded-2xl shimmer mx-auto mb-4" />
            {/* Title */}
            <div className="h-6 w-40 rounded-xl shimmer-gold mx-auto mb-3" />
            {/* Description */}
            <div className="h-4 w-full rounded shimmer mb-1" />
            <div className="h-4 w-3/4 rounded shimmer mx-auto mb-6" />
            {/* CTA button */}
            <div className="h-11 w-full rounded-xl shimmer" />
          </div>
        </div>
      </div>
    </>
  )
}
