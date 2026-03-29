import { TopLoadingBar } from '@/components/TopLoadingBar'

const CATEGORY_COUNT = 6

export default function AchievementsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="h-7 w-36 rounded-xl shimmer-gold mb-2" />
            <div className="h-4 w-28 rounded-md shimmer" />
          </div>
          {/* Progress percentage */}
          <div className="text-right">
            <div className="h-9 w-16 rounded-xl shimmer-gold mb-1" />
            <div className="h-3 w-14 rounded-md shimmer ml-auto" />
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-2 w-full rounded-full shimmer mb-8" />

        {/* Achievement categories */}
        {Array.from({ length: CATEGORY_COUNT }).map((_, cat) => (
          <div key={cat} className="mb-8">
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-32 rounded-lg shimmer-gold" />
              <div className="h-4 w-10 rounded-md shimmer" />
            </div>

            {/* Achievement card grid — 6 per category matching xl:grid-cols-6 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#141414] border border-white/10 rounded-xl p-3 text-center"
                >
                  {/* Icon placeholder */}
                  <div className="w-10 h-10 rounded-xl shimmer mx-auto mb-2" />
                  {/* Achievement name */}
                  <div className="h-3.5 w-3/4 rounded-md shimmer mx-auto mb-1.5" />
                  {/* Description */}
                  <div className="h-3 w-full rounded-md shimmer mb-1" />
                  <div className="h-3 w-2/3 rounded-md shimmer mx-auto mb-2" />
                  {/* XP badge */}
                  <div className="h-4 w-14 rounded-full shimmer mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
