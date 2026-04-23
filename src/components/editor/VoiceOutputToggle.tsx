'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * VoiceOutputToggle — AI speaks responses aloud via Web Speech API.
 *
 * When enabled, every new assistant message is spoken using speechSynthesis.
 * Code blocks are skipped (only the conversational text is read).
 * Users can toggle on/off. Pauses when tab is not focused.
 */

interface VoiceOutputToggleProps {
  /** The latest assistant message content to speak */
  latestMessage?: string
  /** Whether voice output is enabled */
  enabled: boolean
  /** Toggle voice output */
  onToggle: (enabled: boolean) => void
}

/** Strip code blocks and technical content — only speak conversational text */
function extractSpeakableText(content: string): string {
  let text = content
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, ' code generated. ')
  // Remove [FOLLOWUP] and [SUGGESTIONS] sections
  text = text.replace(/\[FOLLOWUP\][\s\S]*?(?=\[|$)/g, '')
  text = text.replace(/\[SUGGESTIONS\][\s\S]*$/g, '')
  // Remove markdown formatting
  text = text.replace(/\*\*(.*?)\*\*/g, '$1')
  text = text.replace(/`([^`]+)`/g, '$1')
  // Remove excessive whitespace
  text = text.replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').trim()
  // Cap length for performance
  return text.slice(0, 500)
}

export function VoiceOutputToggle({ latestMessage, enabled, onToggle }: VoiceOutputToggleProps) {
  const [speaking, setSpeaking] = useState(false)
  const lastSpokenRef = useRef<string>('')
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Speak new messages when enabled
  useEffect(() => {
    if (!enabled || !supported || !latestMessage) return
    if (latestMessage === lastSpokenRef.current) return

    const speakable = extractSpeakableText(latestMessage)
    if (speakable.length < 5) return

    lastSpokenRef.current = latestMessage

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(speakable)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 0.9

    // Pick a good voice (prefer female English voices)
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Google'))
    ) || voices.find(v => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)

    return () => {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [latestMessage, enabled, supported])

  // Stop speaking when disabled
  useEffect(() => {
    if (!enabled && supported) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [enabled, supported])

  const handleToggle = useCallback(() => {
    if (!enabled) {
      onToggle(true)
    } else {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
      onToggle(false)
    }
  }, [enabled, onToggle])

  if (!supported) return null

  return (
    <button
      onClick={handleToggle}
      title={enabled ? 'Voice output ON — click to mute' : 'Enable voice output — AI speaks responses'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        borderRadius: 10,
        border: enabled
          ? '1px solid rgba(212,175,55,0.25)'
          : '1px solid rgba(255,255,255,0.06)',
        background: enabled
          ? 'rgba(212,175,55,0.08)'
          : 'rgba(255,255,255,0.03)',
        color: enabled ? '#D4AF37' : '#52525B',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'var(--font-geist-sans, Inter, sans-serif)',
      }}
      onMouseEnter={e => {
        if (!enabled) {
          e.currentTarget.style.color = '#A1A1AA'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseLeave={e => {
        if (!enabled) {
          e.currentTarget.style.color = '#52525B'
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        }
      }}
    >
      {speaking ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 010 7.07" style={{ animation: 'voicePulse 1s ease-in-out infinite' }} />
          <path d="M19.07 4.93a10 10 0 010 14.14" style={{ animation: 'voicePulse 1s ease-in-out 0.2s infinite' }} />
        </svg>
      ) : enabled ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
      {enabled ? (speaking ? 'Speaking...' : 'Voice ON') : 'Voice'}
      <style>{`
        @keyframes voicePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </button>
  )
}
