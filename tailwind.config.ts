import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // darkMode: 'class' removed — site is always dark via CSS variables (no dark: classes used)
  theme: {
    extend: {
      colors: {
        /* ── Core backgrounds — black + cool grey ── */
        background:        '#0a0a0a',   // near-black
        surface:           '#141414',   // very dark grey
        'surface-2':       '#1c1c1c',   // slightly lighter
        'surface-elevated':'#252525',   // elevated panels

        /* ── Borders ── */
        border:            '#2a2a2a',   // subtle grey
        'border-subtle':   '#3a3a3a',   // focus/hover

        /* ── Gold accent ── */
        gold:              '#D4AF37',
        'gold-light':      '#FFB81C',

        /* ── Semantic ── */
        success:           '#10B981',
        error:             '#EF4444',
        warning:           '#F59E0B',
        info:              '#3B82F6',

        /* ── Text ── */
        foreground:        'var(--foreground)',
        muted:             'var(--muted)',
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
        'card-gradient':     'linear-gradient(135deg, rgba(46,46,46,0.9) 0%, rgba(36,36,36,0.9) 100%)',
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
