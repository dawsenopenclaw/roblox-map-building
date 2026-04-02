'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  generateSuggestions,
  inferBuildContext,
  type AISuggestion,
  type SuggestionCategory,
  type BuildContext,
} from '@/lib/ai/suggestion-engine'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AISuggestionsProps {
  buildSummary?: string
  buildContext?: BuildContext
  gameType?: string
  onSuggestionClick: (prompt: string) => void
  maxSuggestions?: number
}

// ─── Category colors ────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<SuggestionCategory, { color: string; bg: string; border: string }> = {
  lighting:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)'  },
  audio:         { color: '#A855F7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.2)'  },
  ui:            { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'  },
  gameplay:      { color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
  polish:        { color: '#D4AF37', bg: 'rgba(212,175,55,0.08)',  border: 'rgba(212,175,55,0.2)'  },
  monetization:  { color: '#EC4899', bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.2)'  },
  performance:   { color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)'   },
}

// ─── Single suggestion card ─────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  index,
  onAccept,
  onDismiss,
}: {
  suggestion: AISuggestion
  index: number
  onAccept: () => void
  onDismiss: () => void
}) {
  const style = CATEGORY_STYLES[suggestion.category]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
      transition={{
        layout: { duration: 0.2 },
        opacity: { duration: 0.2 },
        x: { duration: 0.2, delay: index * 0.05 },
      }}
    >
      <motion.div
        whileHover={{ x: -2 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl overflow-hidden mb-2"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
        }}
      >
        <div className="px-3 py-2.5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base leading-none flex-shrink-0">{suggestion.icon}</span>
              <span className="text-xs font-semibold text-white truncate">{suggestion.title}</span>
            </div>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
              style={{ color: '#52525b' }}
              aria-label="Dismiss suggestion"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#71717a' }}>
            {suggestion.description}
          </p>

          {/* Accept button */}
          <button
            onClick={onAccept}
            aria-label={`Build: ${suggestion.title}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              color: style.color,
            }}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3" aria-hidden="true">
              <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Build this
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function AISuggestions({
  buildSummary,
  buildContext,
  gameType,
  onSuggestionClick,
  maxSuggestions = 5,
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [allDismissed, setAllDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [visible, setVisible] = useState(false)

  // Build suggestion list from context
  useEffect(() => {
    if (!buildSummary && !buildContext) return

    const ctx = buildContext ?? (buildSummary ? inferBuildContext(buildSummary, gameType) : undefined)
    if (!ctx) return

    const generated = generateSuggestions(ctx, maxSuggestions)
    if (generated.length > 0) {
      setSuggestions(generated)
      setDismissed(new Set())
      setAllDismissed(false)
      // Animate in after a short delay (build just completed)
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [buildSummary, buildContext, gameType, maxSuggestions])

  const handleAccept = useCallback(
    (suggestion: AISuggestion) => {
      onSuggestionClick(suggestion.prompt)
      setDismissed((prev) => new Set([...prev, suggestion.id]))
    },
    [onSuggestionClick]
  )

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set([...prev, id])
      return next
    })
  }, [])

  const handleDismissAll = useCallback(() => {
    setAllDismissed(true)
    setTimeout(() => setVisible(false), 300)
  }, [])

  const activeSuggestions = suggestions.filter((s) => !dismissed.has(s.id))

  // Auto-hide when all dismissed individually
  useEffect(() => {
    if (suggestions.length > 0 && activeSuggestions.length === 0 && !allDismissed) {
      const t = setTimeout(() => setVisible(false), 400)
      return () => clearTimeout(t)
    }
  }, [activeSuggestions.length, suggestions.length, allDismissed])

  if (!visible || suggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: allDismissed ? 0 : 1, y: allDismissed ? 8 : 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
          style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="flex items-center gap-2">
            {/* Sparkle icon */}
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <svg viewBox="0 0 12 12" fill="#D4AF37" className="w-3 h-3">
                <path d="M6 1l1 3.5L10.5 6 7 7l-1 3.5L5 7 1.5 6 5 4.5z" />
              </svg>
            </div>
            <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>
              AI Suggestions
            </span>
            {activeSuggestions.length > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
              >
                {activeSuggestions.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleDismissAll() }}
              className="text-[10px] transition-colors hover:text-zinc-400"
              style={{ color: '#52525b' }}
            >
              Dismiss all
            </button>
            <motion.div
              animate={{ rotate: collapsed ? -90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: '#52525b' }}
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Suggestion list */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="p-3">
                <AnimatePresence mode="popLayout">
                  {activeSuggestions.length > 0 ? (
                    activeSuggestions.map((s, i) => (
                      <SuggestionCard
                        key={s.id}
                        suggestion={s}
                        index={i}
                        onAccept={() => handleAccept(s)}
                        onDismiss={() => handleDismiss(s.id)}
                      />
                    ))
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-center py-3"
                      style={{ color: '#52525b' }}
                    >
                      All suggestions dismissed.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
