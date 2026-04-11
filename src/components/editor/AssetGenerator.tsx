'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ModelPreview } from './ModelPreview'

// ── Types ─────────────────────────────────────────────────────────────────────

type AssetType = 'building' | 'character' | 'vehicle' | 'weapon' | 'furniture' | 'terrain' | 'prop' | 'effect' | 'custom'
type AssetStyle = 'realistic' | 'stylized' | 'lowpoly' | 'roblox'
type GenerateStatus = 'idle' | 'loading' | 'queued' | 'generating' | 'optimizing' | 'uploading' | 'complete' | 'ready' | 'failed' | 'error'

interface AssetTemplate {
  id:        string
  name:      string
  prompt:    string
  preview:   string
  polyCount: number
  price:     number
  type:      string
  style:     string
  tags:      string[]
}

interface TemplateCategory {
  name:      string
  slug:      string
  icon:      string
  templates: AssetTemplate[]
}

interface GeneratedAsset {
  status:       'complete' | 'pending' | 'demo' | 'queued' | 'generating' | 'optimizing' | 'uploading' | 'failed'
  taskId?:      string
  assetId?:     string
  /**
   * BUG 10: numeric Roblox asset ID returned by the Open Cloud uploader once
   * the mesh has been published to Roblox. When present, we prefer the
   * `insert_asset` command path over pushing raw Luau code.
   */
  robloxAssetId?: string | null
  asset: {
    meshUrl:      string | null
    textureUrls:  { albedo: string | null; normal: string | null; roughness: string | null; metallic: string | null }
    thumbnailUrl: string | null
    polyCount:    number
    fileSize:     string
    dimensions:   { x: number; y: number; z: number }
  }
  luauCode:      string
  agentChain:    string[]
  tokensCost:    number
  estimatedTime: string
}

// ── Token cost estimation (mirrors server logic) ──────────────────────────────

const BASE_TOKEN_COSTS: Record<AssetType, number> = {
  building: 80, character: 120, vehicle: 100, weapon: 60,
  furniture: 50, terrain: 90, prop: 40, effect: 70, custom: 140,
}

function estimateTokens(
  type:      AssetType,
  textured:  boolean,
  rigged:    boolean,
  animated:  boolean,
): number {
  return BASE_TOKEN_COSTS[type]
    + (textured  ? 30 : 0)
    + (rigged    ? 50 : 0)
    + (animated  ? 80 : 0)
}

// ── Category icon SVGs ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  building: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 14v-4h2v4M9 14v-4h2v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 4V2M5 4l3-2 3 2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  mountain: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M2 14l5-8 3 4 2-3 2 7H2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M7 6l1-1 1 1" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  ),
  car: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <rect x="1" y="7" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 7l1.5-3h5L12 7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="4.5" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
      <circle cx="11.5" cy="12.5" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  ),
  person: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 14v-3a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5 11l-1 3M11 11l1 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  ),
  sword: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M12 2L4 10l-1 2 2-1L13 3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M3 11l-1 2 2-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  chair: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <rect x="3" y="3" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 8v6M13 8v6M5 14h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  box: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M8 2l5 3v5l-5 3-5-3V5l5-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 2v8M3 5l5 3 5-3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.5 1.5M10.5 10.5L12 12M4 12l1.5-1.5M10.5 5.5L12 4"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
      <path d="M2 8h3l2-5 2 10 2-5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

// ── 3D Cube CSS animation preview ─────────────────────────────────────────────

function CubePreview({ active, thumbnailUrl }: { active: boolean; thumbnailUrl?: string | null }) {
  if (thumbnailUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img src={thumbnailUrl} alt="Generated asset preview" width={64} height={64} className="w-full h-full object-contain rounded" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: '300px' }}>
      <div
        className="relative"
        style={{
          width: 64,
          height: 64,
          transformStyle: 'preserve-3d',
          animation: active ? 'cubeRotate 3s linear infinite' : 'none',
          transform: active ? undefined : 'rotateX(-20deg) rotateY(30deg)',
        }}
      >
        {/* cube faces */}
        {[
          { transform: 'rotateY(0deg)   translateZ(32px)',  bg: 'rgba(212,175,55,0.15)',  border: 'rgba(212,175,55,0.4)' },
          { transform: 'rotateY(180deg) translateZ(32px)', bg: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.25)' },
          { transform: 'rotateY(90deg)  translateZ(32px)',  bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.35)' },
          { transform: 'rotateY(-90deg) translateZ(32px)', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.35)' },
          { transform: 'rotateX(90deg)  translateZ(32px)',  bg: 'rgba(212,175,55,0.20)', border: 'rgba(212,175,55,0.5)' },
          { transform: 'rotateX(-90deg) translateZ(32px)', bg: 'rgba(212,175,55,0.05)', border: 'rgba(212,175,55,0.2)' },
        ].map((face, i) => (
          <div
            key={i}
            style={{
              position:  'absolute',
              width:     64,
              height:    64,
              transform: face.transform,
              background: face.bg,
              border:    `1px solid ${face.border}`,
              backfaceVisibility: 'visible',
            }}
          />
        ))}
      </div>
      <style>{`@keyframes cubeRotate { from { transform: rotateX(-20deg) rotateY(0deg); } to { transform: rotateX(-20deg) rotateY(360deg); } }`}</style>
    </div>
  )
}

// ── Loading spinner ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
      style={{
        background: copied ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
        color:      copied ? '#D4AF37' : '#a1a1aa',
        border:     `1px solid ${copied ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 4V2H1v7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copy Luau
        </>
      )}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AssetGeneratorProps {
  className?: string
  /**
   * BUG 10: optional `meta` now carries a `robloxAssetId` so the parent can
   * choose between the insert_asset command path (preferred, uses
   * InsertService:LoadAsset) and the raw-luau push path (fallback).
   */
  onSendToStudio?: (
    luauCode: string,
    prompt: string,
    meta?: { robloxAssetId?: string | null; name?: string }
  ) => void
}

export function AssetGenerator({ className = '', onSendToStudio }: AssetGeneratorProps) {
  // Category + template state
  const [activeCategory, setActiveCategory]     = useState<string>('buildings')
  const [categories, setCategories]             = useState<TemplateCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Form state
  const [prompt, setPrompt]           = useState('')
  const [assetType, setAssetType]     = useState<AssetType>('building')
  const [style, setStyle]             = useState<AssetStyle>('roblox')
  const [polyTarget, setPolyTarget]   = useState(5000)
  const [textured, setTextured]       = useState(true)
  const [rigged, setRigged]           = useState(false)
  const [animated, setAnimated]       = useState(false)
  const [exportFmt, setExportFmt]     = useState<'glb' | 'fbx' | 'obj'>('glb')

  // Generation state
  const [status, setStatus]           = useState<GenerateStatus>('idle')
  const [result, setResult]           = useState<GeneratedAsset | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [showLuau, setShowLuau]       = useState(false)

  const abortRef   = useRef<AbortController | null>(null)
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const assetIdRef = useRef<string | null>(null)

  // Stop polling on unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  // Computed token estimate
  const tokenEstimate = estimateTokens(assetType, textured, rigged, animated)

  // Load templates on mount
  useEffect(() => {
    fetch('/api/ai/3d-generate/templates')
      .then((r) => r.json())
      .then((data: { categories: TemplateCategory[] }) => {
        setCategories(data.categories ?? [])
        setCategoriesLoading(false)
      })
      .catch(() => setCategoriesLoading(false))
  }, [])

  // Populate form from template click
  const applyTemplate = useCallback((tpl: AssetTemplate) => {
    setPrompt(tpl.prompt)
    setAssetType(tpl.type as AssetType)
    setStyle(tpl.style as AssetStyle)
    setPolyTarget(tpl.polyCount)
    setResult(null)
    setError(null)
    setStatus('idle')
  }, [])

  // Poll for async generation status
  const startPolling = useCallback((assetId: string, initialData: GeneratedAsset) => {
    assetIdRef.current = assetId
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/generation-status?assetId=${encodeURIComponent(assetId)}`)
        if (!res.ok) return
        const data = await res.json() as {
          assetId: string
          status: string
          meshUrl?: string | null
          thumbnailUrl?: string | null
          polyCount?: number
          albedoUrl?: string | null
          normalUrl?: string | null
          roughnessUrl?: string | null
          metallicUrl?: string | null
          // BUG 10: numeric Roblox asset ID for insert_asset command path
          robloxAssetId?: string | null
          errorMessage?: string | null
          tokensCost?: number
        }

        // Map pipeline status to UI status
        const pipelineStatus = data.status

        if (pipelineStatus === 'ready' || pipelineStatus === 'complete') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setResult((prev) => prev ? {
            ...prev,
            status: 'complete' as const,
            // BUG 10: capture the uploaded Roblox asset ID for the
            // insert_asset command path used by handleSendToStudio below.
            robloxAssetId: data.robloxAssetId ?? prev.robloxAssetId ?? null,
            asset: {
              ...prev.asset,
              meshUrl:     data.meshUrl ?? prev.asset.meshUrl,
              thumbnailUrl: data.thumbnailUrl ?? prev.asset.thumbnailUrl,
              polyCount:   data.polyCount ?? prev.asset.polyCount,
              textureUrls: {
                albedo:    data.albedoUrl ?? prev.asset.textureUrls.albedo,
                normal:    data.normalUrl ?? prev.asset.textureUrls.normal,
                roughness: data.roughnessUrl ?? prev.asset.textureUrls.roughness,
                metallic:  data.metallicUrl ?? prev.asset.textureUrls.metallic,
              },
            },
            tokensCost: data.tokensCost ?? prev.tokensCost,
          } : prev)
          setStatus('complete')
        } else if (pipelineStatus === 'failed') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setError(data.errorMessage ?? 'Generation failed')
          setStatus('error')
        } else {
          // queued | generating | optimizing | uploading
          const uiStatus = pipelineStatus as GenerateStatus
          setStatus(uiStatus)
          setResult((prev) => prev ? {
            ...prev,
            status: uiStatus as GeneratedAsset['status'],
          } : prev)
        }
      } catch {
        // Non-fatal — keep polling
      }
    }, 5000)

    // Set initial queued state immediately
    setResult(initialData)
    setStatus('queued')
  }, [])

  // Generate asset
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || status === 'loading') return

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }

    setStatus('loading')
    setResult(null)
    setError(null)
    setShowLuau(false)

    try {
      const res = await fetch('/api/ai/3d-generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  abortRef.current.signal,
        body: JSON.stringify({
          type:             assetType,
          prompt:           prompt.trim(),
          style,
          polyTarget,
          textured,
          rigged,
          animated,
          exportFormat:     exportFmt,
          robloxOptimized:  true,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
      }

      const data = (await res.json()) as GeneratedAsset

      if (data.status === 'queued' && data.assetId) {
        // Async pipeline — start polling
        startPolling(data.assetId, data)
      } else {
        // Synchronous / demo response
        setResult(data)
        setStatus('complete')
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStatus('error')
    }
  }, [prompt, assetType, style, polyTarget, textured, rigged, animated, exportFmt, status, startPolling])

  const handleSendToStudio = useCallback(() => {
    if (!result || !onSendToStudio) return
    // BUG 10: pass the uploaded Roblox asset ID so the parent can use the
    // insert_asset command path instead of pushing the raw Luau model.
    onSendToStudio(result.luauCode, prompt, {
      robloxAssetId: result.robloxAssetId ?? null,
      name: prompt.slice(0, 64) || 'Generated Asset',
    })
  }, [result, prompt, onSendToStudio])

  const currentCategoryTemplates = categories.find((c) => c.slug === activeCategory)?.templates ?? []

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col h-full overflow-hidden text-[13px] ${className}`}
      style={{ background: '#0e0e10', color: '#e4e4e7' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#111113' }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[#D4AF37]">
            <path d="M8 2l5 3v5l-5 3-5-3V5l5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M8 2v8M3 5l5 3 5-3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
          </svg>
          <span className="font-semibold tracking-tight" style={{ color: '#f4f4f5' }}>3D Asset Generator</span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
        >
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 3v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          ~{tokenEstimate} tokens
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Templates section ────────────────────────────────────────────── */}
        <div className="px-4 pt-4">
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#52525b' }}>Templates</p>

          {/* Category tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {categoriesLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-7 w-20 rounded flex-shrink-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded flex-shrink-0 transition-all text-[11px] font-medium"
                    style={{
                      background: activeCategory === cat.slug ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                      color:      activeCategory === cat.slug ? '#D4AF37' : '#71717a',
                      border:     `1px solid ${activeCategory === cat.slug ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <span style={{ color: activeCategory === cat.slug ? '#D4AF37' : '#52525b' }}>
                      {CATEGORY_ICONS[cat.icon] ?? CATEGORY_ICONS.custom}
                    </span>
                    {cat.name}
                  </button>
                ))
            }
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))
              : currentCategoryTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="relative flex flex-col items-start p-2.5 rounded text-left transition-all group"
                    style={{
                      background: prompt === tpl.prompt ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.04)',
                      border:     `1px solid ${prompt === tpl.prompt ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                    onMouseEnter={(e) => {
                      if (prompt !== tpl.prompt) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)'
                    }}
                    onMouseLeave={(e) => {
                      if (prompt !== tpl.prompt) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'
                    }}
                  >
                    <span className="text-[12px] font-medium leading-tight mb-1" style={{ color: '#e4e4e7' }}>{tpl.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: '#52525b' }}>{tpl.polyCount.toLocaleString()} poly</span>
                      <span className="text-[10px] font-medium" style={{ color: '#D4AF37' }}>{tpl.price}t</span>
                    </div>
                  </button>
                ))
            }
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-4" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* ── Custom prompt ─────────────────────────────────────────────────── */}
        <div className="px-4 mb-4">
          <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#52525b' }}>Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your 3D asset... e.g. medieval stone castle with 4 towers"
            rows={3}
            className="w-full resize-none rounded px-3 py-2 text-[12px] leading-relaxed placeholder:text-zinc-600 outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border:     '1px solid rgba(255,255,255,0.09)',
              color:      '#e4e4e7',
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
          />
        </div>

        {/* ── Controls grid ─────────────────────────────────────────────────── */}
        <div className="px-4 grid grid-cols-2 gap-3 mb-4">
          {/* Asset type */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#52525b' }}>Type</label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              className="w-full rounded px-2.5 py-1.5 text-[12px] outline-none appearance-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e4e4e7' }}
            >
              {(['building','character','vehicle','weapon','furniture','terrain','prop','effect','custom'] as AssetType[]).map((t) => (
                <option key={t} value={t} style={{ background: '#1a1a1c' }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#52525b' }}>Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as AssetStyle)}
              className="w-full rounded px-2.5 py-1.5 text-[12px] outline-none appearance-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e4e4e7' }}
            >
              {(['realistic','stylized','lowpoly','roblox'] as AssetStyle[]).map((s) => (
                <option key={s} value={s} style={{ background: '#1a1a1c' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Poly count */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] uppercase tracking-widest" style={{ color: '#52525b' }}>Poly Target</label>
              <span className="text-[11px] font-medium" style={{ color: '#D4AF37' }}>{polyTarget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={polyTarget}
              onChange={(e) => setPolyTarget(parseInt(e.target.value, 10))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#D4AF37', background: 'rgba(255,255,255,0.1)' }}
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: '#3f3f46' }}>
              <span>500 (Low)</span>
              <span>5K (Roblox)</span>
              <span>50K (High)</span>
            </div>
          </div>

          {/* Export format */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#52525b' }}>Format</label>
            <div className="flex gap-1">
              {(['glb','fbx','obj'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFmt(fmt)}
                  className="flex-1 py-1.5 rounded text-[11px] font-medium uppercase tracking-wide transition-all"
                  style={{
                    background: exportFmt === fmt ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                    color:      exportFmt === fmt ? '#D4AF37' : '#71717a',
                    border:     `1px solid ${exportFmt === fmt ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2 justify-center">
            {[
              { label: 'PBR Textures', value: textured,  setter: setTextured,  cost: 30  },
              { label: 'Rigged',       value: rigged,    setter: setRigged,    cost: 50  },
              { label: 'Animated',     value: animated,  setter: setAnimated,  cost: 80  },
            ].map(({ label, value, setter, cost }) => (
              <label key={label} className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px]" style={{ color: value ? '#e4e4e7' : '#71717a' }}>{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: value ? '#D4AF37' : '#3f3f46' }}>+{cost}t</span>
                  <button
                    role="switch"
                    aria-checked={value}
                    onClick={() => setter(!value)}
                    className="relative w-8 h-4 rounded-full transition-colors flex-shrink-0"
                    style={{ background: value ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <span
                      className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
                      style={{
                        background: value ? '#D4AF37' : '#52525b',
                        transform:  value ? 'translateX(17px)' : 'translateX(2px)',
                      }}
                    />
                  </button>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ── Preview pane ──────────────────────────────────────────────────── */}
        <div className="px-4 mb-4">
          <div
            className="w-full rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              height:     140,
              background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, rgba(0,0,0,0.3) 100%)',
              border:     '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {status === 'loading' ? (
              <div className="flex flex-col items-center gap-3">
                <div style={{ color: '#D4AF37' }}><Spinner /></div>
                <span className="text-[11px]" style={{ color: '#52525b' }}>Generating asset...</span>
              </div>
            ) : result?.asset.meshUrl ? (
              <ModelPreview
                glbUrl={result.asset.meshUrl}
                thumbnailUrl={result.asset.thumbnailUrl}
                width="100%"
                height={140}
                autoRotate
                showToggle
                expandable
              />
            ) : (
              <CubePreview
                active={status === 'complete'}
                thumbnailUrl={result?.asset.thumbnailUrl}
              />
            )}
          </div>

          {/* Asset stats after generation */}
          {result && status === 'complete' && (
            <div
              className="mt-2 rounded p-2.5 grid grid-cols-3 gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {[
                { label: 'Polys',    value: result.asset.polyCount.toLocaleString() },
                { label: 'Size',     value: result.asset.fileSize                    },
                { label: 'Time',     value: result.estimatedTime                     },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-[10px] mb-0.5" style={{ color: '#52525b' }}>{label}</div>
                  <div className="text-[12px] font-semibold" style={{ color: '#e4e4e7' }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div
              className="mt-2 rounded p-2.5 text-[12px]"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
            >
              {error}
            </div>
          )}

          {/* Agent chain */}
          {result && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.agentChain.map((agent) => (
                <span
                  key={agent}
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {agent}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Luau code section ─────────────────────────────────────────────── */}
        {result?.luauCode && (
          <div className="px-4 mb-4">
            <button
              onClick={() => setShowLuau(!showLuau)}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-[12px] transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.08)',
                color:      '#a1a1aa',
              }}
            >
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M2 4l3 3-3 3M7 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                InsertService Luau Code
              </div>
              <svg
                viewBox="0 0 12 12"
                fill="none"
                className="w-3 h-3 transition-transform"
                style={{ transform: showLuau ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showLuau && (
              <div
                className="mt-1 rounded overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="flex items-center justify-between px-3 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-[10px]" style={{ color: '#52525b' }}>Luau — paste in Roblox Studio</span>
                  <CopyButton text={result.luauCode} />
                </div>
                <pre
                  className="p-3 overflow-x-auto text-[11px] leading-relaxed"
                  style={{
                    background:     '#0a0a0c',
                    color:          '#a1a1aa',
                    fontFamily:     '"JetBrains Mono", "Fira Code", monospace',
                    maxHeight:      240,
                    overflowY:      'auto',
                    whiteSpace:     'pre',
                    scrollbarWidth: 'thin',
                  }}
                >
                  {result.luauCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* ── Footer actions ──────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#111113' }}
      >
        {/* Token estimate badge */}
        <div
          className="flex-1 flex items-center gap-1.5 text-[11px]"
          style={{ color: '#52525b' }}
        >
          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" style={{ color: '#D4AF37' }}>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#71717a' }}>Est.</span>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>{tokenEstimate}</span>
          <span style={{ color: '#71717a' }}>tokens</span>
        </div>

        {/* Send to Studio — only after generation */}
        {result && onSendToStudio && (
          <button
            onClick={handleSendToStudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color:      '#a1a1aa',
              border:     '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e4e4e7' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa' }}
          >
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Send to Studio
          </button>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || status === 'loading' || status === 'queued' || status === 'generating' || status === 'optimizing' || status === 'uploading'}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-[12px] font-semibold transition-all"
          style={{
            background: !prompt.trim() || !(['idle', 'complete', 'error'] as GenerateStatus[]).includes(status)
              ? 'rgba(212,175,55,0.2)'
              : 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
            color:  !prompt.trim() || !(['idle', 'complete', 'error'] as GenerateStatus[]).includes(status) ? 'rgba(212,175,55,0.4)' : '#0a0a0c',
            cursor: !prompt.trim() || !(['idle', 'complete', 'error'] as GenerateStatus[]).includes(status) ? 'not-allowed' : 'pointer',
            boxShadow: !prompt.trim() || !(['idle', 'complete', 'error'] as GenerateStatus[]).includes(status) ? 'none' : '0 2px 12px rgba(212,175,55,0.3)',
          }}
        >
          {status === 'loading' ? (
            <>
              <div style={{ color: 'rgba(212,175,55,0.6)' }}><Spinner /></div>
              Queuing...
            </>
          ) : status === 'queued' ? (
            <>
              <div style={{ color: 'rgba(212,175,55,0.6)' }}><Spinner /></div>
              Queued...
            </>
          ) : status === 'generating' ? (
            <>
              <div style={{ color: 'rgba(212,175,55,0.6)' }}><Spinner /></div>
              Generating...
            </>
          ) : status === 'optimizing' ? (
            <>
              <div style={{ color: 'rgba(212,175,55,0.6)' }}><Spinner /></div>
              Optimizing...
            </>
          ) : status === 'uploading' ? (
            <>
              <div style={{ color: 'rgba(212,175,55,0.6)' }}><Spinner /></div>
              Uploading...
            </>
          ) : (
            <>
              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                <path d="M6 1L7.5 4.5L11 6 7.5 7.5 6 11 4.5 7.5 1 6l3.5-1.5L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default AssetGenerator
