import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function TokensLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-40 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-64 rounded-md shimmer" />
        </div>

        {/* Balance hero card */}
        <div className="bg-[#242424] border border-[#FFB81C]/20 rounded-2xl p-8 mb-6 text-center">
          <div className="h-4 w-28 rounded-md shimmer mx-auto mb-3" />
          <div className="h-14 w-40 rounded-2xl shimmer-gold mx-auto mb-2" />
          <div className="h-4 w-36 rounded-md shimmer mx-auto mb-6" />
          <div className="flex gap-3 justify-center">
            <div className="h-11 w-36 rounded-xl shimmer" />
            <div className="h-11 w-28 rounded-xl shimmer" />
          </div>
        </div>

        {/* Token pack grid — 3 packs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`bg-[#242424] border rounded-2xl p-6 text-center ${
                i === 1 ? 'border-[#FFB81C]/30' : 'border-white/10'
              }`}
            >
              <div className="h-4 w-16 rounded-md shimmer mx-auto mb-1" />
              <div className="h-8 w-24 rounded-xl shimmer-gold mx-auto mb-1" />
              <div className="h-3.5 w-20 rounded-md shimmer mx-auto mb-4" />
              <div className="h-6 w-20 rounded-lg shimmer mx-auto mb-3" />
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
          ))}
        </div>

        {/* Usage history */}
        <div className="bg-[#242424] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 rounded-lg shimmer-gold" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 w-20 rounded-lg shimmer" />
              ))}
            </div>
          </div>
          {/* Chart */}
          <div className="h-40 w-full rounded-xl shimmer mb-4" />
          {/* Recent rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg shimmer flex-shrink-0" />
                <div>
                  <div className="h-4 w-40 rounded-md shimmer mb-1" />
                  <div className="h-3 w-24 rounded-md shimmer" />
                </div>
              </div>
              <div className="h-4 w-16 rounded-md shimmer-gold" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
