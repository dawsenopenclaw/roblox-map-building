/**
 * ForjeLogo — Reusable logo components for site-wide consistency.
 *
 * Wordmark: "ForjeGames" italic bold — gold "Forje" + white "Games"
 * ImageLogo: New brand logo PNG from /logo.png
 * Icon: "FG" compact mark for favicons, small spaces
 * Loading: Wordmark with left-to-right reveal animation
 */

import React from 'react'
import Image from 'next/image'

// ─── Shared style ────────────────────────────────────────────────────────────

const GOLD = '#D4AF37'

const baseStyle: React.CSSProperties = {
  fontWeight: 800,
  fontStyle: 'italic',
  letterSpacing: '-0.02em',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'baseline',
}

// ─── Image Logo ──────────────────────────────────────────────────────────────

interface ForjeImageLogoProps {
  /** Height in pixels — width auto-calculated from aspect ratio */
  height?: number
  /** Additional className */
  className?: string
}

/** Brand logo image — use where image logos are preferred over text wordmark */
export function ForjeImageLogo({ height = 32, className }: ForjeImageLogoProps) {
  // Original image is 1536x1024 → aspect ratio 1.5:1
  const width = Math.round(height * 1.5)
  return (
    <Image
      src="/logo.png"
      alt="ForjeGames"
      width={width}
      height={height}
      className={className}
      priority
      style={{ objectFit: 'contain' }}
    />
  )
}

// ─── Wordmark ────────────────────────────────────────────────────────────────

interface ForjeLogoProps {
  /** Font size in pixels — default 20 */
  size?: number
  /** Additional className */
  className?: string
  /** Additional inline style */
  style?: React.CSSProperties
  /** Use image logo instead of text wordmark */
  useImage?: boolean
}

export function ForjeLogo({ size = 20, className, style, useImage }: ForjeLogoProps) {
  if (useImage) {
    return <ForjeImageLogo height={size} className={className} />
  }

  return (
    <span
      className={className}
      style={{
        ...baseStyle,
        fontSize: size,
        ...style,
      }}
      aria-label="ForjeGames"
    >
      <span style={{ color: GOLD }}>Forje</span>
      <span style={{ color: '#FFFFFF' }}>Games</span>
    </span>
  )
}

// ─── Loading Wordmark — left-to-right reveal ─────────────────────────────────

interface ForjeLoadingLogoProps {
  /** Font size in pixels — default 32 */
  size?: number
  /** Animation duration in seconds — default 1.2 */
  duration?: number
}

export function ForjeLoadingLogo({ size = 32, duration = 1.2 }: ForjeLoadingLogoProps) {
  const letters = [
    { char: 'F', color: GOLD },
    { char: 'o', color: GOLD },
    { char: 'r', color: GOLD },
    { char: 'j', color: GOLD },
    { char: 'e', color: GOLD },
    { char: 'G', color: '#FFFFFF' },
    { char: 'a', color: '#FFFFFF' },
    { char: 'm', color: '#FFFFFF' },
    { char: 'e', color: '#FFFFFF' },
    { char: 's', color: '#FFFFFF' },
  ]

  const delayPerLetter = duration / letters.length

  return (
    <>
      <span
        style={{
          ...baseStyle,
          fontSize: size,
        }}
        aria-label="ForjeGames loading"
      >
        {letters.map((l, i) => (
          <span
            key={i}
            className="forje-loading-letter"
            style={{
              color: l.color,
              opacity: 0,
              display: 'inline-block',
              animation: `forjeLetterReveal 0.4s ease-out ${i * delayPerLetter}s forwards`,
            }}
          >
            {l.char}
          </span>
        ))}
      </span>
      <style>{`
        @keyframes forjeLetterReveal {
          0% {
            opacity: 0;
            transform: translateX(-8px) scale(0.9);
            filter: blur(4px);
          }
          60% {
            opacity: 1;
            transform: translateX(2px) scale(1.02);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0px);
          }
        }
      `}</style>
    </>
  )
}

// ─── Full Loading Screen ─────────────────────────────────────────────────────

export function ForjeLoadingScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
      style={{ background: 'transparent' }}
    >
      {/* Glow behind logo */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute"
          style={{
            width: 200,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.12) 0%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'forjeGlowPulse 2s ease-in-out infinite',
          }}
        />
        <ForjeLoadingLogo size={36} />
      </div>

      {/* Animated loading bar */}
      <div
        style={{
          width: 120,
          height: 2,
          borderRadius: 1,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            borderRadius: 1,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            animation: 'forjeBarSlide 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes forjeGlowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes forjeBarSlide {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
