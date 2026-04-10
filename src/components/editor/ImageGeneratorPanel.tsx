'use client'

import { useState, useCallback, useRef } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type GenerationMode = 'icon' | 'thumbnail' | 'gfx' | 'clothing' | 'asset'
type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'

interface GeneratedImage {
  url: string
  width: number
  height: number
  mode: GenerationMode
  preset?: string
}

interface ImageGeneratorPanelProps {
  onAddToCanvas?: (url: string, name: string) => void
}

// ── Style presets ────────────────────────────────────────────────────────────

interface PresetDef {
  key: string
  label: string
  icon: string
  color: string
}

const STYLE_PRESETS: PresetDef[] = [
  { key: 'cinematic',  label: 'Cinematic',  icon: '\uD83C\uDFAC', color: '#f59e0b' },
  { key: 'neon',       label: 'Neon',       icon: '\u26A1',       color: '#a855f7' },
  { key: 'horror',     label: 'Horror',     icon: '\uD83D\uDC80', color: '#6b7280' },
  { key: 'cartoon',    label: 'Cartoon',    icon: '\uD83C\uDFA8', color: '#3b82f6' },
  { key: 'low-poly',   label: 'Low-Poly',   icon: '\u25B3',       color: '#10b981' },
  { key: 'realistic',  label: 'Realistic',  icon: '\uD83D\uDCF7', color: '#ef4444' },
  { key: 'anime',      label: 'Anime',      icon: '\u2728',       color: '#ec4899' },
  { key: 'pixel',      label: 'Pixel',      icon: '\u25A3',       color: '#f97316' },
  { key: 'watercolor', label: 'Watercolor', icon: '\uD83D\uDCA7', color: '#06b6d4' },
  { key: 'retro',      label: 'Retro',      icon: '\uD83D\uDD79', color: '#84cc16' },
  { key: 'cyberpunk',  label: 'Cyberpunk',  icon: '\uD83C\uDF03', color: '#8b5cf6' },
  { key: 'fantasy',    label: 'Fantasy',    icon: '\uD83E\uDDD9', color: '#d946ef' },
]

const MODE_OPTIONS: Array<{ key: GenerationMode; label: string; desc: string }> = [
  { key: 'icon',      label: 'Icon',      desc: '512x512 game icon' },
  { key: 'thumbnail', label: 'Thumbnail', desc: '1920x1080 cinematic' },
  { key: 'gfx',       label: 'GFX',       desc: '1024x1024 character' },
  { key: 'clothing',  label: 'Clothing',  desc: '585x559 template' },
  { key: 'asset',     label: 'Asset',     desc: '1024x1024 texture' },
]

// ── Color tokens ─────────────────────────────────────────────────────────────

const C = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.3)',
  goldFaint: 'rgba(212,175,55,0.08)',
  bg: 'rgba(10,14,32,0.92)',
  bgPanel: 'rgba(14,20,40,0.95)',
  border: 'rgba(255,255,255,0.06)',
  text: 'rgba(255,255,255,0.85)',
  textDim: 'rgba(255,255,255,0.5)',
  danger: '#ef4444',
  success: '#22c55e',
}

// ── Component ────────────────────────────────────────────────────────────────

export function ImageGeneratorPanel({ onAddToCanvas }: ImageGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<GenerationMode>('icon')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [batchCount, setBatchCount] = useState(1)
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Generate images ────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setStatus('generating')
    setError(null)

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          stylePreset: selectedPreset ?? undefined,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
          count: batchCount,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(data.error || `Generation failed (${res.status})`)
      }

      const data = await res.json()
      const newImages: GeneratedImage[] = (data.images ?? []).map((img: { url: string; width: number; height: number }) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        mode,
        preset: selectedPreset ?? undefined,
      }))

      setImages((prev) => [...newImages, ...prev])
      setStatus('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStatus('error')
    }
  }, [prompt, mode, selectedPreset, batchCount, referenceImages])

  // ── Remove background ──────────────────────────────────────────────────

  const handleRemoveBg = useCallback(async (imageUrl: string) => {
    setProcessingAction('removeBg')
    try {
      const res = await fetch('/api/ai/image/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      if (!res.ok) throw new Error('Background removal failed')
      const data = await res.json()
      if (data.imageUrl) {
        setImages((prev) => [
          { url: data.imageUrl, width: 0, height: 0, mode, preset: 'bg-removed' },
          ...prev,
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed')
    } finally {
      setProcessingAction(null)
    }
  }, [mode])

  // ── Upscale ────────────────────────────────────────────────────────────

  const handleUpscale = useCallback(async (imageUrl: string) => {
    setProcessingAction('upscale')
    try {
      const res = await fetch('/api/ai/image/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, scale: 2 }),
      })
      if (!res.ok) throw new Error('Upscaling failed')
      const data = await res.json()
      if (data.imageUrl) {
        setImages((prev) => [
          { url: data.imageUrl, width: data.width, height: data.height, mode, preset: 'upscaled' },
          ...prev,
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscaling failed')
    } finally {
      setProcessingAction(null)
    }
  }, [mode])

  // ── Download ───────────────────────────────────────────────────────────

  const handleDownload = useCallback((url: string, idx: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `forje-${mode}-${idx + 1}.png`
    a.target = '_blank'
    a.click()
  }, [mode])

  // ── Reference images ───────────────────────────────────────────────────

  const handleRefUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRefFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).slice(0, 9 - referenceImages.length).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReferenceImages((prev) => [...prev, reader.result as string].slice(0, 9))
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }, [referenceImages.length])

  const removeRef = useCallback((idx: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  // ── Styles ─────────────────────────────────────────────────────────────

  const sPanel: React.CSSProperties = {
    background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 14, color: C.text, fontSize: 12,
  }

  const sBtn: React.CSSProperties = {
    background: 'rgba(212,175,55,0.15)', border: `1px solid ${C.goldDim}`,
    borderRadius: 6, padding: '8px 16px', color: C.gold, fontSize: 13,
    cursor: 'pointer', fontWeight: 700, transition: 'background 0.15s', textAlign: 'center',
  }

  const sBtnDisabled: React.CSSProperties = { ...sBtn, opacity: 0.4, cursor: 'not-allowed' }

  const sInput: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', width: '100%',
    resize: 'vertical' as const,
  }

  const sBtnSmall: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 4,
    padding: '3px 8px', color: C.textDim, fontSize: 10, cursor: 'pointer', transition: 'all 0.15s',
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={sPanel}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: C.gold, fontSize: 14, letterSpacing: 0.5 }}>
          Image Generator
        </span>
        {status === 'generating' && (
          <span style={{ fontSize: 10, color: C.goldDim, animation: 'pulse 1.5s infinite' }}>
            Generating...
          </span>
        )}
      </div>

      {/* Mode selector */}
      <div>
        <label style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Mode</label>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              title={m.desc}
              style={{
                ...sBtnSmall,
                background: mode === m.key ? C.goldFaint : 'rgba(255,255,255,0.03)',
                border: `1px solid ${mode === m.key ? C.gold : C.border}`,
                color: mode === m.key ? C.gold : C.textDim,
                fontWeight: mode === m.key ? 700 : 400,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style presets grid */}
      <div>
        <label style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Style Preset</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 4 }}>
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => setSelectedPreset(selectedPreset === preset.key ? null : preset.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 4px', borderRadius: 6, cursor: 'pointer',
                background: selectedPreset === preset.key ? `${preset.color}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selectedPreset === preset.key ? preset.color : C.border}`,
                color: selectedPreset === preset.key ? preset.color : C.textDim,
                fontSize: 9, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{preset.icon}</span>
              <span style={{ fontWeight: selectedPreset === preset.key ? 700 : 400 }}>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div>
        <label style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>Prompt</label>
        <textarea
          style={{ ...sInput, marginTop: 4, minHeight: 70 }}
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate() }}
        />
      </div>

      {/* Batch count slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>
            Batch Count
          </label>
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>{batchCount}</span>
        </div>
        <input
          type="range" min={1} max={12} step={1} value={batchCount}
          onChange={(e) => setBatchCount(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: C.gold, marginTop: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.textDim }}>
          <span>1</span><span>6</span><span>12</span>
        </div>
      </div>

      {/* Reference images */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1 }}>
            Reference Images ({referenceImages.length}/9)
          </label>
          <button style={sBtnSmall} onClick={handleRefUpload} disabled={referenceImages.length >= 9}>
            + Add
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleRefFileChange}
        />
        {referenceImages.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
            {referenceImages.map((src, idx) => (
              <div key={idx} style={{ position: 'relative', width: 48, height: 48, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <img src={src} alt={`ref ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => removeRef(idx)}
                  style={{
                    position: 'absolute', top: 1, right: 1, width: 14, height: 14,
                    background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                    color: C.danger, fontSize: 8, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        style={status === 'generating' || !prompt.trim() ? sBtnDisabled : sBtn}
        onClick={handleGenerate}
        disabled={status === 'generating' || !prompt.trim()}
      >
        {status === 'generating' ? 'Generating...' : `Generate ${batchCount} Image${batchCount > 1 ? 's' : ''}`}
      </button>

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 6, fontSize: 11, color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Processing indicator */}
      {processingAction && (
        <div style={{ padding: '6px 10px', background: C.goldFaint, border: `1px solid ${C.goldDim}`, borderRadius: 6, fontSize: 11, color: C.gold, textAlign: 'center' }}>
          {processingAction === 'removeBg' ? 'Removing background...' : 'Upscaling image...'}
        </div>
      )}

      {/* Results grid */}
      {images.length > 0 && (
        <div>
          <label style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>
            Generated ({images.length})
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140, 1fr))', gap: 8 }}>
            {images.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                style={{
                  borderRadius: 6, overflow: 'hidden',
                  border: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                  <img
                    src={img.url}
                    alt={`Generated ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: 4 }}>
                  <button style={sBtnSmall} onClick={() => handleDownload(img.url, idx)} title="Download">
                    DL
                  </button>
                  {onAddToCanvas && (
                    <button
                      style={sBtnSmall}
                      onClick={() => onAddToCanvas(img.url, `gen-${idx + 1}`)}
                      title="Add to Canvas"
                    >
                      +Canvas
                    </button>
                  )}
                  <button
                    style={sBtnSmall}
                    onClick={() => handleRemoveBg(img.url)}
                    disabled={!!processingAction}
                    title="Remove Background"
                  >
                    -BG
                  </button>
                  <button
                    style={sBtnSmall}
                    onClick={() => handleUpscale(img.url)}
                    disabled={!!processingAction}
                    title="Upscale 2x"
                  >
                    HD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline styles for animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
