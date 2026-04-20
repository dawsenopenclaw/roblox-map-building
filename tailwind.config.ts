import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // darkMode: 'class' removed — site is always dark via CSS variables (no dark: classes used)
  theme: {
    extend: {
      colors: {
        /* ── Core backgrounds ── */
        background:        '#050810',
        surface:           '#0A0F20',
        'surface-2':       '#0E1428',
        'surface-elevated':'#121832',

        /* ── Borders ── */
        border:            'rgba(255,255,255,0.06)',
        'border-subtle':   'rgba(255,255,255,0.04)',

        /* ── Gold accent ── */
        gold:              '#D4AF37',
        'gold-light':      '#E4C04A',

        /* ── Semantic ── */
        success:           '#22C55E',
        error:             '#EF4444',
        warning:           '#F59E0B',
        info:              '#60A5FA',

        /* ── Text ── */
        foreground:        '#FAFAFA',
        muted:             '#A1A1AA',
        'muted-subtle':    '#71717A',

        /* ── Legacy alias (keep for existing component compat) ── */
        accent:            '#D4AF37',
        'accent-hover':    '#E4C04A',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
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
        /* Depth layer scale — mirrors CSS vars in globals.css */
        'depth-xs': '0 1px 2px rgba(0,0,0,0.3)',
        'depth-sm': '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)',
        'depth-md': '0 4px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
        'depth-lg': '0 8px 32px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
        'depth-xl': '0 16px 64px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)',
        'depth-gold': '0 0 20px rgba(212,175,55,0.15), 0 4px 16px rgba(0,0,0,0.4)',
        'inner':    'inset 0 1px 2px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        'xl':   '12px',
        '2xl':  '16px',
        '3xl':  '24px',
      },
      // keyframes + animation tokens intentionally omitted here.
      // gold-pulse, fade-in, shimmer are defined in globals.css alongside
      // their .animate-* utility classes — single source of truth.
    },
  },
  plugins: [],
}

export default config
