import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function GameDnaLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
          <div>
            <div className="h-6 w-48 rounded-xl shimmer-gold mb-1.5" />
            <div className="h-4 w-64 rounded-md shimmer" />
          </div>
        </div>

        {/* Scan form card */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
          <div className="h-4 w-32 rounded-md shimmer mb-2" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 rounded-xl shimmer" />
            <div className="h-12 w-20 rounded-xl shimmer" />
          </div>
          <div className="h-3 w-48 rounded-md shimmer mt-2" />
        </div>

        {/* Compare link */}
        <div className="flex justify-end">
          <div className="h-4 w-36 rounded-md shimmer" />
        </div>

        {/* Recent scans list */}
        <div>
          <div className="h-5 w-28 rounded-lg shimmer-gold mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#141414] border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shimmer flex-shrink-0" />
                  <div>
                    <div className="h-4 w-40 rounded-md shimmer mb-1" />
                    <div className="h-3 w-56 rounded-md shimmer" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-20 rounded-full shimmer" />
                  <div className="h-4 w-20 rounded-md shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
