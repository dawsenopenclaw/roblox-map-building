'use client'
import { useState, useCallback, useRef } from 'react'

type ProcessingStep = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'placing' | 'done' | 'error'

const PROCESSING_STEPS: { key: ProcessingStep; label: string; description: string }[] = [
  { key: 'analyzing', label: 'Analyzing', description: 'Reading colors, shapes, and structures' },
  { key: 'generating', label: 'Generating', description: 'Creating terrain and asset list' },
  { key: 'placing', label: 'Placing', description: 'Assembling map in Roblox format' },
]

const FEEDBACK_OPTIONS = [
  'Make it bigger',
  'Add more trees',
  'Different style',
  'Add water',
  'More detail',
  'Simplify it',
]

function StepIndicator({ current }: { current: ProcessingStep }) {
  const steps: ProcessingStep[] = ['analyzing', 'generating', 'placing']
  const idx = steps.indexOf(current)

  return (
    <div className="flex items-center gap-4">
      {PROCESSING_STEPS.map((step, i) => {
        const done = idx > i
        const active = idx === i
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              done
                ? 'bg-green-500/20 border border-green-500 text-green-400'
                : active
                ? 'bg-[#FFB81C]/20 border border-[#FFB81C] text-[#FFB81C]'
                : 'bg-white/5 border border-white/20 text-gray-500'
            }`}>
              {done ? '✓' : i + 1}
            </div>
            <div className="hidden sm:block">
              <p className={`text-sm font-medium ${active ? 'text-white' : done ? 'text-green-400' : 'text-gray-500'}`}>
                {step.label}
              </p>
              {active && (
                <p className="text-xs text-gray-500">{step.description}</p>
              )}
            </div>
            {i < PROCESSING_STEPS.length - 1 && (
              <div className={`hidden sm:block w-8 h-px ml-2 ${done ? 'bg-green-500/50' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ImageToMapPage() {
  const [step, setStep] = useState<ProcessingStep>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [tokenCost, setTokenCost] = useState(0)
  const [feedbackHistory, setFeedbackHistory] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.')
      return
    }

    // Preview
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setStep('uploading')

    // Simulate AI processing pipeline
    // Real implementation calls /api/image-to-map in Phase 5
    const steps: ProcessingStep[] = ['analyzing', 'generating', 'placing']
    for (const s of steps) {
      setStep(s)
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800))
      setTokenCost(c => c + Math.floor(Math.random() * 80 + 40))
    }
    setStep('done')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFeedback = useCallback(async (option: string) => {
    setFeedbackHistory(prev => [...prev, option])
    setStep('analyzing')
    const steps: ProcessingStep[] = ['analyzing', 'generating', 'placing']
    for (const s of steps) {
      setStep(s)
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500))
      setTokenCost(c => c + Math.floor(Math.random() * 40 + 20))
    }
    setStep('done')
  }, [])

  const handleReset = () => {
    setStep('idle')
    setImageUrl(null)
    setTokenCost(0)
    setFeedbackHistory([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isProcessing = ['uploading', 'analyzing', 'generating', 'placing'].includes(step)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <span>🗺️</span> Image to Map
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Upload any image and watch AI convert it into a Roblox map.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload + Image */}
        <div className="space-y-4">
          {/* Upload area */}
          {step === 'idle' ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[#FFB81C] bg-[#FFB81C]/5'
                  : 'border-white/20 hover:border-white/40 bg-[#0D1231]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="text-5xl mb-4">🖼️</div>
              <p className="text-white font-semibold mb-2">Drop your image here</p>
              <p className="text-gray-400 text-sm mb-4">or click to browse</p>
              <p className="text-gray-600 text-xs">
                PNG, JPG, WebP — Max 10MB
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Screenshot', 'Concept art', 'Real photo', 'Hand drawing'].map(hint => (
                  <span key={hint} className="text-xs bg-white/5 text-gray-500 px-3 py-1 rounded-full border border-white/10">
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative">
              {imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0D1231]">
                  <img
                    src={imageUrl}
                    alt="Uploaded reference"
                    className={`w-full h-64 object-cover ${isProcessing ? 'opacity-60' : ''} transition-opacity`}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-[#0A0E27]/80 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
                        <svg className="w-8 h-8 text-[#FFB81C] animate-spin mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-white text-sm font-medium capitalize">{step}...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleReset}
                className="mt-2 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                ✕ Remove image
              </button>
            </div>
          )}

          {/* Processing steps */}
          {isProcessing && (
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-medium text-white mb-4">Processing...</p>
              <StepIndicator current={step} />
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[#FFB81C] text-sm font-bold">⚡ {tokenCost}</span>
                <span className="text-gray-500 text-sm">tokens used so far</span>
              </div>
            </div>
          )}

          {/* Token summary */}
          {step === 'done' && (
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total cost</p>
                  <p className="text-2xl font-bold text-[#FFB81C]">⚡ {tokenCost} tokens</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Time saved</p>
                  <p className="text-sm font-semibold text-green-400">~4 hours</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Result preview + feedback */}
        <div className="space-y-4">
          {/* Result preview */}
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Map Preview</p>
              {step === 'done' && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              )}
            </div>

            <div className="h-72 flex items-center justify-center">
              {step === 'done' ? (
                <div className="text-center p-6">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-white font-semibold mb-2">Map generated!</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Connect Roblox Studio to preview and deploy
                  </p>
                  <button className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                    Send to Studio
                  </button>
                </div>
              ) : isProcessing ? (
                <div className="text-center p-6">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-[#FFB81C] border-t-transparent animate-spin" />
                    <div className="absolute inset-3 rounded-full bg-[#FFB81C]/10 flex items-center justify-center">
                      <span className="text-lg">✨</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Generating map layout...</p>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="text-5xl mb-4 opacity-20">🗺️</div>
                  <p className="text-gray-500 text-sm">
                    Upload an image to generate a map
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          {step === 'done' && (
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <p className="text-sm font-medium text-white mb-3">
                Refine the result
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {FEEDBACK_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => handleFeedback(option)}
                    className="text-sm bg-[#111640] border border-white/10 hover:border-[#FFB81C]/30 text-gray-300 hover:text-[#FFB81C] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>

              {feedbackHistory.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Applied:</p>
                  <div className="flex flex-wrap gap-1">
                    {feedbackHistory.map((fb, i) => (
                      <span key={i} className="text-xs bg-[#FFB81C]/10 text-[#FFB81C] px-2 py-0.5 rounded-full">
                        {fb}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
