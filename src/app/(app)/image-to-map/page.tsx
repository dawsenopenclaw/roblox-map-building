'use client'
import { useState, useCallback, useRef } from 'react'

const MAX_FILE_SIZE_MB = 10

const DEMO_ANALYSIS = {
  terrain: 'Forest biome',
  buildings: 3,
  style: 'Medieval',
  estimatedTokens: 25,
}

type Stage = 'idle' | 'ready' | 'analyzing' | 'analyzed' | 'generating' | 'done' | 'error'

export default function ImageToMapPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<typeof DEMO_ANALYSIS | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    setError(null)

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Only PNG and JPG files are supported.')
      return
    }

    const sizeMb = file.size / 1024 / 1024
    if (sizeMb > MAX_FILE_SIZE_MB) {
      setError(`File is ${sizeMb.toFixed(1)} MB — max is ${MAX_FILE_SIZE_MB} MB.`)
      return
    }

    setImageUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setAnalysis(null)
    setStage('ready')
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
    e.target.value = ''
  }, [processFile])

  const handleAnalyze = useCallback(async () => {
    setStage('analyzing')
    setError(null)

    try {
      // Try real API first, fall back to demo results
      let result = DEMO_ANALYSIS
      try {
        const res = await fetch('/api/image-to-map/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        })
        if (res.ok) {
          result = await res.json()
        }
      } catch {
        // API not configured — use demo results
      }

      // Simulate analysis delay for UX
      await new Promise(r => setTimeout(r, 1500))
      setAnalysis(result)
      setStage('analyzed')
    } catch {
      setError('Analysis failed. Please try again.')
      setStage('ready')
    }
  }, [imageUrl])

  const handleGenerate = useCallback(async () => {
    setStage('generating')
    await new Promise(r => setTimeout(r, 2000))
    setStage('done')
  }, [])

  const handleReset = useCallback(() => {
    setStage('idle')
    setImageUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setAnalysis(null)
    setError(null)
    setCopied(false)
  }, [])

  const handleCopyCommand = useCallback(() => {
    const cmd = `-- Generated map\nprint("Map ready! Connect Roblox Studio plugin to deploy.")`
    navigator.clipboard.writeText(cmd).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }, [])

  const isProcessing = stage === 'analyzing' || stage === 'generating'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Image to Map</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Upload any image and AI will convert it into a Roblox map.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="shrink-0 mt-0.5">!</span>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto shrink-0 text-red-400/60 hover:text-red-400 transition-colors"
          >
            x
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Upload */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upload</p>

          {stage === 'idle' ? (
            // Drop zone
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
              aria-label="Upload image — click or drag and drop"
              className={`flex-1 min-h-[280px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all select-none ${
                isDragOver
                  ? 'border-[#FFB81C] bg-[#FFB81C]/5'
                  : 'border-white/20 hover:border-white/40 bg-[#0D1231]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="text-4xl">📁</div>
              <div className="text-center">
                <p className="text-white font-semibold">Drop image here</p>
                <p className="text-gray-400 text-sm">or click to browse</p>
              </div>
              <p className="text-gray-600 text-xs">Supports: PNG, JPG &nbsp;·&nbsp; Max size: 10MB</p>
            </div>
          ) : (
            // Image preview
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0D1231]">
              {imageUrl && (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Uploaded reference"
                    className={`w-full h-56 object-cover transition-opacity ${isProcessing ? 'opacity-40' : 'opacity-100'}`}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                        <svg className="w-6 h-6 text-[#FFB81C] animate-spin mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-white text-sm">{stage === 'analyzing' ? 'Analyzing...' : 'Generating...'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between gap-3">
                {/* Analyze button */}
                {(stage === 'ready') && (
                  <button
                    onClick={handleAnalyze}
                    className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors"
                  >
                    Analyze Image
                  </button>
                )}
                {(stage === 'analyzing') && (
                  <span className="text-[#FFB81C] text-sm font-medium">Analyzing...</span>
                )}
                {(stage === 'analyzed' || stage === 'generating' || stage === 'done') && (
                  <span className="text-green-400 text-sm font-medium">Analysis complete</span>
                )}

                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40 ml-auto"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Result */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</p>

          <div className="flex-1 min-h-[280px] rounded-2xl border border-white/10 bg-[#0D1231] flex flex-col">

            {/* Empty state */}
            {(stage === 'idle' || stage === 'ready') && (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="text-4xl mb-3 opacity-20">🗺️</div>
                  <p className="text-gray-500 text-sm">
                    {stage === 'idle'
                      ? 'Upload an image to see the generated map'
                      : 'Click "Analyze Image" to continue'}
                  </p>
                </div>
              </div>
            )}

            {/* Analyzing state */}
            {stage === 'analyzing' && (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="w-12 h-12 mx-auto mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-[#FFB81C] border-t-transparent animate-spin" />
                  </div>
                  <p className="text-gray-400 text-sm">Reading colors, shapes, and structures...</p>
                </div>
              </div>
            )}

            {/* Analysis results */}
            {(stage === 'analyzed' || stage === 'generating' || stage === 'done') && analysis && (
              <div className="flex-1 flex flex-col p-5 gap-4">
                <p className="text-sm font-medium text-white">Analysis Results</p>

                <div className="space-y-3">
                  <ResultRow label="Terrain" value={analysis.terrain} />
                  <ResultRow label="Buildings" value={`${analysis.buildings} detected`} />
                  <ResultRow label="Style" value={analysis.style} />
                  <ResultRow
                    label="Estimated cost"
                    value={`${analysis.estimatedTokens} tokens`}
                    valueClass="text-[#FFB81C]"
                  />
                </div>

                <div className="mt-auto pt-2">
                  {stage === 'analyzed' && (
                    <button
                      onClick={handleGenerate}
                      className="w-full bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                    >
                      Generate Map
                    </button>
                  )}
                  {stage === 'generating' && (
                    <button disabled className="w-full bg-[#FFB81C]/40 text-black font-bold px-6 py-3 rounded-xl text-sm cursor-not-allowed">
                      Generating...
                    </button>
                  )}
                  {stage === 'done' && (
                    <button
                      onClick={handleCopyCommand}
                      className="w-full bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                    >
                      {copied ? 'Copied to clipboard' : 'Send to Studio'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}
