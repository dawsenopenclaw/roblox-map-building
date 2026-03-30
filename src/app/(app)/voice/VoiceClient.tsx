'use client'

export default function VoiceClient() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 pt-2">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#D4AF37]/70 uppercase tracking-widest">AI Feature</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-gray-400">Voice Input</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Build with{' '}
          <span className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            Your Voice
          </span>
        </h1>
        <p className="text-gray-300 text-base max-w-xl leading-relaxed">
          Describe your Roblox game idea out loud — our AI turns speech into scripts,
          terrain, and asset placements in seconds.
        </p>
      </div>

      {/* Coming soon card */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-8 flex flex-col items-center text-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)' }}
        >
          <svg className="w-8 h-8 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Voice Build is coming soon</p>
          <p className="text-gray-400 text-sm mt-2 max-w-sm leading-relaxed">
            The voice interface is being integrated into the Editor. Head there to use
            the chat bar for text-based AI prompts in the meantime.
          </p>
        </div>
        <a
          href="/editor"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#0a0a0a] transition-all"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          Open Editor
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>

      {/* Feature previews */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: '🎙️', title: 'Natural Speech', desc: 'Say "add a lava floor to my obby" and it\'s done. No commands to memorize.' },
          { icon: '⚡', title: 'Instant Output', desc: 'Under 2 seconds from speech to Luau script in your Studio project.' },
          { icon: '🔁', title: 'Iterative', desc: 'Refine with follow-up prompts. "Make it bigger", "change the color to red."' },
        ].map((feat) => (
          <div key={feat.title} className="bg-[#141414] border border-white/8 rounded-xl p-5 space-y-3">
            <span className="text-2xl">{feat.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm">{feat.title}</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
