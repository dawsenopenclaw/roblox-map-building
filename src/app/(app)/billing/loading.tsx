import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function BillingLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-32 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-60 rounded-md shimmer" />
        </div>

        {/* Current plan card */}
        <div className="bg-[#242424] border border-[#FFB81C]/20 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="h-4 w-24 rounded-md shimmer mb-2" />
              <div className="h-7 w-20 rounded-xl shimmer-gold mb-1" />
              <div className="h-3.5 w-64 rounded-md shimmer" />
            </div>
            <div className="h-9 w-28 rounded-xl shimmer flex-shrink-0" />
          </div>
          {/* Token usage bar */}
          <div className="mb-2">
            <div className="flex justify-between mb-1.5">
              <div className="h-3.5 w-20 rounded-md shimmer" />
              <div className="h-3.5 w-28 rounded-md shimmer" />
            </div>
            <div className="h-2 w-full rounded-full shimmer" />
          </div>
          <div className="h-3 w-40 rounded-md shimmer mt-2" />
        </div>

        {/* Usage stats grid — 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#242424] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-md shimmer flex-shrink-0" />
                <div className="h-3.5 w-20 rounded-md shimmer" />
              </div>
              <div className="h-6 w-16 rounded-lg shimmer-gold" />
            </div>
          ))}
        </div>

        {/* Payment method card */}
        <div className="bg-[#242424] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="h-5 w-36 rounded-lg shimmer-gold mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 rounded-md shimmer flex-shrink-0" />
            <div>
              <div className="h-4 w-40 rounded-md shimmer mb-1" />
              <div className="h-3.5 w-28 rounded-md shimmer" />
            </div>
            <div className="ml-auto h-9 w-24 rounded-xl shimmer" />
          </div>
        </div>

        {/* Billing history */}
        <div className="bg-[#242424] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 rounded-lg shimmer-gold" />
            <div className="h-8 w-28 rounded-xl shimmer" />
          </div>
          {/* Table header */}
          <div className="flex gap-4 pb-3 border-b border-white/10">
            {[80, 60, 70, 60, 50].map((w, i) => (
              <div key={i} className="h-3 rounded-md shimmer" style={{ width: `${w}px` }} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center py-3.5 border-b border-white/5">
              <div className="h-4 w-20 rounded-md shimmer" />
              <div className="h-4 w-40 rounded-md shimmer" />
              <div className="h-4 w-16 rounded-md shimmer-gold" />
              <div className="h-5 w-14 rounded-full shimmer" />
              <div className="h-4 w-16 rounded-md shimmer ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
