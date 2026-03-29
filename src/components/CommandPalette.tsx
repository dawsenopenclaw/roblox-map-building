'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string
  group: 'Navigation' | 'Actions' | 'Recent' | 'Help'
  label: string
  description?: string
  icon: string
  shortcut?: string
  action: () => void
}

// ---------------------------------------------------------------------------
// Fuzzy search helper
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
  // Boost exact substring matches
  if (h.includes(n)) return 2
  return 1
}

// ---------------------------------------------------------------------------
// Key badge sub-component
// ---------------------------------------------------------------------------

function KeyBadge({ keys }: { keys: string }) {
  return (
    <span className="hidden sm:flex items-center gap-0.5">
      {keys.split('+').map((k, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded bg-white/10 border border-white/20 text-[10px] text-gray-400 font-mono"
        >
          {k}
        </kbd>
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// CommandPalette
// ---------------------------------------------------------------------------

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNewProject: () => void
  onShowShortcuts: () => void
}

const GROUP_ORDER: CommandItem['group'][] = ['Navigation', 'Actions', 'Recent', 'Help']

export function CommandPalette({
  isOpen,
  onClose,
  onNewProject,
  onShowShortcuts,
}: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const navigate = useCallback(
    (href: string) => {
      onClose()
      router.push(href)
    },
    [onClose, router],
  )

  // Build command list (stable reference is not required — rebuilds are cheap)
  const allCommands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      group: 'Navigation',
      label: 'Dashboard',
      description: 'Your projects overview',
      icon: '⬡',
      shortcut: 'G D',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-voice',
      group: 'Navigation',
      label: 'Voice Build',
      description: 'Build a map from voice',
      icon: '🎙️',
      shortcut: 'G V',
      action: () => navigate('/voice'),
    },
    {
      id: 'nav-image',
      group: 'Navigation',
      label: 'Image to Map',
      description: 'Convert image into terrain',
      icon: '🗺️',
      shortcut: 'G I',
      action: () => navigate('/image-to-map'),
    },
    {
      id: 'nav-marketplace',
      group: 'Navigation',
      label: 'Marketplace',
      description: 'Browse asset templates',
      icon: '🛒',
      shortcut: 'G M',
      action: () => navigate('/marketplace'),
    },
    {
      id: 'nav-settings',
      group: 'Navigation',
      label: 'Settings',
      description: 'Account & preferences',
      icon: '⚙️',
      shortcut: 'G S',
      action: () => navigate('/settings'),
    },
    {
      id: 'nav-achievements',
      group: 'Navigation',
      label: 'Achievements',
      icon: '🏆',
      action: () => navigate('/achievements'),
    },
    {
      id: 'nav-team',
      group: 'Navigation',
      label: 'Team',
      icon: '👥',
      action: () => navigate('/team'),
    },
    // Actions
    {
      id: 'action-new',
      group: 'Actions',
      label: 'New Project',
      description: 'Start building something new',
      icon: '✨',
      shortcut: '⌘ N',
      action: () => {
        onClose()
        onNewProject()
      },
    },
    {
      id: 'action-billing',
      group: 'Actions',
      label: 'Manage Billing',
      description: 'Upgrade or manage your plan',
      icon: '💳',
      action: () => navigate('/billing'),
    },
    // Help
    {
      id: 'help-shortcuts',
      group: 'Help',
      label: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: '⌨️',
      shortcut: '⌘ /',
      action: () => {
        onClose()
        onShowShortcuts()
      },
    },
    {
      id: 'help-docs',
      group: 'Help',
      label: 'Documentation',
      description: 'Open the docs site',
      icon: '📖',
      action: () => window.open('https://docs.ForjeGames.com', '_blank'),
    },
  ]

  // Filter + sort by fuzzy match
  const filtered = query
    ? allCommands
        .filter((c) => fuzzyMatch(query, c.label) || fuzzyMatch(query, c.description ?? ''))
        .sort((a, b) => fuzzyScore(query, b.label) - fuzzyScore(query, a.label))
    : allCommands

  // Group filtered results
  const grouped = GROUP_ORDER.reduce<Record<string, CommandItem[]>>((acc, g) => {
    const items = filtered.filter((c) => c.group === g)
    if (items.length) acc[g] = items
    return acc
  }, {})

  // Flat list for keyboard navigation
  const flat = Object.values(grouped).flat()

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
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
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101]"
          >
            <div className="bg-[#242424] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                  placeholder="Search pages, actions, help…"
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 rounded bg-white/10 border border-white/20 text-[10px] text-gray-400 font-mono flex-shrink-0">
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                {flat.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">No results for &ldquo;{query}&rdquo;</p>
                ) : (
                  (() => {
                    let globalIndex = 0
                    return Object.entries(grouped).map(([group, items]) => (
                      <div key={group}>
                        <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                          {group}
                        </p>
                        {items.map((item) => {
                          const idx = globalIndex++
                          const isSelected = idx === selectedIndex
                          return (
                            <button
                              key={item.id}
                              data-index={idx}
                              onClick={item.action}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                isSelected
                                  ? 'bg-[#FFB81C]/10 text-white'
                                  : 'text-gray-300 hover:text-white'
                              }`}
                            >
                              {/* Icon */}
                              <span className="text-base w-5 text-center flex-shrink-0">
                                {item.icon}
                              </span>

                              {/* Text */}
                              <span className="flex-1 min-w-0">
                                <span
                                  className={`text-sm font-medium block truncate ${
                                    isSelected ? 'text-white' : ''
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.description && (
                                  <span className="text-xs text-gray-500 block truncate">
                                    {item.description}
                                  </span>
                                )}
                              </span>

                              {/* Shortcut hint */}
                              {item.shortcut && (
                                <KeyBadge keys={item.shortcut} />
                              )}

                              {/* Selection arrow */}
                              {isSelected && (
                                <svg
                                  className="w-3.5 h-3.5 text-[#FFB81C] flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ))
                  })()
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-white/10 flex items-center gap-4 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center h-4 px-1 rounded bg-white/10 border border-white/20 font-mono text-[9px]">
                    ↑↓
                  </kbd>{' '}
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center h-4 px-1 rounded bg-white/10 border border-white/20 font-mono text-[9px]">
                    ↵
                  </kbd>{' '}
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex items-center justify-center h-4 px-1 rounded bg-white/10 border border-white/20 font-mono text-[9px]">
                    Esc
                  </kbd>{' '}
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
