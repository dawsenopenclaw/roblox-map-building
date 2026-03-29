import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function ReferralsLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-36 rounded-xl shimmer-gold mb-2" />
          <div className="h-4 w-72 rounded-md shimmer" />
        </div>

        {/* Stats row — 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/10 rounded-2xl p-5">
              <div className="h-3.5 w-24 rounded-md shimmer mb-2" />
              <div className="h-8 w-20 rounded-xl shimmer-gold" />
            </div>
          ))}
        </div>

        {/* Referral link card */}
        <div className="bg-[#141414] border border-[#FFB81C]/20 rounded-2xl p-6 mb-6">
          <div className="h-5 w-32 rounded-lg shimmer-gold mb-4" />
          <div className="flex gap-3">
            <div className="flex-1 h-11 rounded-xl shimmer" />
            <div className="h-11 w-24 rounded-xl shimmer" />
          </div>
          <div className="h-3.5 w-56 rounded-md shimmer mt-3" />
        </div>

        {/* How it works */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="h-5 w-28 rounded-lg shimmer-gold mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full shimmer" />
                <div className="h-4 w-28 rounded-md shimmer" />
                <div className="h-3.5 w-full rounded-md shimmer" />
                <div className="h-3.5 w-3/4 rounded-md shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Referral history */}
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-6">
          <div className="h-5 w-40 rounded-lg shimmer-gold mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full shimmer" />
                <div>
                  <div className="h-4 w-32 rounded-md shimmer mb-1" />
                  <div className="h-3 w-24 rounded-md shimmer" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 rounded-md shimmer-gold mb-1" />
                <div className="h-5 w-16 rounded-full shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
