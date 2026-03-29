import Link from 'next/link'

export default function HomeClient() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 text-center">
      {/* Logo mark */}
      <div className="w-14 h-14 rounded-2xl bg-[#FFB81C]/15 border border-[#FFB81C]/30 flex items-center justify-center mb-8">
        <svg className="w-7 h-7 text-[#FFB81C]" viewBox="0 0 28 28" fill="none">
          <path d="M14 4L4 10v8l10 6 10-6v-8L14 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M4 10l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M14 16v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Headline */}
      <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4" style={{ letterSpacing: '-0.025em' }}>
        ForjeGames
      </h1>

      <p className="text-xl text-gray-400 mb-10 max-w-sm leading-relaxed">
        Build Roblox games by talking to AI.
      </p>

      {/* CTA */}
      <Link
        href="/editor"
        className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-lg px-8 py-4 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
      >
        Open Editor
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Trust line */}
      <p className="text-sm text-gray-600 mt-6">
        1,000 free tokens&nbsp;&nbsp;·&nbsp;&nbsp;No credit card&nbsp;&nbsp;·&nbsp;&nbsp;Works with Roblox Studio
      </p>
    </div>
  )
}
