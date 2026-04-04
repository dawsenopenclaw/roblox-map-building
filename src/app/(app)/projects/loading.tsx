import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ProjectsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-5xl mx-auto px-4 py-8">
        {/* Page header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-4 w-12 rounded-md shimmer" />
            <div className="h-4 w-2 rounded shimmer" />
            <div className="h-7 w-28 rounded-xl shimmer-gold" />
          </div>
          <div className="h-9 w-28 rounded-xl shimmer-gold" />
        </div>

        {/* Project cards grid — 6 cards (3-col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Scene preview area */}
              <div className="h-32 shimmer" />

              {/* Info area */}
              <div className="px-3 py-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 rounded-md shimmer" />
                    <div className="h-3 w-1/3 rounded-md shimmer" />
                  </div>
                  <div className="w-6 h-6 rounded shimmer flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-3 w-16 rounded-md shimmer" />
                  <div className="h-3 w-16 rounded-md shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
