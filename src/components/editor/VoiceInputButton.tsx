'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceInput } from '@/hooks/useVoiceInput'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VoiceInputButtonProps {
  onSubmit: (text: string) => void
  disabled?: boolean
  className?: string
}

// ─── Waveform visualizer ────────────────────────────────────────────────────────

function Waveform() {
  const bars = [3, 5, 8, 6, 4, 7, 5, 9, 6, 4, 7, 5]

  return (
    <div className="flex items-center gap-0.5 h-4">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full flex-shrink-0"
          style={{ background: '#D4AF37' }}
          animate={{
            height: [h * 1.5, h * 3, h * 1.5],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.07,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Transcript overlay ─────────────────────────────────────────────────────────

function TranscriptOverlay({
  transcript,
  interimTranscript,
  onClose,
}: {
  transcript: string
  interimTranscript: string
  onClose: () => void
}) {
  const displayText = transcript || interimTranscript || ''
  const hasInterim = Boolean(interimTranscript && !transcript.endsWith(interimTranscript))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute bottom-full right-0 mb-2 w-72 rounded-xl overflow-hidden z-50"
      style={{
        background: '#1c1c1f',
        border: '1px solid rgba(212,175,55,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(212,175,55,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <Waveform />
          <span className="text-[10px] font-semibold" style={{ color: '#D4AF37' }}>Listening…</span>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] transition-colors hover:text-zinc-200"
          style={{ color: '#52525b' }}
        >
          Stop
        </button>
      </div>

      {/* Transcript */}
      <div className="px-3 py-3 min-h-[48px]">
        {displayText ? (
          <p className="text-xs leading-relaxed" style={{ color: '#d4d4d8' }}>
            <span>{transcript}</span>
            {hasInterim && (
              <span style={{ color: '#71717a' }}>{interimTranscript}</span>
            )}
          </p>
        ) : (
          <p className="text-xs" style={{ color: '#52525b' }}>
            Speak now…
          </p>
        )}
      </div>

      {/* Tip */}
      <div
        className="px-3 py-1.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p className="text-[10px]" style={{ color: '#3f3f46' }}>
          Pauses for 1.5s to auto-send
        </p>
      </div>
    </motion.div>
  )
}

// ─── Microphone icon ────────────────────────────────────────────────────────────

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="7" y="2" width="6" height="10" rx="3" fill={active ? 'rgba(212,175,55,0.2)' : 'none'} />
      <path d="M4 10a6 6 0 0 0 12 0" />
      <line x1="10" y1="16" x2="10" y2="19" />
      <line x1="7" y1="19" x2="13" y2="19" />
    </svg>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function VoiceInputButton({ onSubmit, disabled = false, className }: VoiceInputButtonProps) {
  const submittedRef = useRef<string>('')

  const { isListening, state, transcript, interimTranscript, startListening, stopListening, isSupported, error } =
    useVoiceInput({
      autoSubmit: true,
      pauseMs: 1500,
      onTranscript: (text) => {
        if (text && text !== submittedRef.current) {
          submittedRef.current = text
          stopListening()
          onSubmit(text)
        }
      },
    })

  // Reset submitted ref when starting a new session
  useEffect(() => {
    if (isListening) {
      submittedRef.current = ''
    }
  }, [isListening])

  if (!isSupported) return null

  const isProcessing = state === 'processing'

  return (
    <div className={`relative flex-shrink-0 ${className ?? ''}`}>
      {/* Pulse ring when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.6, 0], scale: [0.9, 1.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: 'rgba(212,175,55,0.3)' }}
          />
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={isListening ? stopListening : startListening}
        disabled={disabled || isProcessing}
        title={isListening ? 'Stop listening' : 'Start voice input'}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isListening}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:cursor-not-allowed"
        style={{
          background: isListening
            ? 'rgba(212,175,55,0.15)'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isListening ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: isListening ? '#D4AF37' : isProcessing ? '#D4AF37' : '#71717a',
        }}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <circle cx="8" cy="8" r="6" stroke="rgba(212,175,55,0.2)" strokeWidth="2" />
              <path d="M8 2a6 6 0 0 1 6 6" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        ) : (
          <MicIcon active={isListening} />
        )}
      </motion.button>

      {/* Transcript overlay */}
      <AnimatePresence>
        {isListening && (
          <TranscriptOverlay
            transcript={transcript}
            interimTranscript={interimTranscript}
            onClose={stopListening}
          />
        )}
      </AnimatePresence>

      {/* Error tooltip */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 rounded-lg text-[10px] whitespace-nowrap z-50"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
