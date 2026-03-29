import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Core backgrounds ── */
        background:        '#030712',   // gray-950
        surface:           '#111827',   // gray-900
        'surface-2':       '#1a2236',   // card variant
        'surface-elevated':'#1f2937',   // gray-800

        /* ── Borders ── */
        border:            '#1f2937',   // gray-800
        'border-subtle':   '#374151',   // gray-700

        /* ── Gold accent ── */
        gold:              '#D4AF37',
        'gold-light':      '#FFB81C',

        /* ── Semantic ── */
        success:           '#10B981',
        error:             '#EF4444',
        warning:           '#F59E0B',
        info:              '#3B82F6',

        /* ── Text ── */
        foreground:        '#F9FAFB',
        muted:             '#9CA3AF',
        'muted-subtle':    '#6B7280',

        /* ── Legacy aliases (keep for existing component compat) ── */
        accent:            '#FFB81C',
        'accent-hover':    '#D4AF37',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        /* Utility gradients */
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-shimmer':      'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
        'hero-glow':         'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 70%)',
        'card-gradient':     'linear-gradient(135deg, rgba(26,34,54,0.9) 0%, rgba(17,24,39,0.9) 100%)',
      },
      boxShadow: {
        'gold-sm':  '0 0 10px rgba(212,175,55,0.15)',
        'gold':     '0 0 20px rgba(212,175,55,0.30), 0 0 40px rgba(212,175,55,0.15)',
        'gold-lg':  '0 0 40px rgba(212,175,55,0.30), 0 0 80px rgba(212,175,55,0.15)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'card-lg':  '0 8px 48px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        'xl':   '12px',
        '2xl':  '16px',
        '3xl':  '24px',
      },
      keyframes: {
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(212,175,55,0.15)' },
          '50%':       { boxShadow: '0 0 24px rgba(212,175,55,0.40)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'gold-pulse': 'gold-pulse 2s ease-in-out infinite',
        'fade-in':    'fade-in 0.3s ease forwards',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
