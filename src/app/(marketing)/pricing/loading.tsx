import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function PricingLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="h-12 w-96 max-w-full rounded-2xl shimmer-gold mx-auto mb-4" />
          <div className="h-6 w-2/3 rounded-xl shimmer mx-auto mb-2" />
          <div className="h-6 w-1/2 rounded-xl shimmer mx-auto mb-8" />

          {/* Annual / Monthly toggle */}
          <div className="inline-flex items-center gap-2 bg-[#0D1231] border border-white/10 rounded-full p-1.5">
            <div className="h-8 w-24 rounded-full shimmer" />
            <div className="h-8 w-28 rounded-full shimmer" />
          </div>
        </div>

        {/* Pricing tier cards — 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`relative flex flex-col bg-[#0D1231] border rounded-2xl p-6 ${
                i === 2 ? 'border-[#FFB81C]/30' : 'border-white/10'
              }`}
            >
              {/* Plan name + description */}
              <div className="mb-5">
                <div className="h-5 w-20 rounded-lg shimmer-gold mb-2" />
                <div className="h-4 w-full rounded-md shimmer mb-1" />
                <div className="h-4 w-3/4 rounded-md shimmer" />
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="h-10 w-24 rounded-xl shimmer-gold mb-1" />
                <div className="h-3.5 w-32 rounded-md shimmer mb-2" />
                <div className="h-4 w-36 rounded-md shimmer" />
              </div>

              {/* CTA button */}
              <div className="h-12 w-full rounded-xl shimmer mb-6" />

              {/* Feature list */}
              <div className="space-y-2.5 flex-1">
                {Array.from({ length: 5 + i }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full shimmer flex-shrink-0" />
                    <div className="h-3.5 rounded-md shimmer flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Token calculator card */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto mb-20">
          <div className="h-7 w-72 rounded-xl shimmer-gold mx-auto mb-2" />
          <div className="h-4 w-48 rounded-md shimmer mx-auto mb-8" />

          <div className="h-2 w-full rounded-full shimmer mb-2" />
          <div className="flex justify-between mb-8">
            <div className="h-4 w-10 rounded-md shimmer" />
            <div className="h-6 w-32 rounded-lg shimmer-gold" />
            <div className="h-4 w-14 rounded-md shimmer" />
          </div>

          <div className="bg-[#111640] rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="h-4 w-32 rounded-md shimmer mb-2" />
              <div className="h-8 w-20 rounded-xl shimmer-gold mb-1" />
              <div className="h-4 w-40 rounded-md shimmer" />
            </div>
            <div className="h-10 w-28 rounded-xl shimmer flex-shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0A0E27] rounded-lg px-3 py-2">
                <div className="h-4 w-36 rounded-md shimmer" />
                <div className="h-4 w-10 rounded-md shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="mb-20">
          <div className="h-7 w-56 rounded-xl shimmer-gold mx-auto mb-8" />
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-5 gap-0 bg-[#0D1231] border-b border-white/10 px-4 py-4">
              <div className="h-4 w-20 rounded-md shimmer" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 w-16 rounded-md shimmer mx-auto" />
              ))}
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`grid grid-cols-5 gap-0 px-4 py-3.5 border-b border-white/5 ${
                  i % 2 === 0 ? 'bg-[#0A0E27]/40' : ''
                }`}
              >
                <div className="h-3.5 w-32 rounded-md shimmer" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 w-12 rounded-md shimmer mx-auto" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Guarantee cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full shimmer mx-auto mb-3" />
              <div className="h-5 w-32 rounded-lg shimmer-gold mx-auto mb-2" />
              <div className="h-4 w-full rounded-md shimmer mb-1" />
              <div className="h-4 w-3/4 rounded-md shimmer mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
