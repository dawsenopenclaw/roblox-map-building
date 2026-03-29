'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type CommandStatus = 'processing' | 'done' | 'error'

type CommandEntry = {
  id: string
  text: string
  status: CommandStatus
  result: string
  tokensUsed: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Build a castle',
  'Add forest',
  'Racing track',
  'Underground caves',
  'Futuristic city',
  'Volcanic island',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3)
}

// ─── Speech hook ──────────────────────────────────────────────────────────────

function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    const SR =
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition ?? window.SpeechRecognition
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript
      if (transcript.trim()) onResult(transcript.trim())
    }

    recognitionRef.current = rec
    rec.start()
  }, [supported, onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, supported, start, stop }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VoiceBuildPage() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CommandEntry[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }, [])

  const { listening, supported, start, stop } = useSpeechRecognition(handleVoiceResult)

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const tokens = estimateTokens(trimmed)
      const entry: CommandEntry = {
        id: uid(),
        text: trimmed,
        status: 'processing',
        result: '',
        tokensUsed: tokens,
      }

      setHistory((prev) => [entry, ...prev])
      setInput('')
      setTotalTokens((prev) => prev + tokens)

      // Simulate AI call — replace with real API route when configured
      await new Promise((r) => setTimeout(r, 1200))

      setHistory((prev) =>
        prev.map((c) =>
          c.id === entry.id
            ? {
                ...c,
                status: 'done' as CommandStatus,
                result: 'AI service not configured — command queued',
              }
            : c
        )
      )
    },
    []
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit(input)
  }

  const toggleMic = () => {
    if (listening) stop()
    else start()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-2xl font-semibold text-white">Voice Build</h1>
        <p className="text-gray-400 text-sm mt-1">
          Speak or type what you want to build in your Roblox world.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">

        {/* Mic button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={toggleMic}
            disabled={!supported}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
            className={[
              'w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200',
              'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
              listening
                ? 'bg-red-600 border-red-500 focus:ring-red-500 scale-110'
                : supported
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 focus:ring-gray-500'
                : 'bg-gray-800 border-gray-700 opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            {listening ? '⏹' : '🎤'}
          </button>

          <span className="text-sm text-gray-400">
            {!supported
              ? 'Voice not supported in this browser'
              : listening
              ? 'Listening... speak now'
              : 'Click to start speaking'}
          </span>
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type what you want to build..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s)
                  inputRef.current?.focus()
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-sm text-gray-300 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Command history */}
      {history.length > 0 && (
        <div className="w-full max-w-2xl mt-6 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Command History</h2>
          </div>
          <ul className="divide-y divide-gray-800">
            {history.map((cmd) => (
              <li key={cmd.id} className="px-4 py-3 flex items-start gap-3">
                <span className="mt-0.5 text-base flex-shrink-0">
                  {cmd.status === 'processing'
                    ? '⏳'
                    : cmd.status === 'done'
                    ? '✓'
                    : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-100 truncate">"{cmd.text}"</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cmd.status === 'processing'
                      ? 'Processing...'
                      : cmd.result}
                  </p>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5">
                  {cmd.tokensUsed} tk
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Token counter */}
      <div className="w-full max-w-2xl mt-4 text-right">
        <span className="text-xs text-gray-600">
          {totalTokens} tokens used this session
        </span>
      </div>
    </div>
  )
}
