'use client'

/**
 * OnboardingTooltips — contextual coach marks shown after completing the wizard.
 *
 * Usage: Mount inside DashboardClient. It reads localStorage to decide whether
 * to show. The parent page can also pass `show` to force-show (e.g., from
 * settings "Re-run tour" button).
 *
 * Tooltips target elements via CSS class anchors:
 *   data-tour="token-balance"
 *   data-tour="quick-actions"
 *   data-tour="streak-widget"
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TooltipConfig {
  id: string
  anchor: string           // value of data-tour attr on target element
  title: string
  body: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOOLTIPS: TooltipConfig[] = [
  {
    id: 'token-balance',
    anchor: 'token-balance',
    title: 'Your token balance',
    body: 'Tokens fuel every AI build. Free plan includes 500/month. Top up anytime.',
    position: 'bottom',
  },
  {
    id: 'quick-actions',
    anchor: 'quick-actions',
    title: 'Start building here',
    body: 'Voice Build, Image to Map, New Project — your power tools, one click away.',
    position: 'bottom',
  },
  {
    id: 'streak-widget',
    anchor: 'streak-widget',
    title: 'Track your streak',
    body: 'Build something every day to keep your streak alive and earn bonus XP.',
    position: 'top',
  },
]

const LS_KEY = 'ForjeGames:tooltips:dismissed'

// ─── Tooltip bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  config: TooltipConfig
  anchorRect: DOMRect
  onDismiss: () => void
  isLast: boolean
  onDismissAll: () => void
  index: number
  total: number
}

function TooltipBubble({ config, anchorRect, onDismiss, isLast, onDismissAll, index, total }: BubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const GAP = 10

  useEffect(() => {
    const bubble = bubbleRef.current
    if (!bubble) return
    const bw = bubble.offsetWidth || 280
    const bh = bubble.offsetHeight || 100
    const { top, left, bottom, right, width } = anchorRect
    const scrollY = window.scrollY

    let t = 0, l = 0
    switch (config.position) {
      case 'bottom':
        t = bottom + scrollY + GAP
        l = left + width / 2 - bw / 2
        break
      case 'top':
        t = top + scrollY - bh - GAP
        l = left + width / 2 - bw / 2
        break
      case 'left':
        t = top + scrollY + anchorRect.height / 2 - bh / 2
        l = left - bw - GAP
        break
      case 'right':
        t = top + scrollY + anchorRect.height / 2 - bh / 2
        l = right + GAP
        break
    }

    // Keep in viewport
    l = Math.max(12, Math.min(l, window.innerWidth - bw - 12))

    setPos({ top: t, left: l })
  }, [anchorRect, config.position])

  const arrowClass: Record<string, string> = {
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1E2548]',
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1E2548]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1E2548]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1E2548]',
  }

  const arrowBorder: Record<string, string> = {
    bottom: 'border-x-8 border-x-transparent border-b-8',
    top: 'border-x-8 border-x-transparent border-t-8',
    left: 'border-y-8 border-y-transparent border-l-8',
    right: 'border-y-8 border-y-transparent border-r-8',
  }

  return (
    <motion.div
      ref={bubbleRef}
      initial={{ opacity: 0, scale: 0.92, y: config.position === 'bottom' ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 280 }}
      className="bg-[#1E2548] border border-[#FFB81C]/30 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 ${arrowBorder[config.position]} ${arrowClass[config.position]}`}
        style={{ top: config.position === 'bottom' ? undefined : config.position === 'top' ? undefined : undefined }}
      />

      {/* Step counter */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#FFB81C] text-xs font-semibold uppercase tracking-widest">
          {index + 1} of {total}
        </span>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-300 transition-colors"
          aria-label="Dismiss tooltip"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-white text-sm font-semibold mb-1">{config.title}</p>
      <p className="text-gray-300 text-xs leading-relaxed mb-4">{config.body}</p>

      <div className="flex items-center gap-2">
        <button
          onClick={onDismissAll}
          className="text-gray-400 text-xs hover:text-gray-300 transition-colors"
        >
          Got it, hide all
        </button>
        <div className="flex-1" />
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 bg-[#FFB81C] text-black text-xs font-bold rounded-lg hover:bg-[#E6A519] transition-colors"
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Highlight overlay ────────────────────────────────────────────────────────

function HighlightOverlay({ rect }: { rect: DOMRect }) {
  const PAD = 6
  return (
    <>
      {/* dim backdrop with cutout */}
      <div className="fixed inset-0 z-[9990] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="cutout">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - PAD}
                y={rect.top - PAD}
                width={rect.width + PAD * 2}
                height={rect.height + PAD * 2}
                rx="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#cutout)" />
        </svg>
      </div>
      {/* gold ring */}
      <div
        className="fixed z-[9991] pointer-events-none rounded-xl border-2 border-[#FFB81C] shadow-[0_0_0_4px_rgba(255,184,28,0.15)]"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }}
      />
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OnboardingTooltipsProps {
  /** Force the tour to show regardless of localStorage state */
  forceShow?: boolean
}

export function OnboardingTooltips({ forceShow = false }: OnboardingTooltipsProps) {
  const [visible, setVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  // ── Decide whether to show ──
  useEffect(() => {
    if (forceShow) {
      setVisible(true)
      return
    }
    try {
      const raw = localStorage.getItem(LS_KEY)
      const dismissed: string[] = raw ? JSON.parse(raw) : []
      const remaining = TOOLTIPS.filter((t) => !dismissed.includes(t.id))
      if (remaining.length > 0) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [forceShow])

  // ── Find anchor element and measure ──
  useEffect(() => {
    if (!visible) return
    const active = TOOLTIPS[activeIndex]
    if (!active) return

    const measure = () => {
      const el = document.querySelector(`[data-tour="${active.anchor}"]`)
      if (el) {
        setAnchorRect(el.getBoundingClientRect())
      } else {
        setAnchorRect(null)
      }
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [visible, activeIndex])

  const dismissCurrent = () => {
    const id = TOOLTIPS[activeIndex].id
    try {
      const raw = localStorage.getItem(LS_KEY)
      const dismissed: string[] = raw ? JSON.parse(raw) : []
      if (!dismissed.includes(id)) dismissed.push(id)
      localStorage.setItem(LS_KEY, JSON.stringify(dismissed))
    } catch { /* ignore */ }

    if (activeIndex < TOOLTIPS.length - 1) {
      setActiveIndex((i) => i + 1)
    } else {
      setVisible(false)
    }
  }

  const dismissAll = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(TOOLTIPS.map((t) => t.id)))
    } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  const config = TOOLTIPS[activeIndex]

  return (
    <AnimatePresence mode="wait">
      {anchorRect && (
        <>
          <HighlightOverlay key={`hl-${activeIndex}`} rect={anchorRect} />
          <TooltipBubble
            key={`tip-${activeIndex}`}
            config={config}
            anchorRect={anchorRect}
            onDismiss={dismissCurrent}
            onDismissAll={dismissAll}
            isLast={activeIndex === TOOLTIPS.length - 1}
            index={activeIndex}
            total={TOOLTIPS.length}
          />
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Re-export for settings "Re-run tour" button ──────────────────────────────

/** Call this to reset dismissed state so tour shows again */
export function resetOnboardingTour() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch { /* ignore */ }
}
