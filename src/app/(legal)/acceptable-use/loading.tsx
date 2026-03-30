import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function AcceptableUseLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-8 w-56 rounded-xl shimmer-gold mb-2" />
        <div className="h-4 w-32 rounded shimmer mb-8" />
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-5 w-48 rounded shimmer-gold mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded shimmer" />
                <div className="h-4 w-11/12 rounded shimmer" />
                <div className="h-4 w-4/5 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
