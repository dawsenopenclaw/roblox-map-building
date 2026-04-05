'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Platform modifier key
// ---------------------------------------------------------------------------

function useModKey() {
  const [mod, setMod] = useState('Ctrl')
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    // navigator.platform is deprecated — prefer userAgentData, fall back to userAgent
    const ua =
      (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ||
      navigator.userAgent
    if (/Mac|iPhone|iPad|iPod/i.test(ua)) {
      setMod('⌘')
    }
  }, [])
  return mod
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortcutEntry {
  keys: string[]
  label: string
}

interface ShortcutCategory {
  title: string
  items: ShortcutEntry[]
}

// ---------------------------------------------------------------------------
// Key badge component
// ---------------------------------------------------------------------------

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-md bg-[#1c1c1c] border border-white/[0.15] text-xs font-mono text-gray-300 shadow-sm select-none">
      {children}
    </kbd>
  )
}

// ---------------------------------------------------------------------------
// ShortcutsDialog
// ---------------------------------------------------------------------------

interface ShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  const mod = useModKey()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap — Tab cycling, Escape to close, restore focus on unmount
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

    // Auto-focus first focusable element (the close button in the header)
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

  const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
    {
      title: 'General',
      items: [
        { keys: [mod, 'K'],   label: 'Focus editor chat (navigate if away)' },
        { keys: [mod, '/'],   label: 'Show keyboard shortcuts' },
        { keys: [mod, ','],   label: 'Go to Settings' },
        { keys: [mod, 'B'],   label: 'Go to Billing' },
        { keys: [mod, 'G'],   label: 'Go to Gifts' },
        { keys: ['?'],        label: 'Show keyboard shortcuts' },
        { keys: ['Esc'],      label: 'Close panel / dialog' },
      ],
    },
    {
      title: 'Editor',
      items: [
        { keys: [mod, '↵'],          label: 'Send chat message' },
        { keys: [mod, 'K'],          label: 'Focus chat input' },
        { keys: [mod, 'N'],          label: 'New conversation' },
        { keys: [mod, 'B'],          label: 'Toggle sidebar' },
        { keys: [mod, 'Shift', 'C'], label: 'Copy last code block' },
        { keys: [mod, 'Shift', 'R'], label: 'Run last code in Studio' },
        { keys: ['/'],               label: 'Open slash commands (empty input)' },
        { keys: ['Esc'],             label: 'Dismiss slash menu / close panel' },
        { keys: [mod, 'M'],          label: 'Toggle model selector' },
        { keys: [mod, 'Shift', 'V'], label: 'Toggle voice input' },
      ],
    },
    {
      title: 'Navigation (G + key)',
      items: [
        { keys: ['G', 'E'], label: 'Go to Editor' },
        { keys: ['G', 'D'], label: 'Go to Dashboard' },
        { keys: ['G', 'M'], label: 'Go to Marketplace' },
        { keys: ['G', 'S'], label: 'Go to Settings' },
        { keys: ['G', 'B'], label: 'Go to Billing' },
        { keys: ['G', 'V'], label: 'Go to Voice Build' },
        { keys: ['G', 'I'], label: 'Go to Image to Map' },
      ],
    },
    {
      title: 'Command palette',
      items: [
        { keys: ['↑', '↓'], label: 'Move between items' },
        { keys: ['↵'],       label: 'Confirm / select' },
        { keys: ['Esc'],     label: 'Close palette' },
      ],
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="sd-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sd-title"
              className="bg-[#111113] border border-[#D4AF37]/30 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.08)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
                    aria-hidden="true"
                  >
                    ⌨
                  </div>
                  <h2 id="sd-title" className="text-sm font-semibold text-white tracking-tight">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="Close shortcuts dialog"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body — 2-column grid */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 max-h-[65vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.2) transparent' }}>
                {SHORTCUT_CATEGORIES.map((cat) => (
                  <div key={cat.title}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#D4AF37] mb-3">
                      {cat.title}
                    </p>
                    <ul className="space-y-2.5">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center justify-between gap-3">
                          {/* Keys */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.keys.map((k, ki) => (
                              <Key key={ki}>{k}</Key>
                            ))}
                          </div>
                          {/* Label */}
                          <span className="text-xs text-gray-400 text-right flex-1 min-w-0 truncate leading-relaxed">
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/[0.07] flex items-center justify-between">
                <p className="text-[11px] text-gray-600">
                  Press{' '}
                  <kbd className="inline-flex items-center justify-center h-4 px-1.5 rounded bg-white/[0.07] border border-white/10 text-[9px] font-mono">
                    ?
                  </kbd>
                  {' '}or{' '}
                  <kbd className="inline-flex items-center justify-center h-4 px-1.5 rounded bg-white/[0.07] border border-white/10 text-[9px] font-mono">
                    {mod} /
                  </kbd>{' '}
                  anytime to show this dialog
                </p>
                <button
                  onClick={onClose}
                  className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/70 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
