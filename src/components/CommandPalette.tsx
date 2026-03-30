'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Platform key label (⌘ on Mac, Ctrl elsewhere)
// ---------------------------------------------------------------------------

function useModKey() {
  const [mod, setMod] = useState('Ctrl')
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      setMod('⌘')
    }
  }, [])
  return mod
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommandGroup = 'Navigation' | 'Actions' | 'AI' | 'Recent' | 'Recent Builds' | 'Help'

interface CommandItem {
  id: string
  group: CommandGroup
  label: string
  description?: string
  icon: string
  shortcut?: string
  action: () => void
}

// ---------------------------------------------------------------------------
// Fuzzy search helpers
// ---------------------------------------------------------------------------

function fuzzyMatch(needle: string, haystack: string): boolean {
  if (!needle) return true
  const n = needle.toLowerCase()
  const h = haystack.toLowerCase()
  let ni = 0
  for (let hi = 0; hi < h.length && ni < n.length; hi++) {
    if (h[hi] === n[ni]) ni++
  }
  return ni === n.length
}

function fuzzyScore(needle: string, haystack: string): number {
  if (!needle) return 0
  const n = needle.toLowerCase()
  const h = haystack.toLowerCase()
  if (h === n) return 4
  if (h.startsWith(n)) return 3
  if (h.includes(n)) return 2
  return 1
}

// ---------------------------------------------------------------------------
// Key badge
// ---------------------------------------------------------------------------

function KeyBadge({ keys }: { keys: string }) {
  return (
    <span className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
      {keys.split('+').map((k, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded bg-white/10 border border-white/20 text-[10px] text-[#D4AF37] font-mono"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Group accent colours
// ---------------------------------------------------------------------------

const GROUP_ACCENT: Record<CommandGroup, string> = {
  Recent:           'text-[#D4AF37]',
  'Recent Builds':  'text-[#D4AF37]',
  Navigation:       'text-blue-400',
  Actions:          'text-emerald-400',
  AI:               'text-purple-400',
  Help:             'text-gray-500',
}

const GROUP_ICON_BG: Record<CommandGroup, string> = {
  Recent:           'bg-[#D4AF37]/15',
  'Recent Builds':  'bg-[#D4AF37]/10',
  Navigation:       'bg-blue-500/10',
  Actions:          'bg-emerald-500/10',
  AI:               'bg-purple-500/10',
  Help:             'bg-white/5',
}

// ---------------------------------------------------------------------------
// Recent command tracking — localStorage-backed, survives page reloads
// ---------------------------------------------------------------------------

const MAX_RECENT = 5
const LS_KEY = 'cmd_palette_recent_v1'
const LS_BUILDS_KEY = 'cmd_palette_recent_builds_v1'

function loadRecentIds(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') } catch { return [] }
}

function trackRecent(id: string) {
  const ids = loadRecentIds().filter((x) => x !== id)
  const next = [id, ...ids].slice(0, MAX_RECENT)
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* noop */ }
}

// Recent builds — stored as { id, label, description, href }
export interface RecentBuildEntry { id: string; label: string; description: string; href: string }

function loadRecentBuilds(): RecentBuildEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LS_BUILDS_KEY) ?? '[]') } catch { return [] }
}

/** Call from the editor whenever a new build session is created. */
export function trackRecentBuild(entry: RecentBuildEntry) {
  const builds = loadRecentBuilds().filter((b) => b.id !== entry.id)
  const next = [entry, ...builds].slice(0, 5)
  try { localStorage.setItem(LS_BUILDS_KEY, JSON.stringify(next)) } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNewProject?: () => void
  onShowShortcuts?: () => void
  onToggleSidebar?: () => void
}

const GROUP_ORDER: CommandGroup[] = ['Recent', 'Recent Builds', 'Navigation', 'Actions', 'AI', 'Help']

// ---------------------------------------------------------------------------
// CommandPalette
// ---------------------------------------------------------------------------

export function CommandPalette({
  isOpen,
  onClose,
  onNewProject,
  onShowShortcuts,
  onToggleSidebar,
}: CommandPaletteProps) {
  const router = useRouter()
  const mod = useModKey()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [recentBuilds, setRecentBuilds] = useState<RecentBuildEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Load recents from localStorage when palette opens
  useEffect(() => {
    if (isOpen) {
      setRecentIds(loadRecentIds())
      setRecentBuilds(loadRecentBuilds())
    }
  }, [isOpen])

  // Focus trap — keep focus inside the dialog while open, cycle on Tab, close on Escape
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return

    // Restore focus to whatever triggered the dialog when it closes
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

    // Auto-focus the first focusable element (the search input)
    focusable()[0]?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = focusable()
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', handler)
    return () => {
      dialog.removeEventListener('keydown', handler)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  const navigate = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  const wrap = useCallback(
    (id: string, fn: () => void) =>
      () => {
        trackRecent(id)
        setRecentIds(loadRecentIds())
        fn()
      },
    [],
  )

  // Build full command list
  const allCommands: CommandItem[] = [
    // ── Navigation ────────────────────────────────────────────────────────
    {
      id: 'nav-dashboard',
      group: 'Navigation',
      label: 'Dashboard',
      description: 'Your projects overview',
      icon: '⬡',
      shortcut: 'G+D',
      action: wrap('nav-dashboard', () => navigate('/dashboard')),
    },
    {
      id: 'nav-editor',
      group: 'Navigation',
      label: 'Editor',
      description: 'AI build editor',
      icon: '✦',
      shortcut: 'G+E',
      action: wrap('nav-editor', () => navigate('/editor')),
    },
    {
      id: 'nav-marketplace',
      group: 'Navigation',
      label: 'Marketplace',
      description: 'Browse asset templates',
      icon: '◈',
      shortcut: 'G+M',
      action: wrap('nav-marketplace', () => navigate('/marketplace')),
    },
    {
      id: 'nav-game-dna',
      group: 'Navigation',
      label: 'Game DNA',
      description: 'Analyze competitor games',
      icon: '◉',
      shortcut: 'G+X',
      action: wrap('nav-game-dna', () => navigate('/game-dna')),
    },
    {
      id: 'nav-image-to-map',
      group: 'Navigation',
      label: 'Image to Map',
      description: 'Convert a photo or sketch to terrain',
      icon: '◫',
      shortcut: 'G+I',
      action: wrap('nav-image-to-map', () => navigate('/image-to-map')),
    },
    {
      id: 'nav-settings',
      group: 'Navigation',
      label: 'Settings',
      description: 'Account & preferences',
      icon: '◎',
      shortcut: 'G+S',
      action: wrap('nav-settings', () => navigate('/settings')),
    },
    {
      id: 'nav-billing',
      group: 'Navigation',
      label: 'Billing',
      description: 'Manage your plan & invoices',
      icon: '◇',
      shortcut: 'G+B',
      action: wrap('nav-billing', () => navigate('/billing')),
    },
    {
      id: 'nav-team',
      group: 'Navigation',
      label: 'Team',
      description: 'Manage team members & permissions',
      icon: '◭',
      action: wrap('nav-team', () => navigate('/team')),
    },
    {
      id: 'nav-earnings',
      group: 'Navigation',
      label: 'Earnings',
      description: 'Revenue & payout history',
      icon: '◐',
      action: wrap('nav-earnings', () => navigate('/earnings')),
    },
    {
      id: 'nav-referrals',
      group: 'Navigation',
      label: 'Referrals',
      description: 'Share & earn credits',
      icon: '◑',
      action: wrap('nav-referrals', () => navigate('/referrals')),
    },
    {
      id: 'nav-tokens',
      group: 'Navigation',
      label: 'Tokens',
      description: 'Buy & manage AI tokens',
      icon: '◍',
      action: wrap('nav-tokens', () => navigate('/tokens')),
    },
    {
      id: 'nav-achievements',
      group: 'Navigation',
      label: 'Achievements',
      description: 'Your XP, badges & tier progress',
      icon: '◆',
      action: wrap('nav-achievements', () => navigate('/achievements')),
    },
    // ── Actions ───────────────────────────────────────────────────────────
    {
      id: 'action-new-build',
      group: 'Actions',
      label: 'New Build',
      description: 'Start a new AI build session',
      icon: '⊕',
      shortcut: mod + '+N',
      action: wrap('action-new-build', () => {
        onClose()
        onNewProject?.()
      }),
    },
    {
      id: 'action-toggle-sidebar',
      group: 'Actions',
      label: 'Toggle Sidebar',
      description: 'Show or hide the navigation sidebar',
      icon: '⊟',
      shortcut: mod + '+B',
      action: wrap('action-toggle-sidebar', () => {
        onClose()
        onToggleSidebar?.()
      }),
    },
    {
      id: 'action-upload-image',
      group: 'Actions',
      label: 'Upload Image',
      description: 'Upload a sketch or photo to convert',
      icon: '⊡',
      action: wrap('action-upload-image', () => navigate('/image-to-map?upload=1')),
    },
    {
      id: 'action-toggle-voice',
      group: 'Actions',
      label: 'Toggle Voice',
      description: 'Start or stop voice build mode',
      icon: '⊗',
      shortcut: mod + '+Shift+V',
      action: wrap('action-toggle-voice', () => navigate('/voice')),
    },
    {
      id: 'action-toggle-dark',
      group: 'Actions',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark theme',
      icon: '◑',
      shortcut: mod + '+Shift+D',
      action: wrap('action-toggle-dark', () => {
        document.documentElement.classList.toggle('dark')
        onClose()
      }),
    },
    {
      id: 'action-shortcuts',
      group: 'Actions',
      label: 'View Shortcuts',
      description: 'All keyboard shortcuts at a glance',
      icon: '⊞',
      shortcut: mod + '+/',
      action: wrap('action-shortcuts', () => {
        onClose()
        onShowShortcuts?.()
      }),
    },
    {
      id: 'action-signout',
      group: 'Actions',
      label: 'Sign Out',
      description: 'Log out of your account',
      icon: '⊠',
      action: wrap('action-signout', () => navigate('/sign-out')),
    },
    // ── AI ────────────────────────────────────────────────────────────────
    {
      id: 'ai-castle',
      group: 'AI',
      label: 'Generate Castle',
      description: 'AI-build a medieval castle map',
      icon: '⬙',
      action: wrap('ai-castle', () => navigate('/editor?prompt=generate+castle')),
    },
    {
      id: 'ai-city',
      group: 'AI',
      label: 'Generate City',
      description: 'Build a full city district with AI',
      icon: '⬘',
      action: wrap('ai-city', () => navigate('/editor?prompt=generate+city')),
    },
    {
      id: 'ai-forest',
      group: 'AI',
      label: 'Generate Forest',
      description: 'AI-build a dense forest biome',
      icon: '⬗',
      action: wrap('ai-forest', () => navigate('/editor?prompt=generate+forest')),
    },
    {
      id: 'ai-analyze',
      group: 'AI',
      label: 'Analyze Game',
      description: 'Run Game DNA scanner on a Roblox URL',
      icon: '◉',
      action: wrap('ai-analyze', () => navigate('/game-dna?mode=analyze')),
    },
    {
      id: 'ai-3d-model',
      group: 'AI',
      label: 'Generate 3D Model',
      description: 'Text-to-3D via Meshy pipeline',
      icon: '⬖',
      action: wrap('ai-3d-model', () => navigate('/editor?prompt=generate+3d+model')),
    },
    // ── Help ──────────────────────────────────────────────────────────────
    {
      id: 'help-docs',
      group: 'Help',
      label: 'Documentation',
      description: 'Open the full docs site',
      icon: '◻',
      action: wrap('help-docs', () => window.open('https://docs.forgegames.com', '_blank')),
    },
    {
      id: 'help-bug',
      group: 'Help',
      label: 'Report Bug',
      description: 'Submit a bug or feedback report',
      icon: '◦',
      action: wrap('help-bug', () => window.open('https://github.com/ForjeGames/bugs/issues/new', '_blank')),
    },
    {
      id: 'help-discord',
      group: 'Help',
      label: 'Discord',
      description: 'Join the community server',
      icon: '◈',
      action: wrap('help-discord', () => window.open('https://discord.gg/forgegames', '_blank')),
    },
    {
      id: 'help-pricing',
      group: 'Help',
      label: 'Pricing',
      description: 'Compare plans and features',
      icon: '◇',
      action: wrap('help-pricing', () => window.open('https://forgegames.com/pricing', '_blank')),
    },
  ]

  // Build the Recent group from localStorage-backed state
  const recentCommands: CommandItem[] = recentIds
    .map((id) => allCommands.find((c) => c.id === id))
    .filter((c): c is CommandItem => Boolean(c))
    .map((c) => ({ ...c, group: 'Recent' as CommandGroup }))

  // Build the Recent Builds group from localStorage
  const recentBuildCommands: CommandItem[] = recentBuilds.map((b) => ({
    id: `recent-build-${b.id}`,
    group: 'Recent Builds' as CommandGroup,
    label: b.label,
    description: b.description,
    icon: '◈',
    action: () => {
      onClose()
      router.push(b.href)
    },
  }))

  const fullList = [...recentCommands, ...recentBuildCommands, ...allCommands]

  // Filter by query — when searching exclude the duplicated Recent entries
  const filtered = query
    ? allCommands
        .filter(
          (c) =>
            fuzzyMatch(query, c.label) ||
            fuzzyMatch(query, c.description ?? '') ||
            fuzzyMatch(query, c.group),
        )
        .sort(
          (a, b) =>
            fuzzyScore(query, b.label) +
            fuzzyScore(query, b.description ?? '') -
            (fuzzyScore(query, a.label) + fuzzyScore(query, a.description ?? '')),
        )
    : fullList

  // Group results
  const grouped = GROUP_ORDER.reduce<Partial<Record<CommandGroup, CommandItem[]>>>((acc, g) => {
    const items = filtered.filter((c) => c.group === g)
    if (items.length) acc[g] = items
    return acc
  }, {})

  // Flat list for keyboard navigation
  const flat = (Object.values(grouped) as CommandItem[][]).flat()

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus + reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-[201] px-4"
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cp-title"
              className="bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' }}
            >
              {/* Visually-hidden title for aria-labelledby */}
              <span id="cp-title" className="sr-only">Command palette</span>

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
                <svg
                  className="w-4 h-4 text-gray-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions, AI generators…"
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
                  aria-label="Search commands"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 rounded bg-white/[0.07] border border-white/10 text-[10px] text-gray-500 font-mono flex-shrink-0">
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                role="listbox"
                aria-label="Command results"
                className="max-h-[58vh] overflow-y-auto py-1.5"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.2) transparent' }}
              >
                {flat.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                    <span className="text-3xl select-none">◌</span>
                    <p className="text-gray-300 text-sm font-medium">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Try a broader term — e.g. <span className="text-[#D4AF37]">&ldquo;gen&rdquo;</span> for AI
                      generators, or{' '}
                      <button
                        onClick={() => setQuery('')}
                        className="text-[#D4AF37] underline underline-offset-2 hover:no-underline"
                      >
                        clear the search
                      </button>{' '}
                      to browse all commands.
                    </p>
                  </div>
                ) : (
                  (() => {
                    let globalIdx = 0
                    return (Object.entries(grouped) as [CommandGroup, CommandItem[]][]).map(
                      ([group, items]) => (
                        <div key={group}>
                          <p
                            className={`px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
                              GROUP_ACCENT[group as CommandGroup] ?? 'text-gray-600'
                            }`}
                          >
                            {group}
                          </p>
                          {items.map((item) => {
                            const idx = globalIdx++
                            const isSelected = idx === selectedIndex
                            const iconBg = GROUP_ICON_BG[item.group] ?? 'bg-white/5'
                            return (
                              <button
                                key={item.id}
                                role="option"
                                aria-selected={isSelected}
                                data-idx={idx}
                                onClick={item.action}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-[100ms] ${
                                  isSelected
                                    ? 'bg-[#D4AF37]/10 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                                }`}
                              >
                                {/* Gold icon pill */}
                                <span
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 font-mono text-sm transition-colors ${iconBg} ${
                                    isSelected ? 'text-[#D4AF37]' : 'text-gray-500'
                                  }`}
                                >
                                  {item.icon}
                                </span>

                                {/* Text */}
                                <span className="flex-1 min-w-0">
                                  <span
                                    className={`text-sm font-medium block truncate transition-colors ${
                                      isSelected ? 'text-white' : ''
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  {item.description && (
                                    <span className="text-[11px] text-gray-600 block truncate mt-0.5">
                                      {item.description}
                                    </span>
                                  )}
                                </span>

                                {/* Shortcut hint */}
                                {item.shortcut && <KeyBadge keys={item.shortcut} />}

                                {/* Selection chevron */}
                                {isSelected && (
                                  <svg
                                    className="w-3 h-3 text-[#D4AF37] flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      ),
                    )
                  })()
                )}
              </div>

              {/* Quick-actions tip bar */}
              <div className="px-4 py-2 border-t border-white/[0.07] bg-[#0f0f0f]">
                <p className="text-[10px] text-gray-600 truncate">
                  <span className="text-[#D4AF37] font-semibold">Tip:</span>{' '}
                  Type{' '}
                  <kbd className="inline-flex items-center px-1 h-4 rounded bg-white/[0.07] border border-white/10 font-mono text-[9px] text-gray-400">
                    &gt;
                  </kbd>{' '}
                  for commands &bull;{' '}
                  <kbd className="inline-flex items-center px-1 h-4 rounded bg-white/[0.07] border border-white/10 font-mono text-[9px] text-gray-400">
                    #
                  </kbd>{' '}
                  for templates &bull;{' '}
                  <kbd className="inline-flex items-center px-1 h-4 rounded bg-white/[0.07] border border-white/10 font-mono text-[9px] text-gray-400">
                    @
                  </kbd>{' '}
                  for team members
                </p>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/[0.05] flex items-center gap-4 text-[10px] text-gray-600">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center h-4 px-1 rounded bg-white/[0.07] border border-white/10 font-mono text-[9px]">
                    ↑↓
                  </kbd>{' '}
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center h-4 px-1 rounded bg-white/[0.07] border border-white/10 font-mono text-[9px]">
                    ↵
                  </kbd>{' '}
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center h-4 px-1 rounded bg-white/[0.07] border border-white/10 font-mono text-[9px]">
                    Esc
                  </kbd>{' '}
                  close
                </span>
                <span className="ml-auto text-gray-700">
                  {flat.length} result{flat.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
