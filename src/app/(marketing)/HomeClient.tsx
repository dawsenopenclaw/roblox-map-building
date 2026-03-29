'use client'

import Link from 'next/link'

/* ─── Floating particle dot ──────────────────────────────────────────────── */
function Particle({
  size,
  top,
  left,
  delay,
  animClass,
}: {
  size: number
  top: string
  left: string
  delay: string
  animClass: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`absolute rounded-full bg-[#D4AF37] ${animClass}`}
      style={{
        width: size,
        height: size,
        top,
        left,
        animationDelay: delay,
        filter: 'blur(1px)',
      }}
    />
  )
}

export default function HomeClient() {
  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 text-center overflow-hidden"
      style={{ background: '#030712' }}
    >
      {/* ── Subtle grid background ──────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.055) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── Radial glow behind hero ─────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full animate-glow-pulse"
        style={{
          width: 520,
          height: 520,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -54%)',
          background:
            'radial-gradient(circle, rgba(212,175,55,0.14) 0%, rgba(255,184,28,0.06) 45%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {/* ── Floating particles ──────────────────────────────────────────── */}
      <Particle size={5}  top="18%"  left="12%"  delay="0s"    animClass="animate-float" />
      <Particle size={3}  top="28%"  left="82%"  delay="1.2s"  animClass="animate-float-slow" />
      <Particle size={6}  top="65%"  left="8%"   delay="0.6s"  animClass="animate-float-x" />
      <Particle size={4}  top="72%"  left="88%"  delay="2s"    animClass="animate-float" />
      <Particle size={3}  top="42%"  left="91%"  delay="0.3s"  animClass="animate-float-slow" />
      <Particle size={5}  top="14%"  left="66%"  delay="1.8s"  animClass="animate-float-x" />
      <Particle size={3}  top="80%"  left="44%"  delay="0.9s"  animClass="animate-float" />
      <Particle size={4}  top="55%"  left="20%"  delay="2.4s"  animClass="animate-float-slow" />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.35)',
            boxShadow: '0 0 24px rgba(212,175,55,0.15)',
          }}
        >
          <svg className="w-8 h-8" viewBox="0 0 28 28" fill="none" style={{ color: '#FFB81C' }}>
            <path d="M14 4L4 10v8l10 6 10-6v-8L14 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M4 10l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M14 16v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: 'rgba(212,175,55,0.10)',
            border: '1px solid rgba(212,175,55,0.28)',
            color: '#D4AF37',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-glow-pulse"
            style={{ background: '#FFB81C' }}
          />
          AI-Powered Game Builder
        </div>

        {/* Headline — gold gradient */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold mb-5 animate-gradient-x"
          style={{
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            background: 'linear-gradient(90deg, #D4AF37 0%, #FFB81C 40%, #FFF0A0 60%, #FFB81C 80%, #D4AF37 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ForjeGames
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-gray-300 mb-3 max-w-md leading-relaxed font-medium">
          Build Roblox Games with AI —<br className="hidden sm:block" />
          From Idea to Playable in Minutes
        </p>
        <p className="text-sm text-gray-500 mb-10 max-w-sm">
          Describe your game, watch it come to life. No scripting knowledge required.
        </p>

        {/* CTA — gold button with animated gradient border wrapper */}
        <div className="relative group mb-6">
          {/* Animated border glow ring */}
          <div
            aria-hidden="true"
            className="absolute -inset-[2px] rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, #D4AF37, #FFB81C, #FFF0A0, #D4AF37)',
              backgroundSize: '200% 100%',
              animation: 'border-spin 2.5s linear infinite',
              filter: 'blur(6px)',
            }}
          />
          <Link
            href="/editor"
            className="relative inline-flex items-center gap-2.5 font-bold text-lg px-9 py-4 rounded-[13px] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFB81C]"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
              color: '#030712',
              boxShadow: '0 0 20px rgba(212,175,55,0.35), 0 4px 16px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 0 36px rgba(212,175,55,0.65), 0 4px 24px rgba(0,0,0,0.5)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 0 20px rgba(212,175,55,0.35), 0 4px 16px rgba(0,0,0,0.4)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            Start Building Free
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-sm text-gray-500 mb-10">
          1,000 free tokens&nbsp;&nbsp;·&nbsp;&nbsp;No credit card&nbsp;&nbsp;·&nbsp;&nbsp;Works with Roblox Studio
        </p>

        {/* Availability strip */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-gray-600 uppercase tracking-widest">Available as</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/editor"
              className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)')
              }
            >
              Web Editor
            </Link>
            <Link
              href="/download"
              className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)')
              }
            >
              Desktop App ↓
            </Link>
          </div>
          <p className="text-xs text-gray-600">Desktop connects directly to Roblox Studio.</p>
        </div>

      </div>
    </div>
  )
}
