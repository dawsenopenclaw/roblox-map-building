import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function CommunityLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter max-w-3xl mx-auto pb-16 pt-2 px-4">
        {/* Back link skeleton */}
        <div className="h-3 w-20 rounded-md shimmer mb-8" />

        {/* Hero card skeleton */}
        <div
          className="rounded-2xl p-8 sm:p-12 mb-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl shimmer" />
            <div className="w-10 h-10 rounded-xl shimmer" />
            <div className="w-10 h-10 rounded-xl shimmer" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-56 rounded-xl shimmer-gold" />
            <div className="h-4 w-72 rounded-md shimmer" />
            <div className="h-4 w-48 rounded-md shimmer" />
          </div>
        </div>

        {/* Feature grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-9 h-9 rounded-lg shimmer mb-3" />
              <div className="h-4 w-28 rounded-md shimmer-gold mb-2" />
              <div className="h-3 w-full rounded-md shimmer mb-1" />
              <div className="h-3 w-3/4 rounded-md shimmer" />
            </div>
          ))}
        </div>

        {/* Email signup skeleton */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl shimmer" />
            <div className="h-5 w-40 rounded-lg shimmer-gold" />
            <div className="h-4 w-64 rounded-md shimmer" />
            <div className="flex gap-3 w-full max-w-sm mt-2">
              <div className="flex-1 h-10 rounded-xl shimmer" />
              <div className="w-24 h-10 rounded-xl shimmer-gold" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
