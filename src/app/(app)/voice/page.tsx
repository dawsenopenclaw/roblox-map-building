'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { useAnalytics } from '@/hooks/useAnalytics'

// ─── Types ───────────────────────────────────────────────────────────────────

type CommandEntry = {
  id: string
  text: string
  result: string
  timestamp: Date
  tokensUsed: number
  status: 'building' | 'done' | 'error'
}

type BuildStep = {
  label: string
  done: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Build a medieval castle with a moat",
  "Add rolling hills and a river",
  "Create an underground cave system",
  "Build a futuristic city skyline",
  "Add a dense forest with fog",
  "Create a volcanic island",
]

const BUILD_STEPS: BuildStep[] = [
  { label: "Parsing intent", done: false },
  { label: "Generating terrain", done: false },
  { label: "Placing assets", done: false },
  { label: "Writing scripts", done: false },
  { label: "Finalising world", done: false },
]

const RESULT_LABELS: Record<string, string> = {
  "medieval castle": "Generated: Medieval Castle",
  "rolling hills": "Generated: Hills & River",
  "cave system": "Generated: Cave System",
  "futuristic city": "Generated: City Skyline",
  "forest": "Generated: Dense Forest",
  "volcanic island": "Generated: Volcanic Isle",
}

function inferResult(text: string): string {
  const lower = text.toLowerCase()
  for (const [key, val] of Object.entries(RESULT_LABELS)) {
    if (lower.includes(key)) return val
  }
  return "Generated: Custom World"
}

// ─── Web Audio waveform ───────────────────────────────────────────────────────

function AudioWaveform({
  active,
  analyserRef,
}: {
  active: boolean
  analyserRef: React.MutableRefObject<AnalyserNode | null>
}) {
  const BARS = 40
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const frameRef = useRef<number>(0)

  useEffect(() => {
    let running = true

    const tick = () => {
      if (!running) return
      const analyser = analyserRef.current

      if (analyser && active) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const step = Math.floor(data.length / BARS)

        barsRef.current.forEach((el, i) => {
          if (!el) return
          const raw = data[i * step] ?? 0
          // map 0-255 → 4-48px, add slight smoothing
          const h = 4 + (raw / 255) * 44
          el.style.height = `${h}px`
          el.style.opacity = raw > 10 ? '1' : '0.35'
        })
      } else {
        // Breathing idle animation
        const t = Date.now() / 1000
        barsRef.current.forEach((el, i) => {
          if (!el) return
          const h = active
            ? 4
            : 4 + Math.sin(t * 1.4 + i * 0.28) * 2 + 1
          el.style.height = `${h}px`
          el.style.opacity = '0.25'
        })
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frameRef.current)
    }
  }, [active, analyserRef])

  return (
    <div className="flex items-center justify-center gap-[3px] h-14 w-full">
      {Array.from({ length: BARS }).map((_, i) => (
        <div
          key={i}
          ref={el => { barsRef.current[i] = el }}
          className="rounded-full transition-[height] duration-75"
          style={{
            width: '3px',
            height: '4px',
            background: active
              ? `hsl(${40 + i * 1.5}, 100%, 60%)`
              : '#2A3060',
          }}
        />
      ))}
    </div>
  )
}

// ─── Typewriter transcription ─────────────────────────────────────────────────

function LiveTranscription({
  finalText,
  interimText,
}: {
  finalText: string
  interimText: string
}) {
  return (
    <div className="min-h-[88px] bg-[#0A0E2A] border border-white/8 rounded-2xl p-4 text-sm leading-relaxed relative overflow-hidden">
      {/* Subtle scanline */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)',
        }}
      />
      {finalText || interimText ? (
        <p className="relative z-10">
          <span className="text-white">{finalText}</span>
          {interimText && (
            <span className="text-gray-500 italic"> {interimText}</span>
          )}
          <span className="inline-block w-0.5 h-4 bg-[#FFB81C] ml-0.5 animate-pulse align-middle" />
        </p>
      ) : (
        <p className="text-gray-600 relative z-10">
          Your words appear here as you speak...
        </p>
      )}
    </div>
  )
}

// ─── Build progress steps ─────────────────────────────────────────────────────

function BuildProgress({ step }: { step: number }) {
  const currentLabel = step < BUILD_STEPS.length ? BUILD_STEPS[step].label : 'Complete'
  return (
    <div
      className="space-y-2 text-left w-full max-w-xs mx-auto"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Build progress: step ${step + 1} of ${BUILD_STEPS.length} — ${currentLabel}`}
    >
      {BUILD_STEPS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.18 }}
          className="flex items-center gap-3"
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              i < step
                ? 'bg-green-500'
                : i === step
                ? 'bg-[#FFB81C] animate-pulse'
                : 'bg-white/10'
            }`}
            aria-hidden="true"
          >
            {i < step ? (
              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-black' : 'bg-white/20'}`} />
            )}
          </div>
          <span className={`text-sm transition-colors duration-300 ${
            i < step ? 'text-green-400' : i === step ? 'text-white font-medium' : 'text-gray-600'
          }`}>
            {s.label}
            {i < step && <span className="sr-only"> (complete)</span>}
            {i === step && <span className="sr-only"> (in progress)</span>}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Tutorial overlay ─────────────────────────────────────────────────────────

function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: "Click the mic",
      desc: "Tap the gold circle to start listening",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Describe your world",
      desc: "Say things like \"build a medieval castle\" or \"add a dense forest\"",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      ),
      title: "Watch it build",
      desc: "AI generates terrain, places assets, and writes scripts live",
    },
  ]

  const isLast = step === steps.length - 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-[#0D1231] border border-white/12 rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
      >
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-[#FFB81C] w-6' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center mx-auto mb-5 text-[#FFB81C]">
              {steps[step].icon}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{steps[step].title}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{steps[step].desc}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => isLast ? onDismiss() : setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl bg-[#FFB81C] text-black font-bold text-sm hover:bg-[#E6A519] transition-colors"
          >
            {isLast ? "Let's go" : "Next"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Token counter ─────────────────────────────────────────────────────────────

function TokenCounter({ live, total, running }: { live: number; total: number; running: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0A0E2A] border border-white/8 rounded-xl">
      <div className={`w-2 h-2 rounded-full ${running ? 'bg-[#FFB81C] animate-pulse' : 'bg-white/20'}`} />
      <div className="flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[#FFB81C] font-mono font-bold text-sm">
            {running ? live.toLocaleString() : '—'}
          </span>
          <span className="text-gray-600 text-xs">tokens this build</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-gray-400 font-mono text-xs">{total.toLocaleString()}</span>
          <span className="text-gray-600 text-xs">total this session</span>
        </div>
      </div>
      <svg className={`w-4 h-4 ${running ? 'text-[#FFB81C]' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const { track } = useAnalytics()
  const [isListening, setIsListening] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [commands, setCommands] = useState<CommandEntry[]>([])
  const [liveTokens, setLiveTokens] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)
  const [buildStep, setBuildStep] = useState(0)
  const [showTutorial, setShowTutorial] = useState(true)
  const [typeInput, setTypeInput] = useState('')

  const recognitionRef = useRef<any>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const tokenIntervalRef = useRef<any>(null)
  const stepIntervalRef = useRef<any>(null)

  // ── Audio context setup ──────────────────────────────────────────────────────
  const setupAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source
    } catch {
      // Mic permission denied — waveform stays decorative
    }
  }, [])

  const teardownAudioContext = useCallback(() => {
    sourceRef.current?.disconnect()
    analyserRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  // ── Token simulation during build ────────────────────────────────────────────
  useEffect(() => {
    if (!isBuilding) {
      setLiveTokens(0)
      clearInterval(tokenIntervalRef.current)
      clearInterval(stepIntervalRef.current)
      return
    }

    setBuildStep(0)
    setLiveTokens(0)

    tokenIntervalRef.current = setInterval(() => {
      setLiveTokens(c => c + Math.floor(Math.random() * 6 + 2))
    }, 120)

    let s = 0
    stepIntervalRef.current = setInterval(() => {
      s++
      setBuildStep(s)
      if (s >= BUILD_STEPS.length - 1) clearInterval(stepIntervalRef.current)
    }, 580)

    return () => {
      clearInterval(tokenIntervalRef.current)
      clearInterval(stepIntervalRef.current)
    }
  }, [isBuilding])

  // ── Speech recognition ────────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition requires Chrome or Edge.')
      return
    }

    await setupAudioContext()

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (final) setTranscript(prev => prev + final + ' ')
      setInterimTranscript(interim)
    }

    recognition.onend = () => {
      setIsListening(false)
      teardownAudioContext()
    }
    recognition.onerror = () => {
      setIsListening(false)
      teardownAudioContext()
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setInterimTranscript('')
    track('voice_build_started', { inputType: 'voice' })
  }, [setupAudioContext, teardownAudioContext, track])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    teardownAudioContext()
    setInterimTranscript('')
  }, [teardownAudioContext])

  // ── Build handler ──────────────────────────────────────────────────────────────
  const handleBuild = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? (transcript + interimTranscript)).trim()
    if (!text) return

    if (isListening) stopListening()
    setIsBuilding(true)
    setTypeInput('')

    const buildStart = Date.now()
    track('voice_build_started', { inputType: overrideText ? 'text' : 'voice', prompt: text.slice(0, 120) })

    await new Promise(resolve => setTimeout(resolve, BUILD_STEPS.length * 600 + 400))

    const used = liveTokens || Math.floor(Math.random() * 180 + 60)
    const resultLabel = inferResult(text)
    const entry: CommandEntry = {
      id: Date.now().toString(),
      text,
      result: resultLabel,
      timestamp: new Date(),
      tokensUsed: used,
      status: 'done',
    }

    track('voice_build_completed', {
      durationMs: Date.now() - buildStart,
      tokensUsed: used,
      resultLabel,
    })
    track('token_spent', { amount: used, feature: 'voice_build' })

    setTotalTokens(t => t + used)
    setCommands(prev => [entry, ...prev])
    setTranscript('')
    setInterimTranscript('')
    setIsBuilding(false)
    setBuildStep(0)
  }, [transcript, interimTranscript, isListening, liveTokens, stopListening, track])

  const handleUndo = (id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id))
  }

  const handleSuggestion = (text: string) => {
    setTranscript(text)
  }

  const fullText = transcript + (interimTranscript ? ` ${interimTranscript}` : '')

  // ── Mic button state ───────────────────────────────────────────────────────────
  const micState: 'idle' | 'listening' | 'building' =
    isBuilding ? 'building' : isListening ? 'listening' : 'idle'

  return (
    <>
      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onDismiss={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>

      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-0 overflow-hidden -m-4 sm:-m-6">

        {/* ── Left panel ── */}
        <div className="lg:w-[38%] flex flex-col bg-[#0B0F28] border-b lg:border-b-0 lg:border-r border-white/8 overflow-y-auto">

          {/* Header */}
          <div className="px-6 py-5 border-b border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="text-[#FFB81C]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </span>
                  Voice Build
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">Speak your idea. AI builds it.</p>
              </div>
              <button
                onClick={() => setShowTutorial(true)}
                className="text-xs text-gray-600 hover:text-gray-400 border border-white/8 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Tutorial
              </button>
            </div>
          </div>

          {/* Mic section */}
          <div className="px-6 pt-8 pb-4 flex flex-col items-center">

            {/* Mic button */}
            <div className="relative flex items-center justify-center">
              {/* Idle breathing glow */}
              {micState === 'idle' && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: 120,
                    height: 120,
                    background: 'radial-gradient(circle, rgba(255,184,28,0.12) 0%, transparent 70%)',
                  }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Recording pulse rings */}
              {micState === 'listening' && (
                <>
                  <motion.div
                    className="absolute rounded-full border border-[#FFB81C]/35"
                    style={{ width: 120, height: 120 }}
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute rounded-full border border-[#FFB81C]/20"
                    style={{ width: 120, height: 120 }}
                    animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                  />
                  <motion.div
                    className="absolute rounded-full border border-[#FFB81C]/10"
                    style={{ width: 120, height: 120 }}
                    animate={{ scale: [1, 2.4], opacity: [0.35, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
                  />
                </>
              )}

              <motion.button
                onClick={micState === 'listening' ? stopListening : micState === 'idle' ? startListening : undefined}
                disabled={micState === 'building'}
                whileHover={micState !== 'building' ? { scale: 1.05 } : undefined}
                whileTap={micState !== 'building' ? { scale: 0.95 } : undefined}
                animate={
                  micState === 'listening'
                    ? { boxShadow: ['0 0 0 0px rgba(255,184,28,0.3)', '0 0 0 12px rgba(255,184,28,0)'] }
                    : {}
                }
                transition={micState === 'listening' ? { duration: 1, repeat: Infinity } : {}}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  micState === 'listening'
                    ? 'bg-[#FFB81C] cursor-pointer'
                    : micState === 'building'
                    ? 'bg-[#111640] cursor-not-allowed opacity-60'
                    : 'bg-[#111640] border-2 border-[#FFB81C]/30 hover:border-[#FFB81C]/60 cursor-pointer'
                }`}
              >
                {micState === 'building' ? (
                  <svg className="w-9 h-9 text-[#FFB81C] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg
                    className={`w-10 h-10 transition-colors duration-200 ${
                      micState === 'listening' ? 'text-black' : 'text-[#FFB81C]'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </motion.button>
            </div>

            {/* Status label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={micState}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm mt-4 font-medium"
              >
                {micState === 'building' ? (
                  <span className="text-[#FFB81C]">Building your world...</span>
                ) : micState === 'listening' ? (
                  <span className="text-[#FFB81C]">Listening — tap to stop</span>
                ) : (
                  <span className="text-gray-500">Tap to speak</span>
                )}
              </motion.p>
            </AnimatePresence>

            {/* Waveform */}
            <div className="mt-3 w-full">
              <AudioWaveform active={isListening} analyserRef={analyserRef} />
            </div>
          </div>

          {/* Transcription */}
          <div className="px-6 pb-3">
            <LiveTranscription finalText={transcript} interimText={interimTranscript} />

            <AnimatePresence>
              {fullText && !isListening && !isBuilding && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-3 space-y-2"
                >
                  <button
                    onClick={() => handleBuild()}
                    className="w-full bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Build Now
                  </button>
                  <button
                    onClick={() => { setTranscript(''); setInterimTranscript('') }}
                    className="w-full border border-white/8 hover:border-white/16 text-gray-500 hover:text-gray-300 text-sm py-2 rounded-xl transition-colors"
                  >
                    Clear
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Type-to-build fallback */}
          <div className="px-6 pb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={typeInput}
                onChange={e => setTypeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBuild(typeInput)}
                placeholder="Or type a command..."
                disabled={isBuilding}
                className="flex-1 bg-[#0A0E2A] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/40 transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => handleBuild(typeInput)}
                disabled={!typeInput.trim() || isBuilding}
                className="px-3 py-2.5 bg-[#111640] border border-white/8 hover:border-[#FFB81C]/30 rounded-xl text-[#FFB81C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="px-6 pb-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2.5 font-medium">Try saying...</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.slice(0, 4).map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.07 }}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs bg-[#0A0E2A] border border-white/8 hover:border-[#FFB81C]/30 text-gray-500 hover:text-[#FFB81C] px-3 py-1.5 rounded-lg transition-colors"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Token counter */}
          <div className="px-6 pb-4">
            <TokenCounter live={liveTokens} total={totalTokens} running={isBuilding} />
          </div>

          {/* Command history */}
          <div className="px-6 pb-6 flex-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3 font-medium">History</p>

            {commands.length === 0 ? (
              <p className="text-gray-700 text-sm text-center py-6">No commands yet</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {commands.map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 22 }}
                      className="bg-[#0A0E2A] border border-white/8 rounded-xl p-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-white leading-snug flex-1">{cmd.text}</p>
                        <button
                          onClick={() => handleUndo(cmd.id)}
                          className="text-xs text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded border border-transparent hover:border-red-400/20"
                        >
                          Undo
                        </button>
                      </div>

                      <p className="text-xs text-[#FFB81C]/80 mt-1.5">{cmd.result}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-600">
                          {cmd.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-600">
                          {cmd.tokensUsed.toLocaleString()} tokens
                        </span>
                        <span className={`text-xs font-medium ${cmd.status === 'done' ? 'text-green-400' : 'text-red-400'}`}>
                          {cmd.status === 'done' ? 'Built' : 'Failed'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: 3D preview ── */}
        <div className="flex-1 bg-[#07091A] flex flex-col">

          {/* Preview header */}
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-400">3D Preview</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <span className="w-2 h-2 rounded-full bg-green-400/60" />
              <span className="text-xs text-gray-600">Studio — connecting...</span>
            </div>
          </div>

          {/* Preview body */}
          <div className="flex-1 relative overflow-hidden">

            {/* Grid background — faux 3D floor */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,184,28,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,184,28,0.5) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Corner dots */}
            {[
              'top-4 left-4', 'top-4 right-4',
              'bottom-4 left-4', 'bottom-4 right-4',
            ].map(pos => (
              <div key={pos} className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-[#FFB81C]/20`} />
            ))}

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isBuilding ? (
                  <motion.div
                    key="building"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="text-center max-w-xs px-6 w-full"
                  >
                    {/* Animated orb */}
                    <div className="relative w-20 h-20 mx-auto mb-8">
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(255,184,28,0.3) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/30 flex items-center justify-center">
                        <svg className="w-9 h-9 text-[#FFB81C] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    </div>

                    <p className="text-white font-semibold mb-1">Building your world...</p>
                    <p className="text-gray-500 text-xs mb-6">AI is generating terrain, placing assets, and writing scripts</p>

                    <BuildProgress step={buildStep} />

                    <div className="mt-6 flex items-center justify-center gap-2">
                      <span className="text-[#FFB81C] font-mono font-bold text-xl">{liveTokens.toLocaleString()}</span>
                      <span className="text-gray-600 text-sm">tokens</span>
                    </div>
                  </motion.div>
                ) : commands.length > 0 ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center px-6"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 16 }}
                      className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5"
                    >
                      <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                    <p className="text-white font-semibold mb-1">{commands[0].result}</p>
                    <p className="text-gray-500 text-sm mb-6">Sent to Roblox Studio</p>
                    <p className="text-gray-600 text-xs">Speak or type to continue building</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center px-6"
                  >
                    {/* Faux 3D cube wireframe */}
                    <svg
                      className="w-24 h-24 mx-auto mb-6 opacity-10"
                      viewBox="0 0 96 96"
                      fill="none"
                      stroke="#FFB81C"
                      strokeWidth="1.5"
                    >
                      <rect x="24" y="24" width="48" height="48" />
                      <rect x="14" y="14" width="48" height="48" />
                      <line x1="14" y1="14" x2="24" y2="24" />
                      <line x1="62" y1="14" x2="72" y2="24" />
                      <line x1="14" y1="62" x2="24" y2="72" />
                      <line x1="62" y1="62" x2="72" y2="72" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-2">Your 3D world appears here</p>
                    <p className="text-gray-700 text-sm mb-6">
                      Connect Roblox Studio to see live previews
                    </p>
                    <a href="#" className="text-sm text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors">
                      Install Studio plugin
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
