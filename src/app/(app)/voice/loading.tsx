export default function VoiceLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="h-8 w-48 rounded-xl shimmer mb-2" />
        <div className="h-4 w-72 rounded-md shimmer" />
      </div>

      {/* Mic button area */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6">
        {/* Mic button circle */}
        <div className="w-28 h-28 rounded-full shimmer" />

        {/* Waveform placeholder */}
        <div className="w-full h-16 rounded-xl overflow-hidden shimmer relative">
          {/* Simulated bar pattern overlay */}
          <div className="absolute inset-0 flex items-end justify-center gap-0.5 px-4 pb-2 opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-white/40 rounded-t-sm"
                style={{ height: `${20 + Math.sin(i * 0.4) * 14}px` }}
              />
            ))}
          </div>
        </div>

        {/* Status label */}
        <div className="h-4 w-40 rounded-md shimmer" />

        {/* Suggestion pills */}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-7 rounded-full shimmer" style={{ width: `${140 + i * 20}px` }} />
          ))}
        </div>
      </div>

      {/* Command history */}
      <div className="space-y-3">
        <div className="h-5 w-36 rounded-lg shimmer mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#0D1231] border border-white/10 rounded-xl px-5 py-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="h-4 w-2/3 rounded-md shimmer" />
              <div className="h-5 w-16 rounded-full shimmer flex-shrink-0" />
            </div>
            <div className="h-3 w-1/2 rounded-md shimmer mb-3" />
            {/* Build steps */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full shimmer flex-shrink-0" />
                  <div className="h-3 rounded-md shimmer" style={{ width: `${80 + j * 20}px` }} />
                </div>
              ))}
            </div>
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
