'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

// ─── ForjeGames logo mark ─────────────────────────────────────────────────────

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
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
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#09090b' }}
    >
      {/* Subtle radial glow behind the form */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse 600px 500px at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Demo mode banner */}
      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 mb-6 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border"
          style={{
            background: 'rgba(212,175,55,0.06)',
            borderColor: 'rgba(212,175,55,0.18)',
            maxWidth: '28rem',
            width: '100%',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37" aria-hidden>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          <span style={{ color: '#D4AF37' }} className="font-medium">Demo Mode</span>
          <span className="text-zinc-500">— sign in with test credentials or skip to the editor.</span>
        </motion.div>
      )}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-8"
      >
        <Link href="/" className="flex items-center gap-2.5 select-none group">
          <LogoMark size={32} />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Forje</span>
            <span style={{ color: '#D4AF37' }}>Games</span>
          </span>
        </Link>
      </motion.div>

      {/* Auth content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full px-4"
        style={{ maxWidth: '28rem' }}
      >
        {children}
      </motion.div>
    </div>
  )
}
