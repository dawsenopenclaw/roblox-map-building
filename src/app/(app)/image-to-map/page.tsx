'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowCard } from '@/components/ui/glow-card'
import { AnimatedCard } from '@/components/ui/animated-card'

// ─── Types ────────────────────────────────────────────────────────────────────

type Biome = 'auto' | 'forest' | 'desert' | 'arctic' | 'volcanic' | 'tropical'
type Scale = 'small' | 'medium' | 'large' | 'massive'
type Detail = 'low' | 'medium' | 'high' | 'ultra'
type Phase = 'idle' | 'analyzing' | 'generating' | 'done' | 'error'
type Mode = 'generate' | 'style-transfer'

interface GenerationOptions {
  biome: Biome
  scale: Scale
  detail: Detail
  mode: Mode
  userPrompt: string
}

interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
}

interface ImageAnalysisResult {
  theme: string
  style: string
  colors: string[]
  materials: string[]
  objects: string[]
  lighting: string
  scale: 'small' | 'medium' | 'large' | 'massive'
  summary: string
  sourceGame?: string
  confidence: number
}

interface GenerationResult {
  success: boolean
  message: string
  tokensUsed: number
  data?: Record<string, unknown>
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BIOME_OPTIONS: { value: Biome; label: string; icon: string; desc: string }[] = [
  { value: 'auto',     label: 'Auto Detect', icon: '🤖', desc: 'AI picks from your image' },
  { value: 'forest',   label: 'Forest',      icon: '🌲', desc: 'Dense trees, rivers' },
  { value: 'desert',   label: 'Desert',      icon: '🏜️', desc: 'Sand, rocky formations' },
  { value: 'arctic',   label: 'Arctic',      icon: '❄️', desc: 'Snow, ice, frozen lakes' },
  { value: 'volcanic', label: 'Volcanic',    icon: '🌋', desc: 'Lava flows, craters' },
  { value: 'tropical', label: 'Tropical',    icon: '🏝️', desc: 'Beaches, palm trees' },
]

const SCALE_OPTIONS: { value: Scale; label: string; studs: string }[] = [
  { value: 'small',   label: 'Small',   studs: '512 × 512 studs' },
  { value: 'medium',  label: 'Medium',  studs: '1024 × 1024 studs' },
  { value: 'large',   label: 'Large',   studs: '2048 × 2048 studs' },
  { value: 'massive', label: 'Massive', studs: '4096 × 4096 studs' },
]

const DETAIL_OPTIONS: { value: Detail; label: string; badge?: string }[] = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'ultra',  label: 'Ultra', badge: 'PRO' },
]

const GENERATION_STEPS_GENERATE: GenerationStep[] = [
  { id: 'upload',    label: 'Reading image',                    status: 'pending' },
  { id: 'gemini',    label: 'Gemini Vision — analyzing scene',  status: 'pending' },
  { id: 'terrain',   label: 'Generating terrain layout',        status: 'pending' },
  { id: 'biome',     label: 'Applying biome materials',         status: 'pending' },
  { id: 'assets',    label: 'Placing marketplace assets',       status: 'pending' },
  { id: 'lighting',  label: 'Configuring lighting',             status: 'pending' },
  { id: 'export',    label: 'Packaging Roblox-ready output',    status: 'pending' },
]

const GENERATION_STEPS_STYLE: GenerationStep[] = [
  { id: 'upload',    label: 'Reading reference screenshot',     status: 'pending' },
  { id: 'gemini',    label: 'Gemini Vision — extracting style', status: 'pending' },
  { id: 'style',     label: 'Parsing color palette',           status: 'pending' },
  { id: 'build',     label: 'Building in extracted style',      status: 'pending' },
  { id: 'export',    label: 'Packaging Roblox-ready output',    status: 'pending' },
]

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile,
  preview,
  disabled,
  mode,
}: {
  onFile: (file: File) => void
  preview: string | null
  disabled: boolean
  mode: Mode
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

  const placeholder = mode === 'style-transfer'
    ? 'Drop a game screenshot to extract its style'
    : 'Drag & drop your reference image'

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
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Uploaded image preview"
            className="w-full object-cover rounded-xl"
            style={{ maxHeight: 280 }}
          />
          {!disabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="px-4 py-2 rounded-lg bg-[#0a0a0a]/80 border border-white/20 text-sm text-white font-medium backdrop-blur-sm">
                Click to change image
              </span>
            </div>
          )}
        </div>
      ) : (
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
              {dragging ? 'Drop it!' : placeholder}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              or <span className="text-[#FFB81C]">click to browse</span> — JPG, PNG, WebP, GIF
            </p>
          </div>
          <p className="text-gray-700 text-xs">
            {mode === 'style-transfer'
              ? 'Screenshots of Adopt Me, Blox Fruits, and similar games work great'
              : 'Reference photos, concept art, maps, and screenshots all work great'}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────

function AnalysisPanel({ analysis }: { analysis: ImageAnalysisResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0C18] border border-[#FFB81C]/20 rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">
          Gemini Vision Analysis
        </span>
        <span className="ml-auto text-[10px] text-gray-500">
          {Math.round(analysis.confidence * 100)}% confidence
        </span>
      </div>

      {/* Detected badge */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 rounded-md bg-[#FFB81C]/10 border border-[#FFB81C]/20 text-[#FFB81C] text-xs font-medium">
          {analysis.theme}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs">
          {analysis.style}
        </span>
        {analysis.sourceGame && (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
            {analysis.sourceGame}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs">
          {analysis.lighting}
        </span>
      </div>

      {/* Summary */}
      <p className="text-xs text-gray-300 leading-relaxed">{analysis.summary}</p>

      {/* Objects */}
      {analysis.objects.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Objects Detected</p>
          <div className="flex flex-wrap gap-1">
            {analysis.objects.slice(0, 10).map((obj) => (
              <span key={obj} className="px-1.5 py-0.5 bg-white/4 rounded text-[10px] text-gray-400 border border-white/6">
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Colors + Materials row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Color swatches */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Palette</p>
          <div className="flex gap-1">
            {analysis.colors.slice(0, 6).map((hex) => (
              <div
                key={hex}
                className="w-5 h-5 rounded-sm border border-white/10 flex-shrink-0"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
        {/* Materials */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Materials</p>
          <div className="flex flex-wrap gap-1">
            {analysis.materials.slice(0, 4).map((m) => (
              <span key={m} className="text-[10px] text-gray-400 bg-white/4 rounded px-1 py-0.5 border border-white/6">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Generation Progress ──────────────────────────────────────────────────────

function GenerationProgress({ steps, phase }: { steps: GenerationStep[]; phase: Phase }) {
  const doneCount = steps.filter((s) => s.status === 'done').length
  const pct = Math.round((doneCount / steps.length) * 100)
  const label = phase === 'analyzing' ? 'Analyzing with Gemini...' : 'Generating map...'

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-medium">{label}</span>
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

      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3">
            {step.status === 'done' ? (
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : step.status === 'error' ? (
              <span className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
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
              step.status === 'error' ? 'text-red-400' :
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

function ResultPreview({
  inputImage,
  analysis,
  result,
}: {
  inputImage: string | null
  analysis: ImageAnalysisResult | null
  result: GenerationResult | null
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
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

        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Generated Map</p>
          <div
            className="rounded-xl overflow-hidden border border-[#FFB81C]/20 bg-[#080B16] relative"
            style={{ minHeight: 140 }}
          >
            <svg className="absolute inset-0 w-full h-full opacity-30" aria-hidden="true">
              <defs>
                <pattern id="terrain-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#FFB81C" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#terrain-grid)" />
            </svg>
            <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
              {analysis?.colors?.slice(0, 3).map((hex, i) => (
                <ellipse
                  key={hex}
                  cx={`${25 + i * 25}%`}
                  cy={`${40 + i * 15}%`}
                  rx={`${20 + i * 5}%`}
                  ry={`${15 + i * 3}%`}
                  fill={hex}
                  opacity={0.15}
                />
              )) ?? (
                <>
                  <ellipse cx="35%" cy="40%" rx="28%" ry="22%" fill="rgba(34,197,94,0.15)" />
                  <ellipse cx="65%" cy="55%" rx="22%" ry="18%" fill="rgba(34,197,94,0.1)" />
                </>
              )}
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

      {/* Result message */}
      {result?.message && (
        <div className="bg-white/4 border border-white/8 rounded-xl p-3">
          <p className="text-xs text-gray-300 leading-relaxed">{result.message}</p>
          {result.tokensUsed > 0 && (
            <p className="text-[10px] text-gray-600 mt-1">{result.tokensUsed} tokens used</p>
          )}
        </div>
      )}

      {/* Stats */}
      {analysis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Theme',     value: analysis.theme.split(' ').slice(0, 2).join(' '), icon: '🎨' },
            { label: 'Style',     value: analysis.style,                                  icon: '✨' },
            { label: 'Objects',   value: `${analysis.objects.length} detected`,           icon: '🏗️' },
            { label: 'Materials', value: `${analysis.materials.length} matched`,          icon: '🧱' },
          ].map((stat, i) => (
            <AnimatedCard
              key={stat.label}
              index={i}
              className="bg-[#141414] border border-white/8 rounded-xl p-3 text-center space-y-1"
            >
              <span className="text-base">{stat.icon}</span>
              <p className="text-[#FFB81C] font-bold text-xs truncate">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </AnimatedCard>
          ))}
        </div>
      )}
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
      {/* Mode toggle */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'generate' as Mode, label: 'Generate Map', desc: 'Convert image into terrain' },
            { value: 'style-transfer' as Mode, label: 'Style Transfer', desc: 'Copy a game\'s visual style' },
          ].map((m) => (
            <button
              key={m.value}
              disabled={disabled}
              onClick={() => onChange({ ...options, mode: m.value })}
              className={`px-3 py-2.5 rounded-xl border text-left transition-all text-xs disabled:opacity-40
                ${options.mode === m.value
                  ? 'border-[#FFB81C]/50 bg-[#FFB81C]/8 text-white shadow-[0_0_12px_rgba(255,184,28,0.1)]'
                  : 'border-white/8 bg-[#0A0C18] text-gray-300 hover:border-white/15 hover:text-gray-200'
                }`}
            >
              <p className="font-semibold">{m.label}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Style transfer: user prompt */}
      {options.mode === 'style-transfer' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-widest">
            What to build in that style
          </label>
          <input
            type="text"
            value={options.userPrompt}
            onChange={(e) => onChange({ ...options, userPrompt: e.target.value })}
            disabled={disabled}
            placeholder='e.g. "a house", "a town square", "a shop"'
            className="w-full bg-[#0A0C18] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/40 transition-colors disabled:opacity-40"
          />
        </div>
      )}

      {/* Biome — shown in generate mode */}
      {options.mode === 'generate' && (
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
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // result is a data URI: data:<mimeType>;base64,<data>
      const [header, data] = result.split(',')
      const mimeType = header.replace('data:', '').replace(';base64', '')
      resolve({ base64: data, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function analyzeImage(file: File): Promise<ImageAnalysisResult> {
  const { base64, mimeType } = await fileToBase64(file)
  const res = await fetch('/api/ai/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mimeType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? `Analysis failed: ${res.status}`)
  }
  return res.json() as Promise<ImageAnalysisResult>
}

async function generateBuild(
  analysis: ImageAnalysisResult,
  options: GenerationOptions
): Promise<GenerationResult> {
  const buildType = options.mode === 'style-transfer' && options.userPrompt.trim()
    ? options.userPrompt.trim()
    : analysis.theme

  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: options.mode === 'style-transfer'
        ? `Build a ${buildType} in the exact visual style of the reference image. Style: ${analysis.style}. Colors: ${analysis.colors.slice(0, 4).join(', ')}. Materials: ${analysis.materials.join(', ')}. Lighting: ${analysis.lighting}.`
        : `Generate a ${options.biome === 'auto' ? analysis.theme : options.biome} map based on the reference image analysis: ${analysis.summary}. Scale: ${options.scale}. Detail: ${options.detail}. Include: ${analysis.objects.slice(0, 8).join(', ')}.`,
      imageAnalysis: analysis,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? `Generation failed: ${res.status}`)
  }
  const data = await res.json() as { result?: string; tokensUsed?: number }
  return {
    success: true,
    message: data.result ?? 'Build generated successfully.',
    tokensUsed: data.tokensUsed ?? 0,
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ImageToMapPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [steps, setSteps] = useState<GenerationStep[]>(GENERATION_STEPS_GENERATE)
  const [options, setOptions] = useState<GenerationOptions>({
    biome: 'auto',
    scale: 'medium',
    detail: 'high',
    mode: 'generate',
    userPrompt: '',
  })
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setPhase('idle')
    setAnalysis(null)
    setGenerationResult(null)
    setErrorMessage(null)
  }, [])

  const handleModeChange = useCallback((newOptions: GenerationOptions) => {
    setOptions(newOptions)
    const newSteps = newOptions.mode === 'style-transfer'
      ? GENERATION_STEPS_STYLE.map((s) => ({ ...s, status: 'pending' as const }))
      : GENERATION_STEPS_GENERATE.map((s) => ({ ...s, status: 'pending' as const }))
    setSteps(newSteps)
  }, [])

  const markStep = useCallback((id: string, status: GenerationStep['status']) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, status } : s))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!file || phase === 'analyzing' || phase === 'generating') return

    const baseSteps = options.mode === 'style-transfer'
      ? GENERATION_STEPS_STYLE
      : GENERATION_STEPS_GENERATE
    setSteps(baseSteps.map((s) => ({ ...s, status: 'pending' as const })))
    setAnalysis(null)
    setGenerationResult(null)
    setErrorMessage(null)

    try {
      // ── Phase 1: Gemini analysis ─────────────────────────────────────────
      setPhase('analyzing')
      markStep('upload', 'running')
      await new Promise((r) => setTimeout(r, 400)) // let UI render
      markStep('upload', 'done')

      markStep('gemini', 'running')
      let imageAnalysis: ImageAnalysisResult
      try {
        imageAnalysis = await analyzeImage(file)
        setAnalysis(imageAnalysis)
      } catch (err) {
        markStep('gemini', 'error')
        throw err
      }
      markStep('gemini', 'done')

      // Style-transfer extra step
      if (options.mode === 'style-transfer') {
        markStep('style', 'running')
        await new Promise((r) => setTimeout(r, 500))
        markStep('style', 'done')
      }

      // ── Phase 2: Build generation ────────────────────────────────────────
      setPhase('generating')
      const buildStepIds = options.mode === 'style-transfer'
        ? ['build']
        : ['terrain', 'biome', 'assets', 'lighting']

      for (const id of buildStepIds) {
        markStep(id, 'running')
        await new Promise((r) => setTimeout(r, 700 + Math.random() * 500))
        markStep(id, 'done')
      }

      // Actual API call
      markStep('export', 'running')
      const result = await generateBuild(imageAnalysis, options)
      setGenerationResult(result)
      markStep('export', 'done')

      setPhase('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
      setPhase('error')
    }
  }, [file, phase, options, markStep])

  const reset = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPhase('idle')
    setAnalysis(null)
    setGenerationResult(null)
    setErrorMessage(null)
    setSteps(GENERATION_STEPS_GENERATE.map((s) => ({ ...s, status: 'pending' })))
  }

  const isWorking = phase === 'analyzing' || phase === 'generating'
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
          Upload a reference image or game screenshot. Gemini Vision analyzes colors,
          materials, and style — then the AI generates matching Luau code for Roblox Studio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left column: Upload + Options ── */}
        <div className="lg:col-span-3 space-y-5">
          <GlowCard className="bg-[#141414] border border-white/8 p-5 space-y-5">
            <UploadZone
              onFile={handleFile}
              preview={preview}
              disabled={isWorking}
              mode={options.mode}
            />

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
                      onChange={handleModeChange}
                      disabled={isWorking}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlowCard>

          {/* Analysis panel — shown after Gemini responds */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AnalysisPanel analysis={analysis} />
              </motion.div>
            )}
          </AnimatePresence>

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
            ) : phase === 'error' ? (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={!file}
                  className="flex-1 h-11 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Retry
                </button>
                <button
                  onClick={reset}
                  className="h-11 px-5 rounded-xl border border-white/15 text-gray-300 hover:border-white/25 hover:text-white text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!file || isWorking}
                className="flex-1 h-11 rounded-xl bg-[#FFB81C] hover:bg-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed text-[#0a0a0a] text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,184,28,0.2)]"
              >
                {isWorking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                    {phase === 'analyzing' ? 'Analyzing...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    {options.mode === 'style-transfer' ? 'Transfer Style' : 'Generate Map'}
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
                  { icon: '🎮', tip: 'Game screenshots work great for style transfer — try Adopt Me or Blox Fruits' },
                  { icon: '🎨', tip: 'High contrast images produce better biome and color detection' },
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
                    <span>Mode</span>
                    <span className="text-[#FFB81C] font-medium capitalize">
                      {options.mode === 'style-transfer' ? 'Style Transfer' : 'Map Generate'}
                    </span>
                  </div>
                  {options.mode === 'generate' && (
                    <div className="flex items-center justify-between">
                      <span>Biome</span>
                      <span className="text-[#FFB81C] font-medium capitalize">
                        {options.biome === 'auto' ? 'Auto detect' : options.biome}
                      </span>
                    </div>
                  )}
                  {options.mode === 'style-transfer' && options.userPrompt && (
                    <div className="flex items-center justify-between">
                      <span>Build</span>
                      <span className="text-white font-medium truncate max-w-[130px]">{options.userPrompt}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-white/8">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-[#FFB81C]">⚡</span>
                    <span>Step 1: Gemini Vision analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className="text-[#FFB81C]">⚡</span>
                    <span>Step 2: Claude Luau generation</span>
                  </div>
                </div>
              </motion.div>
            )}

            {isWorking && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#141414] border border-white/8 rounded-2xl p-5"
              >
                <GenerationProgress steps={steps} phase={phase} />
              </motion.div>
            )}

            {phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-300">Analysis failed</span>
                </div>
                {errorMessage && (
                  <p className="text-xs text-red-400 leading-relaxed">{errorMessage}</p>
                )}
                <p className="text-xs text-gray-500">
                  Make sure GEMINI_API_KEY is configured in your environment.
                </p>
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
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-emerald-300 font-medium">Map generated successfully!</span>
                </div>
                <ResultPreview
                  inputImage={preview}
                  analysis={analysis}
                  result={generationResult}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Feature strip ── */}
      {phase === 'idle' && !file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
        >
          {[
            { icon: '🔍', title: 'Gemini Vision', desc: 'Analyzes colors, materials, objects, and lighting from your reference image.' },
            { icon: '🎮', title: 'Style Transfer', desc: 'Upload an Adopt Me screenshot — AI builds anything in that exact visual style.' },
            { icon: '📦', title: 'Luau Code Output', desc: 'Get a complete runnable build script ready to paste into Roblox Studio.' },
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
