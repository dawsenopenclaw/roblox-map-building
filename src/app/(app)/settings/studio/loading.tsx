import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function StudioSettingsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-2xl mx-auto px-4 py-10">
        {/* Back nav skeleton */}
        <div className="h-5 w-20 rounded-md shimmer mb-8" />

        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
            <div>
              <div className="h-7 w-40 rounded-lg shimmer-gold mb-2" />
              <div className="h-4 w-56 rounded-md shimmer" />
            </div>
          </div>
        </div>

        {/* Sections skeleton */}
        <div className="space-y-5">
          {/* Section 1: Install Plugin */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="mb-5">
              <div className="h-5 w-32 rounded-lg shimmer-gold mb-1" />
              <div className="h-4 w-48 rounded-md shimmer" />
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full shimmer" />
                <div className="flex-1 pt-1">
                  <div className="h-4 w-32 rounded-md shimmer mb-2" />
                  <div className="h-4 w-24 rounded-md shimmer mb-2" />
                  <div className="h-9 w-40 rounded-lg shimmer" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full shimmer" />
                <div className="flex-1 pt-1">
                  <div className="h-4 w-40 rounded-md shimmer mb-2" />
                  <div className="h-10 w-full rounded-lg shimmer mb-2" />
                  <div className="h-3 w-32 rounded-md shimmer" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full shimmer" />
                <div className="flex-1 pt-1">
                  <div className="h-4 w-32 rounded-md shimmer mb-2" />
                  <div className="h-4 w-56 rounded-md shimmer" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="h-4 w-48 rounded-md shimmer" />
            </div>
          </div>

          {/* Section 2: Connection Code */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="mb-5">
              <div className="h-5 w-32 rounded-lg shimmer-gold mb-1" />
              <div className="h-4 w-48 rounded-md shimmer" />
            </div>

            <div className="mb-5">
              <div className="h-4 w-24 rounded-md shimmer mb-3" />
              <div className="h-20 w-full rounded-xl shimmer mb-3" />
              <div className="h-10 w-full rounded-lg shimmer" />
            </div>

            <div className="h-3 text-center w-64 mx-auto rounded-md shimmer" />
          </div>

          {/* Section 3: Connected Sessions */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
            <div className="mb-5">
              <div className="h-5 w-40 rounded-lg shimmer-gold mb-1" />
              <div className="h-4 w-48 rounded-md shimmer" />
            </div>

            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full shimmer flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded shimmer" />
                      <div className="h-4 w-32 rounded-md shimmer" />
                    </div>
                    <div className="h-3 w-56 rounded-md shimmer" />
                  </div>
                  <div className="h-8 w-24 rounded-lg shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Docs link skeleton */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded shimmer" />
          <div className="h-4 w-48 rounded-md shimmer" />
        </div>
      </div>
    </>
  )
}
