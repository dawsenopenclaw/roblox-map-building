'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Command {
  id: string
  category: Category
  title: string
  icon: string
  shortcut?: string
  prompt: string
}

type Category =
  | 'Build'
  | 'Systems'
  | 'Assets'
  | 'Analyze'
  | 'Settings'
  | 'Quick Actions'

// ─── Command Registry ─────────────────────────────────────────────────────────

const COMMANDS: Command[] = [
  // Build
  { id: 'build-castle',    category: 'Build', icon: '🏰', title: 'Build castle',     prompt: 'Build me a detailed medieval castle with towers, battlements, and a gatehouse', shortcut: 'B C' },
  { id: 'build-city',      category: 'Build', icon: '🌆', title: 'Build city block',  prompt: 'Build a city block with buildings, roads, sidewalks, and street props' },
  { id: 'build-forest',    category: 'Build', icon: '🌲', title: 'Build forest',      prompt: 'Build a dense forest with varied trees, undergrowth, fallen logs, and a winding path' },
  { id: 'build-dungeon',   category: 'Build', icon: '⚔️', title: 'Build dungeon',     prompt: 'Build a dark underground dungeon with stone corridors, cells, and torchlit chambers' },
  { id: 'build-terrain',   category: 'Build', icon: '⛰️', title: 'Build terrain',     prompt: 'Generate varied terrain with hills, a river valley, and elevated plateaus' },
  { id: 'build-racetrack', category: 'Build', icon: '🏎️', title: 'Build race track',  prompt: 'Build a winding race track with banked turns, pit lane, and grandstands' },

  // Systems
  { id: 'sys-pets',      category: 'Systems', icon: '🐾', title: 'Create pet system',     prompt: 'Create a full pet system with hatching eggs, pet stats, leveling, and equipping' },
  { id: 'sys-combat',    category: 'Systems', icon: '⚔️', title: 'Create combat system',  prompt: 'Create a combat system with hitboxes, damage calculation, health bars, and knockback' },
  { id: 'sys-economy',   category: 'Systems', icon: '💰', title: 'Create economy',         prompt: 'Create an in-game economy with currency, earning, spending, and DataStore persistence' },
  { id: 'sys-quests',    category: 'Systems', icon: '📜', title: 'Create quest system',    prompt: 'Create a quest system with objectives, rewards, NPC givers, and progress tracking' },
  { id: 'sys-inventory', category: 'Systems', icon: '🎒', title: 'Create inventory',       prompt: 'Create a grid-based inventory system with item stacking, equipping, and drag-and-drop UI' },
  { id: 'sys-shop',      category: 'Systems', icon: '🛒', title: 'Create shop',            prompt: 'Create a shop GUI with item listings, purchase flow, and DataStore-backed currency' },

  // Assets
  { id: 'asset-3d',          category: 'Assets', icon: '🧊', title: 'Generate 3D model',    prompt: 'Generate a 3D model for: ', shortcut: '⌘ G' },
  { id: 'asset-texture',     category: 'Assets', icon: '🎨', title: 'Generate texture',      prompt: 'Generate a seamless PBR texture for: ' },
  { id: 'asset-marketplace', category: 'Assets', icon: '🔍', title: 'Search marketplace',    prompt: 'Search the Roblox marketplace for assets matching: ' },

  // Analyze
  { id: 'analyze-perf',    category: 'Analyze', icon: '📊', title: 'Performance audit',  prompt: 'Run a full performance audit on the current place. Check draw calls, instance count, and script performance.' },
  { id: 'analyze-game',    category: 'Analyze', icon: '🔬', title: 'Game analysis',       prompt: 'Analyze the current game design: engagement loops, monetization, and retention mechanics.' },
  { id: 'analyze-scripts', category: 'Analyze', icon: '🧹', title: 'Optimize scripts',    prompt: 'Review and optimize all scripts in the current project for memory leaks, redundant connections, and N+1 patterns.' },

  // Settings
  { id: 'settings-model',  category: 'Settings', icon: '🤖', title: 'Change AI model',   prompt: '__action:change-model', shortcut: '⌘ M' },
  { id: 'settings-voice',  category: 'Settings', icon: '🎙️', title: 'Toggle voice',      prompt: '__action:toggle-voice', shortcut: '⌘ V' },
  { id: 'settings-studio', category: 'Settings', icon: '🔌', title: 'Connect Studio',     prompt: '__action:connect-studio' },
  { id: 'settings-docs',   category: 'Settings', icon: '📖', title: 'View docs',          prompt: '__action:view-docs' },

  // Quick Actions
  { id: 'qa-undo',       category: 'Quick Actions', icon: '↩️', title: 'Undo last build',  prompt: '__action:undo', shortcut: '⌘ Z' },
  { id: 'qa-clear',      category: 'Quick Actions', icon: '🗑️', title: 'Clear chat',       prompt: '__action:clear-chat' },
  { id: 'qa-export',     category: 'Quick Actions', icon: '📤', title: 'Export code',       prompt: '__action:export-code', shortcut: '⌘ E' },
  { id: 'qa-screenshot', category: 'Quick Actions', icon: '📸', title: 'Take screenshot',   prompt: '__action:screenshot', shortcut: '⌘ S' },
]

const CATEGORY_ORDER: Category[] = [
  'Build',
  'Systems',
  'Assets',
  'Analyze',
  'Settings',
  'Quick Actions',
]

const CATEGORY_COLORS: Record<Category, string> = {
  Build:          '#8B5CF6',
  Systems:        '#06B6D4',
  Assets:         '#F97316',
  Analyze:        '#10B981',
  Settings:       '#6B7280',
  'Quick Actions': '#D4AF37',
}

// ─── Fuzzy match helper ───────────────────────────────────────────────────────

function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

// ─── useCommandPalette hook ───────────────────────────────────────────────────

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modKey = isMac ? e.metaKey : e.ctrlKey

      if (modKey && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return { isOpen, open, close, toggle }
}

// ─── CommandPalette component ─────────────────────────────────────────────────

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onCommand: (command: string) => void
}

export function CommandPalette({ isOpen, onClose, onCommand }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')

  // ── Filter and group results ──
  const filtered = useMemo(() => {
    return COMMANDS.filter(cmd =>
      fuzzyMatch(query, cmd.title) || fuzzyMatch(query, cmd.category)
    )
  }, [query])

  const grouped = useMemo(() => {
    const map = new Map<Category, Command[]>()
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter(c => c.category === cat)
      if (items.length > 0) map.set(cat, items)
    }
    return map
  }, [filtered])

  // Flat list for keyboard navigation
  const flatList = useMemo(() => filtered, [filtered])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [isOpen])

  // Keep active item in view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex(i => Math.min(i + 1, flatList.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (flatList[activeIndex]) {
            handleSelect(flatList[activeIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [flatList, activeIndex, onClose],
  )

  const handleSelect = useCallback(
    (cmd: Command) => {
      onCommand(cmd.prompt)
      onClose()
    },
    [onCommand, onClose],
  )

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!isOpen) return null

  // ── Render ──
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        style={{
          position: 'fixed',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 640,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'rgba(10, 10, 16, 0.96)',
          border: '1px solid rgba(212, 175, 55, 0.22)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Magnifier icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(212,175,55,0.7)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            spellCheck={false}
            autoComplete="off"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F3F4F6',
              fontSize: 16,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              caretColor: '#D4AF37',
            }}
          />

          {/* Hint badge */}
          <kbd
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.03em',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            maxHeight: 420,
            padding: '6px 0 8px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(212,175,55,0.2) transparent',
          }}
        >
          {flatList.length === 0 ? (
            <div
              style={{
                padding: '32px 24px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.3)',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              No commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, items]) => {
              const color = CATEGORY_COLORS[category]

              return (
                <div key={category}>
                  {/* Category header */}
                  <div
                    style={{
                      padding: '8px 18px 4px',
                      fontSize: 10.5,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color,
                      opacity: 0.75,
                    }}
                  >
                    {category}
                  </div>

                  {/* Items */}
                  {items.map(cmd => {
                    const flatIdx = flatList.indexOf(cmd)
                    const isActive = flatIdx === activeIndex

                    return (
                      <button
                        key={cmd.id}
                        data-active={isActive}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          padding: '9px 18px',
                          background: isActive
                            ? 'rgba(212, 175, 55, 0.1)'
                            : 'transparent',
                          border: 'none',
                          borderLeft: isActive
                            ? `2px solid #D4AF37`
                            : '2px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s ease, border-color 0.1s ease',
                        }}
                      >
                        {/* Icon */}
                        <span
                          style={{
                            fontSize: 18,
                            lineHeight: 1,
                            width: 26,
                            textAlign: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {cmd.icon}
                        </span>

                        {/* Title */}
                        <span
                          style={{
                            flex: 1,
                            fontSize: 14,
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? '#F3F4F6' : 'rgba(255,255,255,0.75)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {highlightMatch(cmd.title, query)}
                        </span>

                        {/* Shortcut badge */}
                        {cmd.shortcut && (
                          <kbd
                            style={{
                              flexShrink: 0,
                              fontSize: 11,
                              fontFamily: 'Inter, sans-serif',
                              color: isActive
                                ? 'rgba(212,175,55,0.9)'
                                : 'rgba(255,255,255,0.25)',
                              background: isActive
                                ? 'rgba(212,175,55,0.12)'
                                : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${isActive ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                              borderRadius: 5,
                              padding: '2px 6px',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '9px 18px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <FooterHint keys={['↑', '↓']} label="navigate" />
          <FooterHint keys={['↵']} label="select" />
          <FooterHint keys={['ESC']} label="close" />
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.03em',
            }}
          >
            {flatList.length} command{flatList.length !== 1 ? 's' : ''}
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(212,175,55,0.5)',
              letterSpacing: '0.02em',
              fontWeight: 600,
            }}
          >
            ForjeAI
          </span>
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FooterHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        color: 'rgba(255,255,255,0.3)',
      }}
    >
      {keys.map(k => (
        <kbd
          key={k}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            padding: '1px 5px',
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {k}
        </kbd>
      ))}
      <span>{label}</span>
    </div>
  )
}

// ─── Highlight matched characters ─────────────────────────────────────────────

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text

  const q = query.toLowerCase()
  const result: React.ReactNode[] = []
  let qi = 0
  let lastEnd = 0

  for (let i = 0; i < text.length && qi < q.length; i++) {
    if (text[i].toLowerCase() === q[qi]) {
      if (i > lastEnd) {
        result.push(text.slice(lastEnd, i))
      }
      result.push(
        <mark
          key={i}
          style={{
            background: 'transparent',
            color: '#FFB81C',
            fontWeight: 600,
          }}
        >
          {text[i]}
        </mark>,
      )
      lastEnd = i + 1
      qi++
    }
  }

  if (lastEnd < text.length) {
    result.push(text.slice(lastEnd))
  }

  return result.length > 0 ? result : text
}
