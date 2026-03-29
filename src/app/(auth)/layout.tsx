import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">

      {/* Subtle dot-grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(212,175,55,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient gold glow at top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(212,175,55,0.12) 0%, transparent 70%)',
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
              <span className="text-foreground">Forje</span>
              <span className="text-gold">Games</span>
            </span>
          </div>
          <p className="text-muted text-xs mt-1 tracking-widest uppercase">
            AI-Powered Roblox Development
          </p>
        </Link>

        {/* Page content (Clerk card + headings) */}
        {children}

        {/* Trust badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="shrink-0"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p className="text-xs text-muted">
            <span className="text-gold font-semibold">10%</span> of all revenue is donated to charity
          </p>
        </div>

      </div>
    </div>
  )
}
