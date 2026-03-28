'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

type CommandEntry = {
  id: string
  text: string
  timestamp: Date
  tokensUsed: number
  status: 'building' | 'done' | 'error'
}

const SUGGESTIONS = [
  "Build a medieval castle with a moat",
  "Add rolling hills and a river",
  "Create an underground cave system",
  "Build a futuristic city skyline",
  "Add a dense forest with fog",
  "Create a volcanic island",
]

// Waveform bars — animated audio visualization
function AudioWaveform({ active }: { active: boolean }) {
  const bars = 32
  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all"
          style={{
            background: active ? '#FFB81C' : '#1E2451',
            height: active
              ? `${20 + Math.sin(Date.now() / 200 + i * 0.4) * 16 + Math.random() * 8}px`
              : '4px',
            animation: active ? `waveBar ${0.5 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  )
}

export default function VoicePage() {
  const [isListening, setIsListening] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [commands, setCommands] = useState<CommandEntry[]>([])
  const [tokenCost, setTokenCost] = useState(0)
  const [waveActive, setWaveActive] = useState(false)
  const recognitionRef = useRef<any>(null)
  const waveIntervalRef = useRef<any>(null)

  // Animate waveform while listening
  useEffect(() => {
    if (isListening) {
      setWaveActive(true)
      waveIntervalRef.current = setInterval(() => setWaveActive(v => !v || true), 100)
    } else {
      setWaveActive(false)
      clearInterval(waveIntervalRef.current)
    }
    return () => clearInterval(waveIntervalRef.current)
  }, [isListening])

  // Token cost increases while building
  useEffect(() => {
    if (!isBuilding) return
    const interval = setInterval(() => {
      setTokenCost(c => c + Math.floor(Math.random() * 3 + 1))
    }, 200)
    return () => clearInterval(interval)
  }, [isBuilding])

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Edge.')
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) setTranscript(prev => prev + final + ' ')
      setInterimTranscript(interim)
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setInterimTranscript('')
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const handleBuild = useCallback(async () => {
    const text = (transcript + interimTranscript).trim()
    if (!text) return

    stopListening()
    setIsBuilding(true)
    setTokenCost(0)

    // Simulate build — real call goes to /api/voice/generate in Phase 5
    await new Promise(resolve => setTimeout(resolve, 3000))

    const entry: CommandEntry = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      tokensUsed: tokenCost || Math.floor(Math.random() * 150 + 50),
      status: 'done',
    }
    setCommands(prev => [entry, ...prev])
    setTranscript('')
    setIsBuilding(false)
    setTokenCost(0)
  }, [transcript, interimTranscript, stopListening, tokenCost])

  const handleUndo = (id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id))
  }

  const handleSuggestion = (text: string) => {
    setTranscript(text)
  }

  const fullText = transcript + (interimTranscript ? ` ${interimTranscript}` : '')

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-0 overflow-hidden -m-4 sm:-m-6">
      {/* Left panel: Voice controls */}
      <div className="lg:w-[35%] flex flex-col bg-[#0D1231] border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎙️</span> Voice Build
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Speak your idea. AI builds it in real-time.
          </p>
        </div>

        {/* Mic button */}
        <div className="px-6 py-8 flex flex-col items-center">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isBuilding}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-[#FFB81C]/20 border-2 border-[#FFB81C] shadow-lg shadow-[#FFB81C]/30'
                : 'bg-[#111640] border-2 border-white/20 hover:border-white/40'
            } ${isBuilding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Pulse rings */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full border border-[#FFB81C]/40 animate-ping" />
                <span className="absolute -inset-2 rounded-full border border-[#FFB81C]/20 animate-ping" style={{ animationDelay: '0.2s' }} />
              </>
            )}
            <svg
              className={`w-10 h-10 ${isListening ? 'text-[#FFB81C]' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>

          <p className="text-sm mt-4 font-medium">
            {isBuilding ? (
              <span className="text-[#FFB81C]">Building... ⚡ {tokenCost} tokens</span>
            ) : isListening ? (
              <span className="text-[#FFB81C]">Listening...</span>
            ) : (
              <span className="text-gray-400">Tap to speak</span>
            )}
          </p>

          {/* Waveform */}
          <div className="mt-4 w-full">
            <AudioWaveform active={isListening} />
          </div>
        </div>

        {/* Transcription display */}
        <div className="px-6 pb-4">
          <div className="min-h-[80px] bg-[#111640] border border-white/10 rounded-xl p-4 text-sm">
            {fullText ? (
              <span className="text-white leading-relaxed">{fullText}</span>
            ) : (
              <span className="text-gray-600">Your words will appear here as you speak...</span>
            )}
          </div>

          {fullText && !isListening && !isBuilding && (
            <button
              onClick={handleBuild}
              className="mt-3 w-full bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold py-3 rounded-xl transition-colors"
            >
              Build Now
            </button>
          )}

          {transcript && (
            <button
              onClick={() => { setTranscript(''); setInterimTranscript('') }}
              className="mt-2 w-full border border-white/10 hover:border-white/20 text-gray-400 hover:text-white text-sm py-2 rounded-xl transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggestions */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Try saying...</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="text-xs bg-[#111640] border border-white/10 hover:border-[#FFB81C]/30 text-gray-400 hover:text-[#FFB81C] px-3 py-1.5 rounded-lg transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Command history */}
        <div className="px-6 pb-6 flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">History</p>
          {commands.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">No commands yet</p>
          ) : (
            <div className="space-y-2">
              {commands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="bg-[#111640] border border-white/10 rounded-xl p-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white leading-snug flex-1">{cmd.text}</p>
                    <button
                      onClick={() => handleUndo(cmd.id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      Undo
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-600">
                      {cmd.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-[#FFB81C]">⚡ {cmd.tokensUsed}</span>
                    <span className={`text-xs ${cmd.status === 'done' ? 'text-green-400' : 'text-red-400'}`}>
                      {cmd.status === 'done' ? '✓ Built' : '✗ Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: 3D preview */}
      <div className="flex-1 bg-[#080B1E] flex flex-col">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-400">3D Preview</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500">Studio — connecting...</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            {isBuilding ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/30 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-[#FFB81C] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-2">Building your world...</p>
                <p className="text-gray-400 text-sm">AI is generating terrain, placing assets, and writing scripts</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-[#FFB81C] font-bold text-lg">⚡ {tokenCost}</span>
                  <span className="text-gray-500 text-sm">tokens</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6 opacity-20">🎮</div>
                <p className="text-gray-500 font-medium mb-2">
                  {commands.length > 0
                    ? 'Last build complete. Speak to continue building.'
                    : 'Your 3D world appears here'}
                </p>
                <p className="text-gray-600 text-sm">
                  Connect Roblox Studio to see live previews
                </p>
                <div className="mt-6">
                  <a
                    href="#"
                    className="text-sm text-[#FFB81C] hover:underline"
                  >
                    Install Studio plugin →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes waveBar {
          from { transform: scaleY(0.5); }
          to { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  )
}
