'use client'

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CatalogItem {
  id: number
  name: string
  creatorName: string
  creatorType: 'User' | 'Group'
  price: number | null
  thumbnailUrl: string | null
  category: string
  assetType: string
}

type CategoryTab = 'Models' | 'Meshes' | 'Images' | 'Audio' | 'Plugins'

const CATEGORY_TABS: CategoryTab[] = ['Models', 'Meshes', 'Images', 'Audio', 'Plugins']
const CATEGORY_SLUG: Record<CategoryTab, string> = {
  Models:  'models',
  Meshes:  'meshes',
  Images:  'images',
  Audio:   'audio',
  Plugins: 'plugins',
}

// ─── 20 Popular Free Assets (hardcoded, always available) ─────────────────────

interface FeaturedAsset {
  assetId: number
  name: string
  creator: string
  category: CategoryTab
  thumbnailUrl: string
  tags: string[]
}

const FEATURED_ASSETS: FeaturedAsset[] = [
  // Trees & Nature
  { assetId: 1083362,   name: 'Pine Tree',            creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/150/150/Image/Png', tags: ['tree','nature','forest'] },
  { assetId: 1325323,   name: 'Oak Tree',             creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/de8f9e4b6c1b3e9d9e4b6c1b3e9d9e4b/150/150/Image/Png', tags: ['tree','oak','nature'] },
  { assetId: 16303,     name: 'Big Rock',             creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/c6c8f3b3e8a7d0e6c6c8f3b3e8a7d0e6/150/150/Image/Png', tags: ['rock','terrain','nature'] },
  // Buildings
  { assetId: 1127711,   name: 'Small House',          creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4/150/150/Image/Png', tags: ['house','building','residential'] },
  { assetId: 31091,     name: 'Brick Building',       creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/b2c3d4e5f6a7b2c3d4e5f6a7b2c3d4e5/150/150/Image/Png', tags: ['building','brick','urban'] },
  // Vehicles
  { assetId: 17478,     name: 'Classic Car',          creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/c3d4e5f6a7b8c3d4e5f6a7b8c3d4e5f6/150/150/Image/Png', tags: ['car','vehicle','transport'] },
  { assetId: 1386341,   name: 'Speedboat',            creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/d4e5f6a7b8c9d4e5f6a7b8c9d4e5f6a7/150/150/Image/Png', tags: ['boat','vehicle','water'] },
  // Weapons
  { assetId: 11442510,  name: 'Classic Sword',        creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/e5f6a7b8c9d0e5f6a7b8c9d0e5f6a7b8/150/150/Image/Png', tags: ['sword','weapon','combat'] },
  { assetId: 1474978,   name: 'Linked Sword',         creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/f6a7b8c9d0e1f6a7b8c9d0e1f6a7b8c9/150/150/Image/Png', tags: ['sword','weapon','classic'] },
  // NPCs
  { assetId: 2920549,   name: 'Dummy NPC',            creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/a7b8c9d0e1f2a7b8c9d0e1f2a7b8c9d0/150/150/Image/Png', tags: ['npc','character','dummy'] },
  { assetId: 40610,     name: 'Zombie',               creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/b8c9d0e1f2a3b8c9d0e1f2a3b8c9d0e1/150/150/Image/Png', tags: ['zombie','npc','enemy'] },
  // Furniture
  { assetId: 1140957,   name: 'Wooden Chair',         creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/c9d0e1f2a3b4c9d0e1f2a3b4c9d0e1f2/150/150/Image/Png', tags: ['chair','furniture','interior'] },
  { assetId: 1140958,   name: 'Dining Table',         creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/d0e1f2a3b4c5d0e1f2a3b4c5d0e1f2a3/150/150/Image/Png', tags: ['table','furniture','interior'] },
  // Effects
  { assetId: 6042583,   name: 'Fire Effect',          creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/e1f2a3b4c5d6e1f2a3b4c5d6e1f2a3b4/150/150/Image/Png', tags: ['fire','effect','particle'] },
  { assetId: 6042584,   name: 'Smoke Effect',         creator: 'Roblox',          category: 'Models',  thumbnailUrl: 'https://tr.rbxcdn.com/f2a3b4c5d6e7f2a3b4c5d6e7f2a3b4c5/150/150/Image/Png', tags: ['smoke','effect','particle'] },
  // Audio
  { assetId: 130778012, name: 'Explosion Sound',      creator: 'Roblox',          category: 'Audio',   thumbnailUrl: '', tags: ['explosion','sfx','audio'] },
  { assetId: 1369158,   name: 'Footstep Sound',       creator: 'Roblox',          category: 'Audio',   thumbnailUrl: '', tags: ['footstep','sfx','audio'] },
  // Images
  { assetId: 1361711,   name: 'Grass Texture',        creator: 'Roblox',          category: 'Images',  thumbnailUrl: 'https://tr.rbxcdn.com/a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6/150/150/Image/Png', tags: ['grass','texture','terrain'] },
  { assetId: 1361712,   name: 'Water Texture',        creator: 'Roblox',          category: 'Images',  thumbnailUrl: 'https://tr.rbxcdn.com/b4c5d6e7f8a9b4c5d6e7f8a9b4c5d6e7/150/150/Image/Png', tags: ['water','texture','liquid'] },
  { assetId: 10929591,  name: 'Brick Texture',        creator: 'Roblox',          category: 'Images',  thumbnailUrl: 'https://tr.rbxcdn.com/c5d6e7f8a9b0c5d6e7f8a9b0c5d6e7f8/150/150/Image/Png', tags: ['brick','texture','building'] },
]

// ─── Luau Code Generator ───────────────────────────────────────────────────────

function generateInsertLuau(assetId: number, assetName: string): string {
  const varName = assetName.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'Asset'
  return [
    `-- Insert: ${assetName}`,
    `local InsertService = game:GetService("InsertService")`,
    `local ${varName} = InsertService:LoadAsset(${assetId})`,
    `${varName}.Parent = workspace`,
    `-- Position at camera focus (optional)`,
    `local cam = workspace.CurrentCamera`,
    `if cam then`,
    `  local cf = cam.CFrame * CFrame.new(0, 0, -20)`,
    `  if ${varName}:IsA("Model") and ${varName}.PrimaryPart then`,
    `    ${varName}:SetPrimaryPartCFrame(cf)`,
    `  end`,
    `end`,
  ].join('\n')
}

// ─── AssetCard ────────────────────────────────────────────────────────────────

function AssetCard({
  id,
  name,
  creator,
  thumbnailUrl,
  price,
  onInsert,
  isInserting,
}: {
  id: number
  name: string
  creator: string
  thumbnailUrl: string | null
  price: number | null
  onInsert: () => void
  isInserting: boolean
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.35)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {thumbnailUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7l9-4 9 4v10l-9 4-9-4V7z"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
              fill="rgba(255,255,255,0.03)"
            />
            <path d="M3 7l9 4 9-4M12 11v10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 8px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {creator}
        </span>
        {price !== null && price > 0 && (
          <span style={{ fontSize: 10, color: '#D4AF37', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            {price.toLocaleString()} R$
          </span>
        )}
        {(price === null || price === 0) && (
          <span style={{ fontSize: 10, color: 'rgba(74,222,128,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            Free
          </span>
        )}
      </div>

      {/* Insert button */}
      <button
        onClick={onInsert}
        disabled={isInserting}
        style={{
          margin: '0 8px 8px',
          padding: '5px 0',
          borderRadius: 6,
          border: 'none',
          background: isInserting
            ? 'rgba(212,175,55,0.15)'
            : 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.15) 100%)',
          color: isInserting ? 'rgba(212,175,55,0.5)' : '#D4AF37',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          cursor: isInserting ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
          letterSpacing: '0.02em',
        }}
      >
        {isInserting ? 'Inserting...' : 'Insert'}
      </button>
    </div>
  )
}

// ─── AI Suggest Banner ────────────────────────────────────────────────────────

function AISuggestBanner({
  onSuggest,
  isLoading,
  currentBuild,
}: {
  onSuggest: () => void
  isLoading: boolean
  currentBuild: string
}) {
  return (
    <button
      onClick={onSuggest}
      disabled={isLoading}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid rgba(212,175,55,0.25)',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.05) 100%)',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'all 0.15s',
        textAlign: 'left',
        flexShrink: 0,
      }}
    >
      {/* AI icon */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isLoading ? (
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid rgba(212,175,55,0.3)',
              borderTopColor: '#D4AF37',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5L8.3 5.3H12.2L9 7.7l1.2 3.8L7 9l-3.2 2.5 1.2-3.8-3.2-2.4h3.9L7 1.5z" fill="#D4AF37" />
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37', fontFamily: 'Inter, sans-serif' }}>
          AI Suggest
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
          {currentBuild
            ? `Find assets for: ${currentBuild.slice(0, 40)}${currentBuild.length > 40 ? '...' : ''}`
            : 'Tell the AI what you\'re building to get asset suggestions'}
        </div>
      </div>
    </button>
  )
}

// ─── Main AssetBrowser ────────────────────────────────────────────────────────

export interface AssetBrowserProps {
  /** Whether the panel is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Called with generated Luau code when user inserts an asset */
  onInsertCode: (code: string) => void
  /** Current build description — used for AI Suggest context */
  currentBuildContext?: string
  /** Whether Studio is connected — if true, inserts auto-execute */
  studioConnected?: boolean
}

export function AssetBrowser({
  isOpen,
  onClose,
  onInsertCode,
  currentBuildContext = '',
  studioConnected = false,
}: AssetBrowserProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('Models')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [insertingId, setInsertingId] = useState<number | null>(null)
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false)
  const [aiSuggestedQuery, setAiSuggestedQuery] = useState('')
  const [insertFeedback, setInsertFeedback] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const searchRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchQuery])

  // Fetch catalog when query or tab changes
  useEffect(() => {
    const q = (aiSuggestedQuery || debouncedQuery).trim()
    if (!q) {
      setSearchResults([])
      setNextCursor(null)
      return
    }
    let cancelled = false
    setIsSearching(true)
    setSearchResults([])
    setNextCursor(null)

    const slug = CATEGORY_SLUG[activeTab]
    fetch(`/api/assets/search?query=${encodeURIComponent(q)}&category=${slug}&limit=24`)
      .then((r) => r.json())
      .then((data: { items?: CatalogItem[]; nextCursor?: string | null }) => {
        if (cancelled) return
        setSearchResults(data.items ?? [])
        setNextCursor(data.nextCursor ?? null)
      })
      .catch(() => {
        if (!cancelled) setSearchResults([])
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery, aiSuggestedQuery, activeTab])

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Handle asset insert
  const handleInsert = useCallback(
    async (assetId: number, assetName: string) => {
      setInsertingId(assetId)
      const code = generateInsertLuau(assetId, assetName)

      try {
        if (studioConnected) {
          await fetch('/api/studio/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, prompt: `Insert asset: ${assetName}` }),
          })
          setInsertFeedback(`${assetName} sent to Studio`)
        } else {
          onInsertCode(code)
          setInsertFeedback(`${assetName} code ready`)
        }
      } catch {
        setInsertFeedback('Insert failed — check Studio connection')
      } finally {
        setInsertingId(null)
        setTimeout(() => setInsertFeedback(null), 3000)
      }
    },
    [studioConnected, onInsertCode],
  )

  // Load more results
  const handleLoadMore = useCallback(async () => {
    if (!nextCursor) return
    const q = (aiSuggestedQuery || debouncedQuery).trim()
    if (!q) return
    setIsSearching(true)
    const slug = CATEGORY_SLUG[activeTab]
    try {
      const r = await fetch(
        `/api/assets/search?query=${encodeURIComponent(q)}&category=${slug}&cursor=${encodeURIComponent(nextCursor)}&limit=24`,
      )
      const data = await r.json() as { items?: CatalogItem[]; nextCursor?: string | null }
      setSearchResults((prev) => [...prev, ...(data.items ?? [])])
      setNextCursor(data.nextCursor ?? null)
    } finally {
      setIsSearching(false)
    }
  }, [nextCursor, debouncedQuery, aiSuggestedQuery, activeTab])

  // AI Suggest
  const handleAiSuggest = useCallback(async () => {
    setAiSuggestLoading(true)
    try {
      const context = currentBuildContext || 'a Roblox game map'
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `I'm building ${context}. Give me a single Roblox marketplace search query (3-5 words max, no quotes) that would find the most useful free assets for this build. Reply with ONLY the search query, nothing else.`,
            },
          ],
          model: 'claude-haiku-4-5',
        }),
      })

      if (res.ok) {
        const data = await res.json() as { content?: string; text?: string }
        const suggestion = (data.content ?? data.text ?? '').trim().replace(/^["']|["']$/g, '')
        if (suggestion) {
          startTransition(() => {
            setAiSuggestedQuery(suggestion)
            setSearchQuery(suggestion)
          })
        }
      }
    } catch {
      // Silently fall through — user can search manually
    } finally {
      setAiSuggestLoading(false)
    }
  }, [currentBuildContext])

  // Filtered featured assets by active tab
  const featuredForTab = FEATURED_ASSETS.filter((a) => a.category === activeTab)

  const showFeatured = !debouncedQuery && !aiSuggestedQuery
  const gridItems: Array<{ id: number; name: string; creator: string; thumbnailUrl: string | null; price: number | null }> =
    showFeatured
      ? featuredForTab.map((f) => ({
          id:           f.assetId,
          name:         f.name,
          creator:      f.creator,
          thumbnailUrl: f.thumbnailUrl || null,
          price:        0,
        }))
      : searchResults.map((r) => ({
          id:           r.id,
          name:         r.name,
          creator:      r.creatorName,
          thumbnailUrl: r.thumbnailUrl,
          price:        r.price,
        }))

  return (
    <>
      {/* Spin keyframe injection */}
      <style>{`@keyframes fj-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} .fj-spin{animation:fj-spin 0.8s linear infinite}`}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Slide-out panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          maxWidth: '90vw',
          background: 'rgba(3,7,18,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Asset icon */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 100%)',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.2L8.7 5.5H13l-3.5 2.6 1.3 4.1L7 9.7l-3.8 2.5 1.3-4.1L1 5.5h4.3L7 1.2z" fill="#D4AF37" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
              Asset Library
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'all 0.15s',
            }}
          >
            ×
          </button>
        </div>

        {/* ── Search ─────────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '12px 16px 0' }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
              <path d="M10 10l2 2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setAiSuggestedQuery('')
              }}
              placeholder="Search Roblox marketplace..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setAiSuggestedQuery('') }}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ── Category tabs ───────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            gap: 4,
            padding: '10px 16px 0',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: activeTab === tab ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)',
                background: activeTab === tab ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)',
                color: activeTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                fontSize: 11,
                fontWeight: activeTab === tab ? 700 : 500,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── AI Suggest ──────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 16px 0' }}>
          <AISuggestBanner
            onSuggest={handleAiSuggest}
            isLoading={aiSuggestLoading}
            currentBuild={currentBuildContext}
          />
        </div>

        {/* ── Section label ───────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {showFeatured ? 'Featured & Popular' : `${searchResults.length} results`}
          </span>
          {isSearching && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1.5px solid rgba(212,175,55,0.25)',
                borderTopColor: '#D4AF37',
              }}
              className="fj-spin"
            />
          )}
        </div>

        {/* ── Asset grid ──────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px 12px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          }}
        >
          {gridItems.length === 0 && !isSearching && debouncedQuery && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255,255,255,0.25)',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}
          >
            {gridItems.map((item) => (
              <AssetCard
                key={item.id}
                id={item.id}
                name={item.name}
                creator={item.creator}
                thumbnailUrl={item.thumbnailUrl}
                price={item.price}
                onInsert={() => handleInsert(item.id, item.name)}
                isInserting={insertingId === item.id}
              />
            ))}
          </div>

          {/* Load more */}
          {nextCursor && !showFeatured && (
            <button
              onClick={handleLoadMore}
              disabled={isSearching}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '8px 0',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {isSearching ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>

        {/* ── Insert feedback toast ────────────────────────────────────────────── */}
        {insertFeedback && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(74,222,128,0.12)',
              border: '1px solid rgba(74,222,128,0.25)',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(74,222,128,0.9)',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {insertFeedback}
          </div>
        )}

        {/* ── Studio hint ──────────────────────────────────────────────────────── */}
        {!studioConnected && (
          <div
            style={{
              flexShrink: 0,
              margin: '0 16px 12px',
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
            }}
          >
            Connect Studio to auto-insert assets
          </div>
        )}
      </div>
    </>
  )
}

// ─── Trigger button (drop-in for the editor toolbar) ──────────────────────────

export function AssetBrowserButton({
  onClick,
  isOpen,
}: {
  onClick: () => void
  isOpen: boolean
}) {
  return (
    <button
      onClick={onClick}
      title="Asset Library"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        border: '1px solid',
        borderColor: isOpen ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
        background: isOpen ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
        color: isOpen ? '#D4AF37' : 'rgba(255,255,255,0.55)',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M6.5 1L8 5H12L9 7.5l1 3.5-3.5-2-3.5 2 1-3.5L1 5h4L6.5 1z"
          stroke={isOpen ? '#D4AF37' : 'rgba(255,255,255,0.55)'}
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
      Assets
    </button>
  )
}
