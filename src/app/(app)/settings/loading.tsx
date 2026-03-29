export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Page title */}
      <div className="mb-8">
        <div className="h-8 w-32 rounded-xl shimmer mb-2" />
        <div className="h-4 w-60 rounded-md shimmer" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-xl shimmer flex-shrink-0"
            style={{ width: `${80 + i * 10}px` }}
          />
        ))}
      </div>

      {/* Account tab content — most complex / default view */}
      <div className="space-y-6">
        {/* Profile Photo card */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <div className="h-5 w-32 rounded-lg shimmer mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full shimmer flex-shrink-0" />
            <div>
              <div className="h-9 w-28 rounded-lg shimmer mb-1" />
              <div className="h-3 w-36 rounded-md shimmer" />
            </div>
          </div>
        </div>

        {/* Profile Details card */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <div className="h-5 w-36 rounded-lg shimmer mb-4" />
          <div className="space-y-4">
            {['Display Name', 'Username', 'Email'].map((_, i) => (
              <div key={i}>
                <div className="h-3.5 w-28 rounded-md shimmer mb-1.5" />
                <div className="h-12 w-full rounded-xl shimmer" />
              </div>
            ))}
          </div>
          <div className="h-10 w-32 rounded-xl shimmer mt-6" />
        </div>

        {/* Password card */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <div className="h-5 w-24 rounded-lg shimmer mb-2" />
          <div className="h-4 w-full max-w-sm rounded-md shimmer mb-4" />
          <div className="h-10 w-36 rounded-xl shimmer" />
        </div>

        {/* Billing card */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <div className="h-5 w-20 rounded-lg shimmer mb-2" />
          <div className="h-4 w-72 rounded-md shimmer mb-4" />
          <div className="h-10 w-32 rounded-xl shimmer" />
        </div>
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
