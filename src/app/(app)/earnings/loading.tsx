export default function EarningsLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-44 rounded-xl shimmer mb-2" />
        <div className="h-4 w-64 rounded-md shimmer" />
      </div>

      {/* Milestone progress bar card */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-32 rounded-md shimmer" />
          <div className="h-4 w-24 rounded-md shimmer" />
        </div>
        <div className="h-2 w-full rounded-full shimmer" />
        <div className="h-3 w-24 rounded-md shimmer mt-2" />
      </div>

      {/* Stat cards — 5 cards matching col-span layout */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
            <div className="h-3 w-20 rounded-md shimmer mb-2" />
            <div className="h-7 w-16 rounded-lg shimmer" />
          </div>
        ))}
      </div>

      {/* Revenue chart card */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-40 rounded-lg shimmer" />
          {/* Period buttons */}
          <div className="flex gap-2">
            {['Daily', 'Weekly', 'Monthly'].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-lg shimmer" />
            ))}
          </div>
        </div>
        {/* Chart placeholder — 256px tall matching Recharts height */}
        <div className="h-64 w-full rounded-xl shimmer relative overflow-hidden">
          {/* Simulated line chart shape */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 400 256"
            preserveAspectRatio="none"
          >
            <polyline
              points="0,200 60,160 120,180 180,100 240,120 300,60 360,80 400,40"
              fill="none"
              stroke="#FFB81C"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Payout schedule card */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <div className="h-5 w-36 rounded-lg shimmer mb-4" />
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4">
              <div className="h-3 w-24 rounded-md shimmer mb-2" />
              <div className="h-5 w-20 rounded-md shimmer" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <div className="h-10 w-40 rounded-xl shimmer" />
          <div className="h-10 w-32 rounded-xl shimmer" />
        </div>
      </div>

      {/* Transaction history card */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <div className="h-5 w-40 rounded-lg shimmer mb-4" />
        {/* Table header */}
        <div className="flex gap-4 pb-3 border-b border-white/10">
          {['Template', 'Gross', 'Net', 'Status', 'Date'].map((_, i) => (
            <div key={i} className="h-3 rounded-md shimmer" style={{ width: `${60 + i * 10}px` }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-white/5">
            <div className="h-4 w-32 rounded-md shimmer" />
            <div className="h-4 w-14 rounded-md shimmer ml-auto" />
            <div className="h-4 w-14 rounded-md shimmer" />
            <div className="h-5 w-20 rounded-full shimmer" />
            <div className="h-4 w-20 rounded-md shimmer" />
          </div>
        ))}
      </div>

      <style>{`
        .shimmer {
          background: linear-gradient(
            90deg,
            #0D1231 0%,
            #1A1F45 50%,
            #0D1231 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
