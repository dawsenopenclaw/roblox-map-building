'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowCard } from '@/components/ui/glow-card'
import { AnimatedCard } from '@/components/ui/animated-card'

// ─── Types ────────────────────────────────────────────────────────────────────

type Biome = 'auto' | 'forest' | 'desert' | 'arctic' | 'volcanic' | 'tropical'
type Scale = 'small' | 'medium' | 'large' | 'massive'
type Detail = 'low' | 'medium' | 'high' | 'ultra'
type Phase = 'idle' | 'uploading' | 'generating' | 'done'

interface GenerationOptions {
  biome: Biome
  scale: Scale
  detail: Detail
}

interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done'
  durationMs: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BIOME_OPTIONS: { value: Biome; label: string; icon: string; desc: string }[] = [
  { value: 'auto',     label: 'Auto Detect', icon: '🤖', desc: 'AI picks the best biome from your image' },
  { value: 'forest',   label: 'Forest',      icon: '🌲', desc: 'Dense trees, mossy terrain, rivers' },
  { value: 'desert',   label: 'Desert',      icon: '🏜️', desc: 'Sand dunes, rocky formations, cacti' },
  { value: 'arctic',   label: 'Arctic',      icon: '❄️', desc: 'Snow, ice, frozen lakes' },
  { value: 'volcanic', label: 'Volcanic',    icon: '🌋', desc: 'Lava flows, ash terrain, craters' },
  { value: 'tropical', label: 'Tropical',    icon: '🏝️', desc: 'Sandy beaches, palm trees, coral' },
]

const SCALE_OPTIONS: { value: Scale; label: string; studs: string }[] = [
  { value: 'small',   label: 'Small',   studs: '512 × 512 studs' },
  { value: 'medium',  label: 'Medium',  studs: '1024 × 1024 studs' },
  { value: 'large',   label: 'Large',   studs: '2048 × 2048 studs' },
  { value: 'massive', label: 'Massive', studs: '4096 × 4096 studs' },
]

const DETAIL_OPTIONS: { value: Detail; label: string; badge?: string }[] = [
  { value: 'low',    label: 'Low',    },
  { value: 'medium', label: 'Medium', },
  { value: 'high',   label: 'High',   },
  { value: 'ultra',  label: 'Ultra',  badge: 'PRO' },
]

const GENERATION_STEPS: GenerationStep[] = [
  { id: 'analyze',  label: 'Analyzing image composition',        status: 'pending', durationMs: 900 },
  { id: 'terrain',  label: 'Generating heightmap terrain',       status: 'pending', durationMs: 1200 },
  { id: 'biome',    label: 'Applying biome materials & foliage', status: 'pending', durationMs: 1000 },
  { id: 'assets',   label: 'Placing marketplace assets',         status: 'pending', durationMs: 800 },
  { id: 'lighting', label: 'Configuring lighting & atmosphere',  status: 'pending', durationMs: 600 },
  { id: 'export',   label: 'Packaging Roblox-ready output',      status: 'pending', durationMs: 500 },
]

const RESULT_STATS = [
  { label: 'Terrain Parts',   value: '14,832', icon: '🏔️' },
  { label: 'Assets Placed',   value: '3,241',  icon: '🌲' },
  { label: 'Biome Match',     value: '94%',    icon: '🎯' },
  { label: 'Est. Build Time', value: '~4 min', icon: '⏱️' },
]

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  preview,
  disabled,
}: {
  onFile: (file: File) => void
  preview: string | null
  disabled: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) onFile(file)
    },
    [onFile],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      aria-label="Upload image zone"
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer select-none
        ${dragging
          ? 'border-[#FFB81C] bg-[#FFB81C]/8 shadow-[0_0_30px_rgba(255,184,28,0.15)]'
          : preview
          ? 'border-[#FFB81C]/30 bg-transparent'
          : 'border-white/15 bg-[#0A0C18] hover:border-[#FFB81C]/40 hover:bg-[#FFB81C]/4'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{ minHeight: 220 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
      />

      {preview ? (
        /* Preview image */
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded image preview"
            className="w-full object-cover rounded-xl"
            style={{ maxHeight: 280 }}
          />
          {/* Overlay badge */}
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="px-4 py-2 rounded-lg bg-[#0a0a0a]/80 border border-white/20 text-sm text-white font-medium backdrop-blur-sm">
                Click to change image
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Upload prompt */
        <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
          <motion.div
            animate={dragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-14 h-14 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center"
          >
            <svg className="w-7 h-7 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </motion.div>
          <div>
            <p className="text-white font-semibold text-sm">
              {dragging ? 'Drop it!' : 'Drag & drop your image'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              or <span className="text-[#FFB81C]">click to browse</span> — JPG, PNG, WebP, GIF
            </p>
          </div>
          <p className="text-gray-700 text-xs">
            Reference photos, concept art, maps, and screenshots all work great
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Generation Progress ──────────────────────────────────────────────────────

function GenerationProgress({ steps }: { steps: GenerationStep[] }) {
  const doneCount = steps.filter((s) => s.status === 'done').length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">Generating map...</span>
          <span className="text-[#FFB81C] font-bold tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFB81C] rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.status === 'done' ? (
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : step.status === 'running' ? (
              <span className="w-5 h-5 rounded-full border border-[#FFB81C]/40 flex items-center justify-center flex-shrink-0">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.0 }}
                  className="w-2 h-2 rounded-full bg-[#FFB81C]"
                />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0" />
            )}
            <span className={`text-sm transition-colors ${
              step.status === 'done' ? 'text-gray-400 line-through' :
              step.status === 'running' ? 'text-white' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Result Preview ───────────────────────────────────────────────────────────

function ResultPreview({ inputImage }: { inputImage: string | null }) {
  return (
    <div className="space-y-4">
      {/* Before / After */}
      <div className="grid grid-cols-2 gap-3">
        {/* Input */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Your Image</p>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-[#080B16]" style={{ minHeight: 140 }}>
            {inputImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={inputImage} alt="Input" className="w-full h-full object-cover" style={{ maxHeight: 180 }} />
            ) : (
              <div className="h-36 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            )}
          </div>
        </div>

        {/* Generated map placeholder */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Generated Map</p>
          <div
            className="rounded-xl overflow-hidden border border-[#FFB81C]/20 bg-[#080B16] relative"
            style={{ minHeight: 140 }}
          >
            {/* Procedural terrain grid placeholder */}
            <svg className="absolute inset-0 w-full h-full opacity-30" aria-hidden="true">
              <defs>
                <pattern id="terrain-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#FFB81C" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#terrain-grid)" />
            </svg>

            {/* Simulated terrain blobs */}
            <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
              <ellipse cx="35%" cy="40%" rx="28%" ry="22%" fill="rgba(34,197,94,0.15)" />
              <ellipse cx="65%" cy="55%" rx="22%" ry="18%" fill="rgba(34,197,94,0.1)" />
              <ellipse cx="50%" cy="70%" rx="35%" ry="12%" fill="rgba(16,185,129,0.08)" />
              <circle cx="70%" cy="30%" r="8%" fill="rgba(255,184,28,0.12)" />
              <ellipse cx="20%" cy="60%" rx="15%" ry="10%" fill="rgba(59,130,246,0.15)" />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl">🗺️</span>
                <p className="text-xs text-[#FFB81C] font-semibold mt-1">Roblox-Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {RESULT_STATS.map((stat, i) => (
          <AnimatedCard
            key={stat.label}
            index={i}
            className="bg-[#141414] border border-white/8 rounded-xl p-3 text-center space-y-1"
          >
            <span className="text-base">{stat.icon}</span>
            <p className="text-[#FFB81C] font-bold text-base">{stat.value}</p>
            <p className="text-gray-400 text-xs">{stat.label}</p>
          </AnimatedCard>
        ))}
      </div>
    </div>
  )
}

// ─── Options Panel ────────────────────────────────────────────────────────────

function OptionsPanel({
  options,
  onChange,
  disabled,
}: {
  options: GenerationOptions
  onChange: (o: GenerationOptions) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-5">
      {/* Biome */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Biome Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BIOME_OPTIONS.map((b) => (
            <button
              key={b.value}
              disabled={disabled}
              onClick={() => onChange({ ...options, biome: b.value })}
              title={b.desc}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all text-xs disabled:opacity-40
                ${options.biome === b.value
                  ? 'border-[#FFB81C]/50 bg-[#FFB81C]/8 text-white shadow-[0_0_12px_rgba(255,184,28,0.1)]'
                  : 'border-white/8 bg-[#0A0C18] text-gray-300 hover:border-white/15 hover:text-gray-200'
                }`}
            >
              <span className="text-base flex-shrink-0">{b.icon}</span>
              <span className="font-medium">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Scale */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Map Scale</label>
          <div className="grid grid-cols-2 gap-1.5">
            {SCALE_OPTIONS.map((s) => (
              <button
                key={s.value}
                disabled={disabled}
                onClick={() => onChange({ ...options, scale: s.value })}
                className={`px-3 py-2 rounded-lg border text-xs transition-all disabled:opacity-40 text-left
                  ${options.scale === s.value
                    ? 'border-[#FFB81C]/40 bg-[#FFB81C]/8 text-white'
                    : 'border-white/8 bg-[#0A0C18] text-gray-400 hover:border-white/15 hover:text-gray-300'
                  }`}
              >
                <p className="font-semibold">{s.label}</p>
                <p className="text-gray-500 text-[10px]">{s.studs}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Detail Level</label>
          <div className="grid grid-cols-2 gap-1.5">
            {DETAIL_OPTIONS.map((d) => (
              <button
                key={d.value}
                disabled={disabled || d.value === 'ultra'}
                onClick={() => onChange({ ...options, detail: d.value })}
                className={`px-3 py-2 rounded-lg border text-xs transition-all disabled:opacity-40 relative text-left
                  ${options.detail === d.value
                    ? 'border-[#FFB81C]/40 bg-[#FFB81C]/8 text-white'
                    : 'border-white/8 bg-[#0A0C18] text-gray-400 hover:border-white/15 hover:text-gray-300'
                  }`}
              >
                <p className="font-semibold">{d.label}</p>
                {d.badge && (
                  <span className="absolute top-1 right-1.5 text-[9px] font-bold text-[#FFB81C] bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded px-1 py-0.5">
                    {d.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ImageToMapPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [steps, setSteps] = useState<GenerationStep[]>(GENERATION_STEPS)
  const [options, setOptions] = useState<GenerationOptions>({
    biome: 'auto',
    scale: 'medium',
    detail: 'high',
  })

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setPhase('idle')
    setSteps(GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' })))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!file || phase === 'generating') return

    setPhase('generating')
    const freshSteps = GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' as const }))
    setSteps(freshSteps)

    for (let i = 0; i < freshSteps.length; i++) {
      // Mark current as running
      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s))
      await new Promise((res) => setTimeout(res, freshSteps[i].durationMs))
      // Mark done
      setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s))
    }

    setPhase('done')
  }, [file, phase])

  const reset = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPhase('idle')
    setSteps(GENERATION_STEPS.map((s) => ({ ...s, status: 'pending' })))
  }

  const isGenerating = phase === 'generating'
  const isDone = phase === 'done'

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* ── Header ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#FFB81C]/70 uppercase tracking-widest">AI Feature</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-gray-400">Image to Map</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Turn Any Image Into a{' '}
          <span className="text-[#FFB81C] drop-shadow-[0_0_20px_rgba(255,184,28,0.4)]">
            Roblox Map
          </span>
        </h1>
        <p className="text-gray-300 text-base max-w-xl leading-relaxed">
          Upload a photo, concept sketch, or reference image. Our AI converts it into a
          fully playable Roblox terrain in under 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left column: Upload + Options ── */}
        <div className="lg:col-span-3 space-y-5">
          <GlowCard className="bg-[#141414] border border-white/8 p-5 space-y-5">
            <UploadZone
              onFile={handleFile}
              preview={preview}
              disabled={isGenerating}
            />

            {/* Options */}
            <AnimatePresence>
              {(file || isDone) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1 border-t border-white/8">
                    <OptionsPanel
                      options={options}
                      onChange={setOptions}
                      disabled={isGenerating}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlowCard>

          {/* Action buttons */}
          <div className="flex gap-3">
            {isDone ? (
              <>
                <a
                  href="/editor"
                  className="flex-1 h-11 rounded-xl bg-[#FFB81C] hover:bg-[#D4AF37] text-[#0a0a0a] text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,184,28,0.25)]"
                >
                  Open in Editor
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <button
                  onClick={reset}
                  className="h-11 px-5 rounded-xl border border-white/15 text-gray-300 hover:border-white/25 hover:text-white text-sm font-medium transition-colors"
                >
                  New Map
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!file || isGenerating}
                className="flex-1 h-11 rounded-xl bg-[#FFB81C] hover:bg-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed text-[#0a0a0a] text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,184,28,0.2)]"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Map
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Right column: Progress / Result / Tips ── */}
        <div className="lg:col-span-2 space-y-5">
          <AnimatePresence mode="wait">
            {phase === 'idle' && !file && (
              <motion.div
                key="tips"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tips for best results</p>
                {[
                  { icon: '🌅', tip: 'Aerial or top-down shots generate more accurate terrain' },
                  { icon: '🎨', tip: 'High contrast images produce better biome detection' },
                  { icon: '🗺️', tip: 'Concept maps and sketches work just as well as photos' },
                  { icon: '📐', tip: 'Landscape orientation (16:9) generates the fullest map' },
                ].map((item, i) => (
                  <AnimatedCard
                    key={item.tip}
                    index={i}
                    className="flex items-start gap-3 bg-[#141414] border border-white/8 rounded-xl p-3.5"
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.tip}</p>
                  </AnimatedCard>
                ))}
              </motion.div>
            )}

            {phase === 'idle' && file && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#141414] border border-white/8 rounded-2xl p-5 space-y-4"
              >
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Ready to generate</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>File</span>
                    <span className="text-white font-medium truncate max-w-[150px]">{file.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Size</span>
                    <span className="text-white font-medium">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Biome</span>
                    <span className="text-[#FFB81C] font-medium capitalize">{options.biome === 'auto' ? 'Auto detect' : options.biome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scale</span>
                    <span className="text-white font-medium capitalize">{options.scale}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Detail</span>
                    <span className="text-white font-medium capitalize">{options.detail}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/8">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-[#FFB81C]">⚡</span>
                    <span>Est. cost: <span className="text-[#FFB81C] font-semibold">~45 tokens</span></span>
                  </div>
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#141414] border border-white/8 rounded-2xl p-5"
              >
                <GenerationProgress steps={steps} />
              </motion.div>
            )}

            {isDone && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Success banner */}
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-emerald-300 font-medium">Map generated successfully!</span>
                </div>
                <ResultPreview inputImage={preview} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Feature strip at bottom ── */}
      {phase === 'idle' && !file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
        >
          {[
            { icon: '⚡', title: 'Under 60 Seconds', desc: 'From image to playable Roblox terrain faster than any manual workflow.' },
            { icon: '🎯', title: '94% Biome Accuracy', desc: 'Claude Vision identifies biome type, elevation, and foliage density automatically.' },
            { icon: '📦', title: 'Marketplace Ready', desc: 'Assets are sourced from the Roblox marketplace and placed at correct scale.' },
          ].map((feat, i) => (
            <AnimatedCard
              key={feat.title}
              index={i}
              className="bg-[#141414] border border-white/8 rounded-xl p-5 space-y-3"
            >
              <span className="text-2xl">{feat.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{feat.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{feat.desc}</p>
              </div>
            </AnimatedCard>
          ))}
        </motion.div>
      )}
    </div>
  )
}
