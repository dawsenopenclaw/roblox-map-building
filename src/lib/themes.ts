/**
 * ForjeGames Theme System
 * Each theme defines CSS variable overrides applied to :root.
 * All themes are dark — only colors/vibes change.
 */

export interface Theme {
  id: string
  name: string
  description: string
  category: 'minimal' | 'vibrant' | 'aesthetic'
  preview: {
    bg: string
    accent: string
    surface: string
  }
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  // ─── Minimal ───────────────────────────────────────────────────────────────
  {
    id: 'default',
    name: 'Forge Gold',
    description: 'The classic ForjeGames look — deep space with gold accents',
    category: 'minimal',
    preview: { bg: '#050810', accent: '#FFB81C', surface: '#0A0F20' },
    vars: {
      '--background': '#050810',
      '--surface': '#0A0F20',
      '--surface-2': '#0E1428',
      '--surface-elevated': '#121832',
      '--gold': '#FFB81C',
      '--gold-light': '#FFD166',
      '--gold-glow': 'rgba(255,184,28,0.15)',
      '--accent': '#FFB81C',
      '--royal': '#7C3AED',
      '--royal-light': '#A78BFA',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Pure black with cool gray — minimal and clean',
    category: 'minimal',
    preview: { bg: '#000000', accent: '#E4E4E7', surface: '#0A0A0A' },
    vars: {
      '--background': '#000000',
      '--surface': '#0A0A0A',
      '--surface-2': '#141414',
      '--surface-elevated': '#1A1A1A',
      '--gold': '#E4E4E7',
      '--gold-light': '#FAFAFA',
      '--gold-glow': 'rgba(228,228,231,0.1)',
      '--accent': '#E4E4E7',
      '--royal': '#71717A',
      '--royal-light': '#A1A1AA',
    },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Warm grays with amber highlights — easy on the eyes',
    category: 'minimal',
    preview: { bg: '#0C0A09', accent: '#F59E0B', surface: '#1C1917' },
    vars: {
      '--background': '#0C0A09',
      '--surface': '#1C1917',
      '--surface-2': '#292524',
      '--surface-elevated': '#44403C',
      '--gold': '#F59E0B',
      '--gold-light': '#FCD34D',
      '--gold-glow': 'rgba(245,158,11,0.15)',
      '--accent': '#F59E0B',
      '--royal': '#92400E',
      '--royal-light': '#D97706',
    },
  },

  // ─── Vibrant ───────────────────────────────────────────────────────────────
  {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Navy depths with electric cyan — energetic and bold',
    category: 'vibrant',
    preview: { bg: '#020617', accent: '#22D3EE', surface: '#0F172A' },
    vars: {
      '--background': '#020617',
      '--surface': '#0F172A',
      '--surface-2': '#1E293B',
      '--surface-elevated': '#334155',
      '--gold': '#22D3EE',
      '--gold-light': '#67E8F9',
      '--gold-glow': 'rgba(34,211,238,0.15)',
      '--accent': '#22D3EE',
      '--royal': '#0EA5E9',
      '--royal-light': '#38BDF8',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Dark charcoal with fiery red-orange — intense and powerful',
    category: 'vibrant',
    preview: { bg: '#0A0A0A', accent: '#EF4444', surface: '#171717' },
    vars: {
      '--background': '#0A0A0A',
      '--surface': '#171717',
      '--surface-2': '#262626',
      '--surface-elevated': '#404040',
      '--gold': '#EF4444',
      '--gold-light': '#F87171',
      '--gold-glow': 'rgba(239,68,68,0.15)',
      '--accent': '#EF4444',
      '--royal': '#DC2626',
      '--royal-light': '#F87171',
    },
  },
  {
    id: 'neon',
    name: 'Neon Matrix',
    description: 'Black void with electric green — hacker vibes',
    category: 'vibrant',
    preview: { bg: '#030712', accent: '#22C55E', surface: '#0F1117' },
    vars: {
      '--background': '#030712',
      '--surface': '#0F1117',
      '--surface-2': '#1A1F2E',
      '--surface-elevated': '#252B3B',
      '--gold': '#22C55E',
      '--gold-light': '#4ADE80',
      '--gold-glow': 'rgba(34,197,94,0.15)',
      '--accent': '#22C55E',
      '--royal': '#16A34A',
      '--royal-light': '#4ADE80',
    },
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    description: 'Deep purple cosmos with violet glow — dreamy and immersive',
    category: 'vibrant',
    preview: { bg: '#09050F', accent: '#A855F7', surface: '#13082A' },
    vars: {
      '--background': '#09050F',
      '--surface': '#13082A',
      '--surface-2': '#1E1038',
      '--surface-elevated': '#2A1850',
      '--gold': '#A855F7',
      '--gold-light': '#C084FC',
      '--gold-glow': 'rgba(168,85,247,0.15)',
      '--accent': '#A855F7',
      '--royal': '#7C3AED',
      '--royal-light': '#A78BFA',
    },
  },

  // ─── Aesthetic ──────────────────────────────────────────────────────────────
  {
    id: 'rose',
    name: 'Rosegold',
    description: 'Soft charcoal with warm rosegold — elegant and refined',
    category: 'aesthetic',
    preview: { bg: '#0D0B0E', accent: '#F472B6', surface: '#1A1520' },
    vars: {
      '--background': '#0D0B0E',
      '--surface': '#1A1520',
      '--surface-2': '#261E2C',
      '--surface-elevated': '#352838',
      '--gold': '#F472B6',
      '--gold-light': '#F9A8D4',
      '--gold-glow': 'rgba(244,114,182,0.15)',
      '--accent': '#F472B6',
      '--royal': '#DB2777',
      '--royal-light': '#F472B6',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool blue-gray with icy white — crisp and professional',
    category: 'aesthetic',
    preview: { bg: '#0B1120', accent: '#93C5FD', surface: '#111B2E' },
    vars: {
      '--background': '#0B1120',
      '--surface': '#111B2E',
      '--surface-2': '#172540',
      '--surface-elevated': '#1E3050',
      '--gold': '#93C5FD',
      '--gold-light': '#BFDBFE',
      '--gold-glow': 'rgba(147,197,253,0.15)',
      '--accent': '#93C5FD',
      '--royal': '#3B82F6',
      '--royal-light': '#60A5FA',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm dark with orange gradient feel — cozy evening vibes',
    category: 'aesthetic',
    preview: { bg: '#0F0A07', accent: '#FB923C', surface: '#1A1208' },
    vars: {
      '--background': '#0F0A07',
      '--surface': '#1A1208',
      '--surface-2': '#261D10',
      '--surface-elevated': '#352A18',
      '--gold': '#FB923C',
      '--gold-light': '#FDBA74',
      '--gold-glow': 'rgba(251,146,60,0.15)',
      '--accent': '#FB923C',
      '--royal': '#EA580C',
      '--royal-light': '#FB923C',
    },
  },
]

export const THEME_MAP = new Map(THEMES.map((t) => [t.id, t]))

export function getThemeById(id: string): Theme {
  return THEME_MAP.get(id) ?? THEMES[0]
}
