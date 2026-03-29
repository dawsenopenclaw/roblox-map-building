import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ImageToMapLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-48 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-80 rounded-md shimmer" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — upload / input panel */}
          <div className="space-y-4">
            {/* Drop zone */}
            <div className="bg-[#0D1231] border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl shimmer" />
              <div className="h-5 w-48 rounded-lg shimmer-gold" />
              <div className="h-4 w-64 rounded-md shimmer" />
              <div className="h-10 w-36 rounded-xl shimmer" />
            </div>

            {/* Settings card */}
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="h-5 w-24 rounded-lg shimmer-gold" />
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-3.5 w-28 rounded-md shimmer mb-1.5" />
                  <div className="h-10 w-full rounded-xl shimmer" />
                </div>
              ))}
              <div className="h-11 w-full rounded-xl shimmer" />
            </div>
          </div>

          {/* Right — preview / output panel */}
          <div className="space-y-4">
            {/* Preview area */}
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
              <div className="h-64 shimmer" />
              <div className="p-4 flex items-center justify-between">
                <div className="h-4 w-32 rounded-md shimmer" />
                <div className="h-8 w-24 rounded-lg shimmer" />
              </div>
            </div>

            {/* Asset breakdown */}
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <div className="h-5 w-36 rounded-lg shimmer-gold mb-4" />
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-sm shimmer flex-shrink-0" />
                      <div className="h-3.5 rounded-md shimmer" style={{ width: `${80 + i * 18}px` }} />
                    </div>
                    <div className="h-3.5 w-8 rounded-md shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cost estimate */}
            <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="h-4 w-24 rounded-md shimmer mb-1" />
                <div className="h-7 w-28 rounded-xl shimmer-gold" />
              </div>
              <div className="h-11 w-32 rounded-xl shimmer" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
