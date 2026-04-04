import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function EditorLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen flex flex-col" style={{ background: '#050810' }}>
        {/* Top bar — project name + action buttons */}
        <div className="h-14 border-b border-white/10 bg-[#0d1120] flex items-center gap-3 px-4 flex-shrink-0">
          {/* Back arrow + project title */}
          <div className="h-7 w-7 rounded-lg shimmer flex-shrink-0" />
          <div className="h-6 w-36 rounded-lg shimmer-gold" />
          <div className="w-px h-5 bg-white/10" />
          {/* Toolbar action icons */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-lg shimmer" />
          ))}
          <div className="flex-1" />
          {/* Run + Deploy buttons */}
          <div className="h-8 w-20 rounded-lg shimmer" />
          <div className="h-8 w-24 rounded-lg shimmer-gold" />
          {/* Spacer for global profile button */}
          <div className="w-10 flex-shrink-0" />
        </div>

        {/* Main two-panel body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — AI chat panel */}
          <div
            className="w-80 border-r border-white/10 flex flex-col flex-shrink-0"
            style={{ background: '#0d1120' }}
          >
            {/* Chat header */}
            <div className="h-12 border-b border-white/10 flex items-center gap-3 px-4 flex-shrink-0">
              <div className="w-7 h-7 rounded-full shimmer flex-shrink-0" />
              <div className="h-4 w-28 rounded-md shimmer" />
              <div className="flex-1" />
              <div className="w-6 h-6 rounded shimmer" />
            </div>

            {/* Message bubbles — alternating user / assistant */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              {/* Assistant message */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full shimmer flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-full rounded shimmer" />
                  <div className="h-3 w-5/6 rounded shimmer" />
                  <div className="h-3 w-4/6 rounded shimmer" />
                </div>
              </div>
              {/* User message */}
              <div className="flex justify-end">
                <div className="h-9 w-48 rounded-2xl shimmer-gold" />
              </div>
              {/* Assistant message */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full shimmer flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-full rounded shimmer" />
                  <div className="h-3 w-3/4 rounded shimmer" />
                </div>
              </div>
              {/* Code block skeleton */}
              <div
                className="rounded-xl p-3 space-y-1.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 rounded shimmer"
                    style={{ width: `${45 + (i % 4) * 13}%` }}
                  />
                ))}
              </div>
              {/* User message */}
              <div className="flex justify-end">
                <div className="h-9 w-56 rounded-2xl shimmer-gold" />
              </div>
              {/* Typing indicator */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full shimmer flex-shrink-0" />
                <div className="flex gap-1.5 items-center h-7 px-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full shimmer" />
                  ))}
                </div>
              </div>
            </div>

            {/* Chat input bar */}
            <div className="p-3 border-t border-white/10 flex-shrink-0">
              <div className="h-10 w-full rounded-xl shimmer" />
            </div>
          </div>

          {/* RIGHT — Studio / output panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Panel tab bar */}
            <div
              className="h-10 border-b border-white/10 flex items-center gap-1 px-3 flex-shrink-0"
              style={{ background: '#0d1120' }}
            >
              {['Output', 'Preview', 'Files'].map((_, i) => (
                <div key={i} className={`h-6 rounded-md shimmer${i === 0 ? '-gold' : ''}`} style={{ width: i === 0 ? 64 : 56 }} />
              ))}
            </div>

            {/* Output / preview area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main viewport — large shimmer block */}
              <div className="flex-1 relative p-4">
                <div
                  className="w-full h-full rounded-2xl shimmer"
                  style={{ minHeight: 300 }}
                />
              </div>

              {/* Right gutter — properties / settings */}
              <div
                className="w-56 border-l border-white/10 p-4 space-y-4 flex-shrink-0"
                style={{ background: '#0d1120' }}
              >
                <div className="h-4 w-20 rounded shimmer-gold" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-14 rounded shimmer" />
                    <div className="h-8 w-full rounded-lg shimmer" />
                  </div>
                ))}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="h-3 w-16 rounded shimmer-gold" />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-3 w-20 rounded shimmer" />
                      <div className="h-5 w-10 rounded-full shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
