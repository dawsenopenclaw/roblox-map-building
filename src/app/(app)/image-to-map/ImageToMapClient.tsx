'use client'

import { ImageIcon, Cpu, Box, Download, Wand2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: ImageIcon,
    title: 'Upload Photo',
    desc: 'Drag in any image — concept art, real-world photo, or a rough sketch.',
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    desc: 'Our model reads terrain, objects, and spatial structure automatically.',
  },
  {
    icon: Box,
    title: '3D Generation',
    desc: 'Every surface becomes geometry. Textures are inferred from the source.',
  },
  {
    icon: Download,
    title: 'One-Click Import',
    desc: 'Drop the finished map straight into your Roblox place via the Studio plugin.',
  },
]

// CSS-only illustration: image icon → 3D grid morphing
function ImageToGridIllustration() {
  return (
    <div className="relative flex items-center justify-center gap-6 mb-6" aria-hidden="true">
      {/* Source image card */}
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
          border: '1px solid rgba(212,175,55,0.22)',
        }}
      >
        <ImageIcon className="w-7 h-7 text-[#D4AF37]" />
      </div>

      {/* Arrow / pulse line */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      {/* 3D grid illustration */}
      <div
        className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0"
        style={{
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.18)',
        }}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <div
              key={`${row}-${col}`}
              className="absolute"
              style={{
                left: `${col * 25}%`,
                top: `${row * 25}%`,
                width: '25%',
                height: '25%',
                border: '0.5px solid rgba(212,175,55,0.25)',
                background: (row + col) % 2 === 0 ? 'rgba(212,175,55,0.04)' : 'transparent',
              }}
            />
          ))
        )}
        {/* Isometric accent dot */}
        <div
          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-sm bg-[#D4AF37]/70"
          style={{ boxShadow: '0 0 6px rgba(212,175,55,0.5)' }}
        />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

export default function ImageToMapClient() {
  return (
    <div className="max-w-3xl mx-auto pb-16 pt-2 px-4">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 sm:p-12 mb-8 text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(5,8,16,0) 60%)',
          border: '1px solid rgba(212,175,55,0.12)',
        }}
      >
        {/* Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <ImageToGridIllustration />

          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 mb-4">
            Coming Soon
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Image{' '}
            <span
              className="text-[#D4AF37]"
              style={{ textShadow: '0 0 30px rgba(212,175,55,0.35)' }}
            >
              to Map
            </span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
            Drop a photo or sketch and watch it become a full Roblox map.
            No prompts. No manual placing. Just upload.
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {FEATURES.map((feat) => {
          const Icon = feat.icon
          return (
            <div
              key={feat.title}
              className="group rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.18)',
                }}
              >
                <Icon className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-white font-semibold text-sm mb-1">{feat.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <a
          href="mailto:hello@forjegames.com?subject=Image%20to%20Map%20Waitlist"
          className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-[#050810] transition-all hover:scale-[1.03] active:scale-100"
          style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)' }}
        >
          <Wand2 className="w-4 h-4" />
          Join Waitlist
        </a>
      </div>
    </div>
  )
}
