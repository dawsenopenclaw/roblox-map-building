'use client'

import React from 'react'

interface Orb {
  size: number
  left: string
  top: string
  color: string
  duration: number
  delay: number
  blur: number
  opacity: number
  xRange: number
  yRange: number
}

const ORBS: Orb[] = [
  { size: 320, left: '10%',  top: '15%',  color: 'rgba(212,175,55,0.06)',  duration: 28, delay: 0,    blur: 80,  opacity: 1, xRange: 30, yRange: 40 },
  { size: 420, left: '75%',  top: '10%',  color: 'rgba(99,60,180,0.07)',   duration: 36, delay: 5,    blur: 100, opacity: 1, xRange: 40, yRange: 25 },
  { size: 260, left: '55%',  top: '60%',  color: 'rgba(59,130,246,0.06)',  duration: 22, delay: 2,    blur: 70,  opacity: 1, xRange: 20, yRange: 35 },
  { size: 180, left: '30%',  top: '70%',  color: 'rgba(212,175,55,0.05)',  duration: 32, delay: 8,    blur: 60,  opacity: 1, xRange: 35, yRange: 20 },
  { size: 500, left: '85%',  top: '50%',  color: 'rgba(139,92,246,0.05)',  duration: 40, delay: 12,   blur: 120, opacity: 1, xRange: 15, yRange: 30 },
  { size: 140, left: '5%',   top: '45%',  color: 'rgba(251,191,36,0.07)',  duration: 18, delay: 3,    blur: 50,  opacity: 1, xRange: 25, yRange: 45 },
  { size: 380, left: '45%',  top: '85%',  color: 'rgba(79,70,229,0.06)',   duration: 34, delay: 16,   blur: 90,  opacity: 1, xRange: 30, yRange: 15 },
  { size: 220, left: '20%',  top: '30%',  color: 'rgba(212,175,55,0.04)',  duration: 26, delay: 7,    blur: 65,  opacity: 1, xRange: 45, yRange: 30 },
  { size: 160, left: '65%',  top: '25%',  color: 'rgba(147,197,253,0.05)', duration: 20, delay: 1,    blur: 55,  opacity: 1, xRange: 20, yRange: 40 },
  { size: 280, left: '90%',  top: '80%',  color: 'rgba(167,139,250,0.06)', duration: 30, delay: 10,   blur: 75,  opacity: 1, xRange: 10, yRange: 20 },
  { size: 100, left: '40%',  top: '5%',   color: 'rgba(255,184,28,0.08)',  duration: 16, delay: 4,    blur: 40,  opacity: 1, xRange: 35, yRange: 25 },
  { size: 340, left: '15%',  top: '80%',  color: 'rgba(59,130,246,0.05)',  duration: 38, delay: 14,   blur: 85,  opacity: 1, xRange: 25, yRange: 35 },
  { size: 200, left: '70%',  top: '40%',  color: 'rgba(212,175,55,0.05)',  duration: 24, delay: 6,    blur: 60,  opacity: 1, xRange: 40, yRange: 20 },
  { size: 460, left: '50%',  top: '30%',  color: 'rgba(88,28,220,0.04)',   duration: 42, delay: 18,   blur: 110, opacity: 1, xRange: 20, yRange: 30 },
  { size: 120, left: '25%',  top: '55%',  color: 'rgba(251,191,36,0.06)',  duration: 19, delay: 9,    blur: 45,  opacity: 1, xRange: 30, yRange: 45 },
]

// Tiny star dots — more stars, wider twinkle amplitude
const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  left: `${Math.round(((i * 127 + 31) % 100))}%`,
  top: `${Math.round(((i * 83 + 17) % 100))}%`,
  size: i % 7 === 0 ? 2.5 : i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  opacity: 0.15 + (i % 7) * 0.09,
  // stagger across 5 different durations for a more organic feel
  duration: 2 + (i % 5) * 0.9,
  delay: (i * 0.31) % 7,
}))

export function SpaceBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 20% 20%, #0a0520 0%, #050510 40%, #02020d 100%)',
      }}
    >
      {/* Nebula sweeps — deeper, more saturated sci-fi colors */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 90% 55% at 70% 25%, rgba(79,44,200,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 65% 45% at 18% 68%, rgba(6,182,212,0.09) 0%, transparent 55%),
            radial-gradient(ellipse 55% 65% at 88% 78%, rgba(139,92,246,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 50% 10%, rgba(212,175,55,0.05) 0%, transparent 45%)
          `,
          animation: 'nebulaDrift 60s ease-in-out infinite alternate',
        }}
      />
      {/* Second nebula layer — offset drift for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 50% 40% at 30% 40%, rgba(56,189,248,0.06) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 60% 80%, rgba(167,139,250,0.07) 0%, transparent 55%)
          `,
          animation: 'nebulaDrift2 45s ease-in-out infinite alternate',
        }}
      />

      {/* Star field */}
      {STARS.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'white',
            opacity: star.opacity,
            animation: `starTwinkle ${star.duration}s ease-in-out ${star.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* Floating orbs */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
            opacity: orb.opacity,
            animation: `floatOrb${i % 4} ${orb.duration}s ease-in-out ${orb.delay}s infinite alternate`,
            transform: 'translate(-50%, -50%)',
            willChange: 'transform',
          }}
        />
      ))}

      <style>{`
        @keyframes starTwinkle {
          0%   { opacity: 0.05; transform: scale(0.85); }
          50%  { opacity: 0.7; transform: scale(1.2); }
          100% { opacity: 0.15; transform: scale(1); }
        }
        @keyframes floatOrb0 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          100% { transform: translate(-50%, -50%) translate(30px, -40px); }
        }
        @keyframes floatOrb1 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          100% { transform: translate(-50%, -50%) translate(-40px, 25px); }
        }
        @keyframes floatOrb2 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          100% { transform: translate(-50%, -50%) translate(20px, 35px); }
        }
        @keyframes floatOrb3 {
          0%   { transform: translate(-50%, -50%) translate(0px, 0px); }
          100% { transform: translate(-50%, -50%) translate(-25px, -30px); }
        }
        @keyframes nebulaDrift {
          0%   { transform: scale(1) translate(0px, 0px); }
          100% { transform: scale(1.06) translate(-12px, 8px); }
        }
        @keyframes nebulaDrift2 {
          0%   { transform: scale(1) translate(0px, 0px); }
          100% { transform: scale(1.04) translate(10px, -6px); }
        }
      `}</style>
    </div>
  )
}
