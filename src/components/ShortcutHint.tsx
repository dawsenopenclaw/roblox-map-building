'use client'

/**
 * ShortcutHint — renders a small keyboard shortcut badge.
 * Hidden on mobile/touch via the `hidden sm:inline-flex` classes.
 *
 * Usage:
 *   <ShortcutHint keys="⌘+K" />         → ⌘  K
 *   <ShortcutHint keys="⌘+N" />         → ⌘  N
 *   <ShortcutHint keys="G then D" />     → G  then  D
 */
interface ShortcutHintProps {
  /** Shortcut string, split on '+' to render individual key badges. */
  keys: string
  className?: string
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded bg-white/10 border border-white/20 text-[10px] font-mono text-gray-300">
      {children}
    </kbd>
  )
}

export function ShortcutHint({ keys, className = '' }: ShortcutHintProps) {
  const parts = keys.split('+')

  return (
    <span
      className={`hidden sm:inline-flex items-center gap-0.5 ${className}`}
      aria-label={`Shortcut: ${keys}`}
    >
      {parts.map((part, i) => (
        <Key key={i}>{part}</Key>
      ))}
    </span>
  )
}
