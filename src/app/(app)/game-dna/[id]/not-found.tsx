import type { Metadata } from 'next'
import Link from 'next/link'
import { ScanSearch } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Game Scan Not Found | ForjeGames',
  description: 'This game scan could not be found.',
  robots: { index: false, follow: false },
}

export default function GameDnaNotFound() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-4 overflow-hidden">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 blur-[120px]" />
      </div>

      <div className="relative max-w-md w-full text-center">
        <div className="relative bg-white/[0.025] border border-white/[0.07] rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

          {/* Icon */}
          <div className="mx-auto mb-7 relative w-20 h-20">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: 'rgba(212,175,55,0.08)', animationDuration: '3s' }}
            />
            <div className="relative w-20 h-20 rounded-full border flex items-center justify-center"
              style={{ backgroundColor: 'rgba(212,175,55,0.08)', borderColor: 'rgba(212,175,55,0.25)' }}
            >
              <ScanSearch className="w-9 h-9" style={{ color: '#D4AF37' }} strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Game Scan Not Found</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            This game scan doesn&apos;t exist or may have expired. Run a new scan to analyse a game.
          </p>

          <Link
            href="/game-dna"
            className="inline-flex items-center gap-2 font-bold px-8 py-3 rounded-xl transition-all text-sm hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
              color: '#050810',
              boxShadow: '0 4px 20px rgba(212,175,55,0.2)',
            }}
          >
            Back to Game DNA
          </Link>

        </div>

        <p className="mt-6 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors font-medium">ForjeGames</Link>
          {' '}— AI-powered Roblox game builder
        </p>
      </div>
    </div>
  )
}
