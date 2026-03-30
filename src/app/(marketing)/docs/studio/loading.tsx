import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function StudioDocsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Back nav skeleton */}
        <div className="h-5 w-20 rounded-md shimmer mb-8" />

        {/* Header skeleton */}
        <div className="mb-10">
          <div className="h-8 w-56 rounded-lg shimmer-gold mb-3" />
          <div className="h-5 w-full rounded-md shimmer mb-2" />
          <div className="h-5 w-4/5 rounded-md shimmer" />
        </div>

        {/* TOC skeleton */}
        <div className="lg:hidden mb-8">
          <div className="h-5 w-24 rounded-md shimmer-gold mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-40 rounded-md shimmer" />
            ))}
          </div>
        </div>

        {/* Main content + sidebar grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content — 3/4 width */}
          <div className="lg:col-span-3 space-y-8">
            {/* Section 1 */}
            <div>
              <div className="h-6 w-40 rounded-lg shimmer-gold mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded-md shimmer" />
                <div className="h-4 w-full rounded-md shimmer" />
                <div className="h-4 w-3/4 rounded-md shimmer" />
              </div>
              <div className="h-48 w-full rounded-lg shimmer mt-4" />
            </div>

            {/* Section 2 */}
            <div>
              <div className="h-6 w-40 rounded-lg shimmer-gold mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded-md shimmer" />
                <div className="h-4 w-full rounded-md shimmer" />
                <div className="h-4 w-4/5 rounded-md shimmer" />
              </div>
              <div className="h-40 w-full rounded-lg shimmer mt-4" />
            </div>

            {/* Section 3 */}
            <div>
              <div className="h-6 w-40 rounded-lg shimmer-gold mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-48 rounded-md shimmer mb-2" />
                    <div className="h-3 w-full rounded-md shimmer mb-1" />
                    <div className="h-3 w-4/5 rounded-md shimmer" />
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ section */}
            <div>
              <div className="h-6 w-48 rounded-lg shimmer-gold mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="h-4 w-56 rounded-md shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar — 1/4 width (hidden on mobile) */}
          <div className="hidden lg:block space-y-6">
            {/* On this page */}
            <div className="sticky top-4">
              <div className="h-5 w-28 rounded-md shimmer-gold mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-3 w-32 rounded-md shimmer" />
                ))}
              </div>
            </div>

            {/* Related docs */}
            <div>
              <div className="h-5 w-32 rounded-md shimmer-gold mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-3 w-40 rounded-md shimmer" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer nav skeleton */}
        <div className="mt-12 pt-8 border-t border-white/10 flex justify-between">
          <div className="h-5 w-32 rounded-md shimmer" />
          <div className="h-5 w-32 rounded-md shimmer" />
        </div>
      </div>
    </>
  )
}
