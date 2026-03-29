'use client'
import { motion, AnimatePresence } from 'framer-motion'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortcutEntry {
  keys: string[]   // Each element is one key badge, e.g. ['⌘', 'K'] or ['G', 'then', 'D']
  label: string
}

interface ShortcutCategory {
  title: string
  items: ShortcutEntry[]
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'General',
    items: [
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['⌘', 'N'], label: 'New project' },
      { keys: ['⌘', 'B'], label: 'Toggle sidebar' },
      { keys: ['⌘', '/'], label: 'Show keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close modal / palette' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['G', 'D'], label: 'Go to Dashboard' },
      { keys: ['G', 'V'], label: 'Go to Voice Build' },
      { keys: ['G', 'I'], label: 'Go to Image to Map' },
      { keys: ['G', 'M'], label: 'Go to Marketplace' },
      { keys: ['G', 'S'], label: 'Go to Settings' },
    ],
  },
  {
    title: 'Navigation hints',
    items: [
      { keys: ['↑', '↓'], label: 'Move between items' },
      { keys: ['↵'], label: 'Confirm / select' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Key component
// ---------------------------------------------------------------------------

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.8rem] h-7 px-2 rounded-md bg-[#2e2e2e] border border-white/20 text-xs font-mono text-gray-200 shadow-sm">
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

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-[#242424] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⌨️</span>
                  <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Close shortcuts dialog"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {SHORTCUT_CATEGORIES.map((cat) => (
                  <div key={cat.title}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                      {cat.title}
                    </p>
                    <ul className="space-y-2.5">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center justify-between gap-4">
                          {/* Keys */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.keys.map((k, ki) => (
                              <Key key={ki}>{k}</Key>
                            ))}
                          </div>
                          {/* Label */}
                          <span className="text-sm text-gray-300 text-right flex-1 min-w-0 truncate">
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Press{' '}
                  <kbd className="inline-flex items-center justify-center h-4 px-1.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono">
                    ⌘ /
                  </kbd>{' '}
                  anytime to show this dialog
                </p>
                <button
                  onClick={onClose}
                  className="text-xs text-[#FFB81C] hover:text-[#FFB81C]/80 transition-colors"
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
