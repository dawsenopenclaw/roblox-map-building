'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Tour step definitions ─────────────────────────────────────────────────────

interface TourStep {
  title: string
  body: string
  /** Which UI zone this step highlights — used for optional pulsing arrow */
  zone: 'chat' | 'chips' | 'viewport' | 'studio'
  /** Cardinal direction the tooltip arrow points */
  arrowDir: 'down' | 'up' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Describe what you want to build',
    body: 'Type a prompt in the chat and ForjeAI will generate Luau code, terrain, assets — whatever you need.',
    zone: 'chat',
    arrowDir: 'left',
  },
  {
    title: 'Quick actions for instant builds',
    body: 'Tap any chip to fire a pre-built prompt. Castle, dungeon, NPC — one click and it runs.',
    zone: 'chips',
    arrowDir: 'left',
  },
  {
    title: 'Your game appears here',
    body: 'The 3D viewport shows your scene in real-time. Pan, orbit, and zoom to inspect every corner.',
    zone: 'viewport',
    arrowDir: 'down',
  },
  {
    title: 'Connect Studio for live building',
    body: 'Link Roblox Studio so ForjeAI pushes builds directly into your place — no copy-paste required.',
    zone: 'studio',
    arrowDir: 'up',
  },
]

const LS_KEY = 'fg_editor_onboarded'

// ─── Zone spotlight positions ──────────────────────────────────────────────────
// These are approximate fixed positions matching EditorClient layout.
// Chat panel is left ~400px wide; viewport is right side; connection badge is top-right.

interface SpotlightStyle {
  top?: string
  bottom?: string
  left?: string
  right?: string
  width: string
  height: string
}

function getSpotlight(zone: TourStep['zone']): SpotlightStyle {
  switch (zone) {
    case 'chat':
      return { top: '50%', left: '0', width: 'min(400px, 38vw)', height: '60%' }
    case 'chips':
      return { top: '15%', left: '0', width: 'min(400px, 38vw)', height: '22%' }
    case 'viewport':
      return { top: '10%', left: 'min(400px, 38vw)', right: '0', width: '62vw', height: '75%' }
    case 'studio':
      return { top: '4px', right: '8px', width: '180px', height: '32px' }
  }
}

// ─── Tooltip position ──────────────────────────────────────────────────────────

interface TooltipPos {
  top?: string
  bottom?: string
  left?: string
  right?: string
  transform?: string
}

function getTooltipPos(zone: TourStep['zone']): TooltipPos {
  switch (zone) {
    case 'chat':
      return { top: '50%', left: 'min(420px, 39vw)', transform: 'translateY(-50%)' }
    case 'chips':
      return { top: '30%', left: 'min(420px, 39vw)', transform: 'translateY(-50%)' }
    case 'viewport':
      return { bottom: '80px', left: '50%', transform: 'translateX(-50%)' }
    case 'studio':
      return { top: '52px', right: '8px' }
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface EditorTourProps {
  /** Called when the tour is dismissed (completed or skipped) */
  onDone: () => void
}

export function EditorTour({ onDone }: EditorTourProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 300)
    const t2 = setTimeout(() => setCardVisible(true), 450)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const step = TOUR_STEPS[stepIdx]
  const isLast = stepIdx === TOUR_STEPS.length - 1

  const advance = useCallback(() => {
    if (isLast) {
      try { localStorage.setItem(LS_KEY, 'true') } catch { /* ignore */ }
      setCardVisible(false)
      setTimeout(() => setVisible(false), 200)
      setTimeout(onDone, 400)
    } else {
      setCardVisible(false)
      setTimeout(() => {
        setStepIdx((i) => i + 1)
        setCardVisible(true)
      }, 150)
    }
  }, [isLast, onDone])

  const skip = useCallback(() => {
    try { localStorage.setItem(LS_KEY, 'true') } catch { /* ignore */ }
    setCardVisible(false)
    setTimeout(() => setVisible(false), 200)
    setTimeout(onDone, 400)
  }, [onDone])

  if (!visible) return null

  const spotStyle = getSpotlight(step.zone)
  const tipPos = getTooltipPos(step.zone)

  return (
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{ transition: 'opacity 0.3s ease-out', opacity: visible ? 1 : 0 }}
    >
      {/* Dark backdrop with a "cut-out" effect via box-shadow on spotlight */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Spotlight outline */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          ...spotStyle,
          border: '2px solid rgba(212,175,55,0.7)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 24px rgba(212,175,55,0.3)',
          transition: 'all 0.35s ease-out',
          zIndex: 201,
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto"
        style={{
          ...tipPos,
          zIndex: 202,
          maxWidth: 280,
          transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
          opacity: cardVisible ? 1 : 0,
          transform: `${tipPos.transform ?? ''} ${cardVisible ? '' : 'translateY(8px)'}`,
        }}
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#141414',
            border: '1px solid rgba(212,175,55,0.35)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.12)',
          }}
        >
          {/* Step counter */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === stepIdx ? 20 : 6,
                    background: i === stepIdx ? '#D4AF37' : i < stepIdx ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500 ml-1">
              {stepIdx + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          <h3 className="font-bold text-sm text-white mb-1.5">{step.title}</h3>
          <p className="text-[12px] text-gray-400 leading-relaxed mb-4">{step.body}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={skip}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip tour
            </button>
            <button
              onClick={advance}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
                boxShadow: '0 0 12px rgba(212,175,55,0.3)',
              }}
            >
              {isLast ? 'Done' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Directional arrow nub */}
        {step.arrowDir === 'left' && (
          <div
            className="absolute"
            style={{
              left: -7,
              top: '50%',
              marginTop: -7,
              width: 0,
              height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '7px solid #141414',
            }}
          />
        )}
        {step.arrowDir === 'down' && (
          <div
            className="absolute"
            style={{
              bottom: -7,
              left: '50%',
              marginLeft: -7,
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #141414',
            }}
          />
        )}
        {step.arrowDir === 'up' && (
          <div
            className="absolute"
            style={{
              top: -7,
              right: 16,
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid #141414',
            }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Hook — returns whether tour should show ───────────────────────────────────

export function useEditorTour() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    try {
      const done = localStorage.getItem(LS_KEY)
      if (!done) setShouldShow(true)
    } catch {
      // ignore
    }
  }, [])

  const dismiss = useCallback(() => setShouldShow(false), [])

  return { shouldShow, dismiss }
}
