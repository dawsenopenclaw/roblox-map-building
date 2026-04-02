'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type VoiceInputState = 'idle' | 'listening' | 'processing'

export interface UseVoiceInputReturn {
  isListening: boolean
  state: VoiceInputState
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  isSupported: boolean
  error: string | null
}

export interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void
  autoSubmit?: boolean
  /** Milliseconds of silence before auto-submit. Default: 1500 */
  pauseMs?: number
  lang?: string
}

// ─── SpeechRecognition types (browser API) ─────────────────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const win = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onTranscript, autoSubmit = true, pauseMs = 1500, lang = 'en-US' } = options

  const [state, setState] = useState<VoiceInputState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finalTranscriptRef = useRef('')

  // Check support on mount (client-only)
  useEffect(() => {
    setIsSupported(getSpeechRecognitionCtor() !== null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      recognitionRef.current?.abort()
    }
  }, [])

  const resetPauseTimer = useCallback(
    (text: string) => {
      if (!autoSubmit) return
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => {
        const final = text.trim()
        if (final) {
          setState('processing')
          onTranscript?.(final)
        }
      }, pauseMs)
    },
    [autoSubmit, pauseMs, onTranscript]
  )

  const startListening = useCallback(() => {
    const SR = getSpeechRecognitionCtor()
    if (!SR) {
      setError('Speech recognition is not supported in this browser')
      return
    }
    if (state === 'listening') return

    setError(null)
    finalTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')

    const rec = new SR()
    rec.lang = lang
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = true

    rec.onstart = () => {
      setState('listening')
    }

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let finalChunk = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (!result) continue
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalChunk += text
        } else {
          interim += text
        }
      }

      if (finalChunk) {
        finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + finalChunk
        setTranscript(finalTranscriptRef.current)
        resetPauseTimer(finalTranscriptRef.current)
      }

      setInterimTranscript(interim)
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech') return // benign
      if (e.error === 'aborted') return    // user triggered
      setError(`Voice error: ${e.error}`)
      setState('idle')
    }

    rec.onend = () => {
      // Auto-restart if still in listening state (continuous mode workaround)
      if (recognitionRef.current === rec && state === 'listening') {
        try {
          rec.start()
        } catch {
          setState('idle')
        }
      }
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      setError('Could not start microphone. Check browser permissions.')
      setState('idle')
    }
  }, [lang, resetPauseTimer, state])

  const stopListening = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    recognitionRef.current?.stop()
    recognitionRef.current = null

    const final = finalTranscriptRef.current.trim()
    if (final && !autoSubmit) {
      onTranscript?.(final)
    }

    setState('idle')
    setInterimTranscript('')
  }, [autoSubmit, onTranscript])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
  }, [])

  return {
    isListening: state === 'listening',
    state,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  }
}
