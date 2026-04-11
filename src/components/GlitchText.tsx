/**
 * ForgeGames Glitch Text — 5 variants + loading state
 * Pure CSS animations, GPU-accelerated, respects prefers-reduced-motion.
 * Source: integrated from C:\Users\Dawse\GlitchText.tsx on 2026-04-10.
 * Import the accompanying CSS once globally (e.g. in src/app/globals.css):
 *   @import '../styles/forgegames-glitch-text.css';
 */
'use client';

import React, { useState, useEffect } from 'react';

export interface GlitchTextProps {
  text: string;
  variant?: 'default' | 'blue-accent' | 'gold-accent' | 'chromatic' | 'loading' | 'scanlines';
  size?: 'small' | 'medium' | 'large' | 'hero';
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  showScanlines?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
}

export function GlitchText({
  text,
  variant = 'default',
  size = 'large',
  className = '',
  intensity = 'medium',
  showScanlines = false,
  as: Tag = 'h1',
}: GlitchTextProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const baseClasses = {
    small: 'glitch-small',
    medium: 'glitch-medium',
    large: 'glitch-large',
    hero: 'glitch-hero',
  } as const;

  const variantClasses = {
    default: 'glitch-text-premium',
    'blue-accent': 'glitch-text-premium glitch-blue-accent',
    'gold-accent': 'glitch-text-premium glitch-gold-accent',
    chromatic: 'glitch-chromatic',
    loading: 'glitch-loading',
    scanlines: `glitch-text-premium with-scanlines${showScanlines ? ' scanline-overlay' : ''}`,
  } as const;

  const intensityClasses = {
    low: 'opacity-80',
    medium: 'opacity-100',
    high: 'opacity-100',
  } as const;

  if (!isMounted) {
    return <Tag className={`${baseClasses[size]} ${className}`}>{text}</Tag>;
  }

  const classes = `${baseClasses[size]} ${variantClasses[variant]} ${intensityClasses[intensity]} ${className}`.trim();

  return (
    <Tag className={classes} data-text={text}>
      {text}
    </Tag>
  );
}

export default GlitchText;
