import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function EditorLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Editor toolbar */}
        <div className="h-14 border-b border-white/10 bg-[#141414] flex items-center gap-3 px-4">
          <div className="h-7 w-28 rounded-lg shimmer-gold" />
          <div className="w-px h-5 bg-white/10" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-lg shimmer" />
          ))}
          <div className="flex-1" />
          <div className="h-8 w-24 rounded-lg shimmer" />
          <div className="h-8 w-20 rounded-lg shimmer" />
        </div>

        {/* Main editor body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-64 border-r border-white/10 bg-[#111111] p-3 space-y-2 flex-shrink-0">
            <div className="h-4 w-20 rounded shimmer mb-3" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded shimmer flex-shrink-0" />
                <div className="h-4 rounded shimmer flex-1" style={{ width: `${50 + (i % 3) * 20}%` }} />
              </div>
            ))}
          </div>

          {/* Canvas area */}
          <div className="flex-1 relative bg-[#0d0d0d] shimmer" />

          {/* Right panel */}
          <div className="w-64 border-l border-white/10 bg-[#111111] p-4 space-y-4 flex-shrink-0">
            <div className="h-4 w-24 rounded shimmer-gold mb-3" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 rounded shimmer" />
                <div className="h-8 w-full rounded-lg shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
