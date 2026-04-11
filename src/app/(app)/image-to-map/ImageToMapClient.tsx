'use client'

import { useState, useCallback, useRef } from 'react'
import { ArrowLeft, Upload, X, Cpu, Box, Download, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageAnalysis {
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

type Phase = 'idle' | 'analyzing' | 'generating' | 'done' | 'error'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function buildEditorPrompt(analysis: ImageAnalysis): string {
  const objects = analysis.objects.slice(0, 8).join(', ')
  const materials = analysis.materials.slice(0, 4).join(', ')
  return `Build a ${analysis.scale} ${analysis.theme} Roblox map in ${analysis.style} style. Include: ${objects}. Use ${materials} materials. Lighting: ${analysis.lighting}. ${analysis.summary}`
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: done
            ? 'linear-gradient(135deg, #D4AF37, #B8962E)'
            : active
              ? 'rgba(212,175,55,0.15)'
              : 'rgba(255,255,255,0.04)',
          border: done
            ? 'none'
            : active
              ? '1px solid rgba(212,175,55,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
          boxShadow: active ? '0 0 12px rgba(212,175,55,0.2)' : 'none',
        }}
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-[#050810]" />
        ) : (
          <span className="text-xs font-bold" style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.25)' }}>
            {active ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <circle cx="7" cy="7" r="5" stroke="rgba(212,175,55,0.2)" strokeWidth="1.8"/>
                <path d="M7 2a5 5 0 0 1 5 5" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            ) : '·'}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium" style={{ color: done || active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }, [onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="relative rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 py-16 px-8"
      style={{
        border: `2px dashed ${dragging ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)'}`,
        background: dragging ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.01)',
        boxShadow: dragging ? '0 0 24px rgba(212,175,55,0.08) inset' : 'none',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <Upload className="w-7 h-7 text-[#D4AF37]" />
      </div>
      <div className="text-center">
        <p className="text-white font-semibold mb-1">Drop an image here</p>
        <p className="text-gray-500 text-sm">or click to browse — JPEG, PNG, WebP, GIF up to 4 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Analysis result card ─────────────────────────────────────────────────────

function AnalysisCard({ analysis }: { analysis: ImageAnalysis }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-bold text-base capitalize">{analysis.theme}</p>
          <p className="text-gray-400 text-xs mt-0.5 capitalize">{analysis.style} · {analysis.scale} scale</p>
        </div>
        <div
          className="px-2 py-1 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          {Math.round(analysis.confidence * 100)}% confidence
        </div>
      </div>

      {/* Colour palette */}
      {analysis.colors.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Palette</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.colors.map((hex, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-md border"
                style={{ background: hex, borderColor: 'rgba(255,255,255,0.1)' }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Objects detected */}
      {analysis.objects.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Detected objects</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.objects.map((obj, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Materials */}
      {analysis.materials.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-medium">Roblox materials</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.materials.map((mat, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-xs"
                style={{ background: 'rgba(212,175,55,0.06)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.12)' }}
              >
                {mat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <p className="text-sm text-gray-400 leading-relaxed">{analysis.summary}</p>

      {/* Lighting */}
      <p className="text-xs text-gray-500">
        <span className="font-medium text-gray-400">Lighting: </span>{analysis.lighting}
      </p>

      {analysis.sourceGame && (
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-400">Source game: </span>{analysis.sourceGame}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImageToMapClient() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setPhase('idle')
    setAnalysis(null)
    setErrorMsg(null)
  }, [])

  const clearFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setPhase('idle')
    setAnalysis(null)
    setErrorMsg(null)
  }, [previewUrl])

  const runPipeline = useCallback(async () => {
    if (!file) return
    setErrorMsg(null)

    // Step 1: Analyze
    setPhase('analyzing')
    let result: ImageAnalysis
    try {
      const dataUrl = await fileToBase64(file)
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: dataUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
        throw new Error(err.error ?? `Analysis failed (${res.status})`)
      }
      result = await res.json() as ImageAnalysis
      setAnalysis(result)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Image analysis failed')
      setPhase('error')
      return
    }

    // Step 2: Brief "generating" phase for UX continuity
    setPhase('generating')
    await new Promise((r) => setTimeout(r, 600))

    setPhase('done')
  }, [file])

  const sendToEditor = useCallback(() => {
    if (!analysis || !file) return
    // Store file in sessionStorage as base64 for the editor to pick up
    fileToBase64(file).then((dataUrl) => {
      try {
        sessionStorage.setItem('fg_itm_image', dataUrl)
        sessionStorage.setItem('fg_itm_name', file.name)
        sessionStorage.setItem('fg_itm_prompt', buildEditorPrompt(analysis))
      } catch { /* quota exceeded — proceed without */ }
      const encoded = encodeURIComponent(buildEditorPrompt(analysis))
      router.push(`/editor?imageprompt=${encoded}`)
    })
  }, [analysis, file, router])

  const isDone = phase === 'done'
  const isAnalyzing = phase === 'analyzing'
  const isGenerating = phase === 'generating'
  const isWorking = isAnalyzing || isGenerating

  return (
    <div className="max-w-2xl mx-auto pb-16 pt-2 px-4">

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">
          Image{' '}
          <span className="text-[#D4AF37]" style={{ textShadow: '0 0 24px rgba(212,175,55,0.3)' }}>
            to Map
          </span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Drop a photo or concept art. Gemini Vision reads every detail — terrain, buildings, lighting — then generates Luau code ready to run in Studio.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {[
          { label: 'Upload', done: Boolean(file), active: !file },
          { label: 'Analyze', done: Boolean(analysis), active: isAnalyzing },
          { label: 'Generate', done: isDone, active: isGenerating },
          { label: 'Build', done: false, active: isDone },
        ].map((step, i, arr) => (
          <div key={step.label} className="flex items-center gap-2">
            <StepDot {...step} />
            {i < arr.length - 1 && (
              <div
                className="w-8 h-px transition-all duration-500"
                style={{ background: step.done ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Drop zone or preview */}
      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Image preview */}
          <div className="relative" style={{ maxHeight: 320, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl!}
              alt="Uploaded"
              className="w-full object-cover"
              style={{ maxHeight: 320 }}
            />
            {/* Overlay when working */}
            {isWorking && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(5,8,16,0.75)', backdropFilter: 'blur(4px)' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="16" cy="16" r="13" stroke="rgba(212,175,55,0.15)" strokeWidth="3"/>
                  <path d="M16 3a13 13 0 0 1 13 13" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
                  {isAnalyzing ? 'Analyzing image with Gemini Vision…' : 'Generating Roblox map plan…'}
                </p>
              </div>
            )}
          </div>

          {/* File info bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'rgba(212,175,55,0.6)', flexShrink: 0 }}>
                <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="4.5" cy="5.5" r="1.25" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M1.5 10l3-3.5 2.5 2.5 2-1.5L13 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-gray-400 truncate">{file.name}</span>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
            {!isWorking && (
              <button
                onClick={clearFile}
                title="Remove image"
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && errorMsg && (
        <div
          className="rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
        >
          {errorMsg}
        </div>
      )}

      {/* Analysis result */}
      {analysis && phase !== 'analyzing' && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            AI Analysis
          </p>
          <AnalysisCard analysis={analysis} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!file ? null : !isDone ? (
          <button
            onClick={runPipeline}
            disabled={isWorking}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)', color: '#050810' }}
          >
            {isWorking ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="7" cy="7" r="5" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/>
                  <path d="M7 2a5 5 0 0 1 5 5" stroke="#050810" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {isAnalyzing ? 'Analyzing…' : 'Generating…'}
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Analyze &amp; Generate Map
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={sendToEditor}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)', color: '#050810' }}
            >
              <Box className="w-4 h-4" />
              Build in Editor
            </button>
            <button
              onClick={() => { setPhase('idle'); setAnalysis(null) }}
              className="px-4 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Re-analyze
            </button>
          </>
        )}
      </div>

      {/* How it works */}
      {!file && (
        <div className="mt-10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Upload, title: 'Upload Photo', desc: 'Drag in any image — concept art, real-world photo, or a rough sketch.' },
              { icon: Cpu, title: 'AI Analysis', desc: 'Gemini Vision reads terrain, objects, colours, and lighting automatically.' },
              { icon: Box, title: 'Map Plan', desc: 'Every surface becomes a Roblox material. Objects are mapped to free catalog assets.' },
              { icon: Download, title: 'One-Click Build', desc: 'Send directly to the editor. The AI generates Luau and runs it in Studio.' },
            ].map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
                  >
                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">{feat.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
