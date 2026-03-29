import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AdminTemplatesLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-48 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-32 rounded shimmer" />
          </div>
          <div className="h-9 w-24 rounded-lg shimmer" />
        </div>

        {/* Template review cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Thumbnail */}
              <div className="w-full sm:w-32 h-24 rounded-lg shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-5 w-48 rounded shimmer-gold" />
                  <div className="h-5 w-20 rounded-full shimmer flex-shrink-0" />
                </div>
                <div className="h-3 w-full rounded shimmer" />
                <div className="h-3 w-3/4 rounded shimmer" />
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-3 w-24 rounded shimmer" />
                  <div className="h-3 w-20 rounded shimmer" />
                  <div className="h-3 w-16 rounded shimmer" />
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 sm:w-24">
                <div className="h-9 w-full rounded-lg shimmer" />
                <div className="h-9 w-full rounded-lg shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
