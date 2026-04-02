'use client'

/**
 * EditorIntegrations
 *
 * Single component dropped into EditorClient that orchestrates all new
 * feature components. The parent only needs to mount this once and wire
 * two props: onSendMessage and (optionally) studioSessionId.
 *
 * Internal state machine:
 *   no-build-started  → shows GameTypeSelector (empty state)
 *   build-running     → shows BuildProgressDashboard
 *   build-complete    → shows AISuggestions strip
 *   always            → StudioConnectionBanner (collapsible) + UsageDashboard (collapsible)
 *
 * Mobile:
 *   - GameTypeSelector goes to 2-column grid
 *   - BuildProgressDashboard stacks vertically
 *   - AISuggestions collapses behind a "Show suggestions" toggle
 *   - UsageDashboard full-width in its collapsed drawer
 */

import {
  useState,
  useCallback,
  useId,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { StudioConnectionBanner } from './StudioConnectionBanner'
import { BuildProgressDashboard } from './BuildProgressDashboard'
import { GameTypeSelector } from './GameTypeSelector'
import { AISuggestions } from './AISuggestions'
import { UsageDashboard } from './UsageDashboard'
import { VoiceInputButton } from './VoiceInputButton'
import { FeatureErrorBoundary } from './FeatureErrorBoundary'
import { useResponsiveStandalone } from '@/components/ui/ResponsiveLayout'
import { getCompatibilityWarning } from '@/lib/browser-compat'
import { announceToScreenReader } from '@/lib/a11y'

// ─── Types ─────────────────────────────────────────────────────────────────────

type EditorPhase =
  | 'empty'      // No build started — show GameTypeSelector
  | 'building'   // Build in progress — show BuildProgressDashboard
  | 'complete'   // Build done — show AISuggestions
  | 'chat'       // User has sent messages but no structured build

export interface EditorIntegrationsProps {
  /** Forward a message to the editor's chat submit handler */
  onSendMessage: (msg: string) => void
  studioSessionId?: string
  /** True once the user has sent at least one message (hides GameTypeSelector) */
  hasMessages?: boolean
}

// ─── Browser compatibility warning banner ──────────────────────────────────────

function CompatWarningBanner() {
  const [dismissed, setDismissed] = useState(false)
  const warning = getCompatibilityWarning()

  if (!warning || dismissed) return null

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-3 py-2 mx-3 mt-2 rounded-lg"
      style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
      }}
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 14 14" fill="none" style={{ color: '#F59E0B' }}>
        <path d="M7 2L13 12H1L7 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M7 6v3M7 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <p className="flex-1 text-[11px]" style={{ color: '#FDE68A' }}>{warning}</p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss browser warning"
        className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Collapsible usage sidebar section ─────────────────────────────────────────

function CollapsibleUsage({ isMobile }: { isMobile: boolean }) {
  const [open, setOpen] = useState(false)
  const headingId = useId()

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`usage-panel-${headingId}`}
        className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-white/3"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" style={{ color: '#D4AF37' }}>
            <rect x="1" y="8" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="5.5" y="5" width="3" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="10" y="2" width="3" height="11" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="text-[11px] font-medium" style={{ color: '#A1A1AA' }}>Usage</span>
        </div>
        <svg
          className="w-3 h-3 transition-transform duration-200"
          viewBox="0 0 12 12"
          fill="none"
          style={{ color: '#71717a', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={`usage-panel-${headingId}`}
          className={isMobile ? 'px-3 pb-3' : 'px-3 pb-3'}
        >
          <FeatureErrorBoundary name="Usage Dashboard">
            <UsageDashboard compact={!isMobile} />
          </FeatureErrorBoundary>
        </div>
      )}
    </div>
  )
}

// ─── Mobile suggestions toggle ─────────────────────────────────────────────────

interface MobileSuggestionsPanelProps {
  buildSummary?: string
  gameType?: string
  onSendMessage: (msg: string) => void
}

function MobileSuggestionsPanel({
  buildSummary,
  gameType,
  onSendMessage,
}: MobileSuggestionsPanelProps) {
  const [open, setOpen] = useState(false)
  const headingId = useId()

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`suggestions-panel-${headingId}`}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" style={{ color: '#D4AF37' }}>
            <path d="M7 1l1.5 4H13L9.5 7.5l1.5 4.5L7 9l-4 3 1.5-4.5L1 5h4.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] font-medium" style={{ color: '#D4AF37' }}>AI Suggestions</span>
          <span
            className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
          >
            NEW
          </span>
        </div>
        <svg
          className="w-3 h-3 transition-transform duration-200"
          viewBox="0 0 12 12"
          fill="none"
          style={{ color: '#71717a', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={`suggestions-panel-${headingId}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3 pb-3">
              <FeatureErrorBoundary name="AI Suggestions">
                <AISuggestions
                  buildSummary={buildSummary}
                  gameType={gameType}
                  onSuggestionClick={onSendMessage}
                  maxSuggestions={3}
                />
              </FeatureErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function EditorIntegrations({
  onSendMessage,
  studioSessionId,
  hasMessages = false,
}: EditorIntegrationsProps) {
  const { isMobile, isTablet } = useResponsiveStandalone()
  const isCompact = isMobile || isTablet

  // ── Build lifecycle state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState<EditorPhase>('empty')
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null)
  const [buildSummary, setBuildSummary] = useState<string | undefined>()
  const [activeGameType, setActiveGameType] = useState<string | undefined>()

  // ── Studio banner visibility ───────────────────────────────────────────────
  const [studioConnected, setStudioConnected] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const showBanner = !studioConnected && !bannerDismissed

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBuildStart = useCallback(
    (buildId: string, gameType?: string) => {
      setActiveBuildId(buildId)
      setActiveGameType(gameType)
      setPhase('building')
      announceToScreenReader('Build started. Generating your game…')
    },
    []
  )

  const handleBuildComplete = useCallback((summary?: string) => {
    setBuildSummary(summary)
    setPhase('complete')
    announceToScreenReader('Build complete! AI suggestions are ready.')
  }, [])

  const handleBuildCancel = useCallback(() => {
    setActiveBuildId(null)
    setPhase('empty')
  }, [])

  const handleStudioConnected = useCallback(
    (sessionId: string, placeName: string | null) => {
      setStudioConnected(true)
      setBannerDismissed(true)
      announceToScreenReader(
        placeName ? `Connected to ${placeName}.` : 'Studio connected.'
      )
    },
    []
  )

  // If the user has sent a chat message without using the selector, drop into chat phase
  const currentPhase: EditorPhase =
    hasMessages && phase === 'empty' ? 'chat' : phase

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Global keyframes for integration animations */}
      <style>{`
        @keyframes forje-fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* 1. Browser compatibility warning (shown once, dismissible) */}
      <CompatWarningBanner />

      {/* 2. Studio connection banner (top of chat column) */}
      {showBanner && (
        <FeatureErrorBoundary name="Studio Connection" className="mx-3 mt-2">
          <StudioConnectionBanner
            onConnected={handleStudioConnected}
            onDismiss={() => setBannerDismissed(true)}
            className={isCompact ? 'mx-0' : ''}
          />
        </FeatureErrorBoundary>
      )}

      {/* 3. Game type selector — shown in the empty state before any build */}
      <AnimatePresence mode="wait">
        {currentPhase === 'empty' && (
          <motion.div
            key="game-type-selector"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-3"
          >
            <FeatureErrorBoundary name="Game Type Selector">
              <GameTypeSelector
                onBuildStart={(buildId) => handleBuildStart(buildId)}
                onDismiss={() => setPhase('chat')}
              />
            </FeatureErrorBoundary>
          </motion.div>
        )}

        {/* 4. Build progress dashboard — shown while build is running */}
        {currentPhase === 'building' && activeBuildId && (
          <motion.div
            key="build-progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-3"
          >
            <FeatureErrorBoundary name="Build Progress">
              <BuildProgressDashboard
                buildId={activeBuildId}
                onComplete={handleBuildComplete}
                onCancel={handleBuildCancel}
              />
            </FeatureErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. AI Suggestions — shown after build completes */}
      <AnimatePresence>
        {currentPhase === 'complete' && (
          isCompact ? (
            /* Mobile/tablet: collapsible toggle */
            <MobileSuggestionsPanel
              buildSummary={buildSummary}
              gameType={activeGameType}
              onSendMessage={onSendMessage}
            />
          ) : (
            /* Desktop: inline strip */
            <motion.div
              key="ai-suggestions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="px-3 py-2 overflow-hidden"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <FeatureErrorBoundary name="AI Suggestions">
                <AISuggestions
                  buildSummary={buildSummary}
                  gameType={activeGameType}
                  onSuggestionClick={onSendMessage}
                  maxSuggestions={4}
                />
              </FeatureErrorBoundary>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* 6. Usage dashboard — collapsible at the bottom of the chat sidebar */}
      <CollapsibleUsage isMobile={isMobile} />
    </>
  )
}

// ─── Voice input button — exported separately for placement in the chat bar ─────

interface EditorVoiceButtonProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

/**
 * Drop-in voice button for the chat input bar.
 * Wrapped in its own error boundary so a crash here never breaks typing.
 */
export function EditorVoiceButton({ onSubmit, disabled }: EditorVoiceButtonProps) {
  return (
    <FeatureErrorBoundary name="Voice Input">
      <VoiceInputButton onSubmit={onSubmit} disabled={disabled} />
    </FeatureErrorBoundary>
  )
}

// ─── Hook: manage build phase from outside ─────────────────────────────────────

export interface UseBuildPhaseReturn {
  phase: EditorPhase
  setPhase: Dispatch<SetStateAction<EditorPhase>>
  activeBuildId: string | null
  startBuild: (buildId: string, gameType?: string) => void
  completeBuild: (summary?: string) => void
  cancelBuild: () => void
}

/**
 * If you need to drive the phase from a parent (e.g., from EditorClient's
 * chat message handler), use this hook and pass the setters down to
 * EditorIntegrations as controlled props.
 *
 * Not used in the default integration — EditorIntegrations self-manages.
 */
export function useBuildPhase(): UseBuildPhaseReturn {
  const [phase, setPhase] = useState<EditorPhase>('empty')
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null)

  return {
    phase,
    setPhase,
    activeBuildId,
    startBuild: useCallback((buildId: string) => {
      setActiveBuildId(buildId)
      setPhase('building')
    }, []),
    completeBuild: useCallback(() => {
      setPhase('complete')
    }, []),
    cancelBuild: useCallback(() => {
      setActiveBuildId(null)
      setPhase('empty')
    }, []),
  }
}
