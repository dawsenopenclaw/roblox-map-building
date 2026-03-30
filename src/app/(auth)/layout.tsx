import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: '#09090b' }}>

      {/* Subtle gold glow behind the form */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-0"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Card column */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">

        {/* ForjeGames logo */}
        <Link href="/" className="flex flex-col items-center mb-8 group select-none">
          <div className="flex items-center gap-2">
            {/* Geometric mark */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="shrink-0"
              aria-hidden
            >
              <polygon
                points="16,2 30,10 30,22 16,30 2,22 2,10"
                stroke="#D4AF37"
                strokeWidth="1.5"
                fill="rgba(212,175,55,0.08)"
              />
              <polygon
                points="16,8 24,13 24,19 16,24 8,19 8,13"
                fill="#D4AF37"
                opacity="0.6"
              />
              <circle cx="16" cy="16" r="3" fill="#D4AF37" />
            </svg>

            <span className="text-2xl font-bold tracking-tight">
              <span className="text-white">Forje</span>
              <span style={{ color: '#D4AF37' }}>Games</span>
            </span>
          </div>
        </Link>

        {/* Demo mode banner */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="mb-5 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border" style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.18)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37" aria-hidden>
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
            <span style={{ color: '#D4AF37' }} className="font-medium">Demo Mode</span>
            <span className="text-zinc-500">— sign in with test credentials or skip straight to the editor.</span>
          </div>
        )}

        {/* Page content (Clerk card + headings) */}
        {children}

      </div>
    </div>
  )
}
