'use client'

import React from 'react'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  /** Animation duration in seconds. Default 3. */
  duration?: number
  /** HTML element. Default 'span'. */
  as?: React.ElementType
}

/**
 * Text with an animated gold gradient that shimmers left-to-right.
 * Respects prefers-reduced-motion by rendering a static gradient.
 */
export function GradientText({
  children,
  className = '',
  duration = 3,
  as: Tag = 'span',
}: GradientTextProps) {
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  return (
    <>
      <Tag
        className={`inline-block bg-clip-text text-transparent ${className}`}
        style={{
          backgroundImage: prefersReduced
            ? 'linear-gradient(90deg, #FFB81C 0%, #FFD700 50%, #FFB81C 100%)'
            : 'linear-gradient(90deg, #FFB81C 0%, #FFD700 25%, #FFFACD 50%, #FFD700 75%, #FFB81C 100%)',
          backgroundSize: prefersReduced ? '100% 100%' : '300% 100%',
          animation: prefersReduced ? 'none' : `gradient-shimmer ${duration}s linear infinite`,
        }}
      >
        {children}
      </Tag>
      {!prefersReduced && (
        <style>{`
          @keyframes gradient-shimmer {
            0%   { background-position: 100% 50%; }
            100% { background-position: -100% 50%; }
          }
        `}</style>
      )}
    </>
  )
}
