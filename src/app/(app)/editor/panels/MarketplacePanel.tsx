'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ─── Shared types ──────────────────────────────────────────────────────────────

interface RobloxAsset {
  id: number
  name: string
  description: string
  creatorName: string
  price: number
  priceStatus: string | null
  thumbnailUrl: string | null
}

const ASSET_CATEGORIES = ['All', 'Models', 'Meshes', 'Audio', 'Images', 'Plugins'] as const
type AssetCategory = typeof ASSET_CATEGORIES[number]

const CATEGORY_PARAM: Record<AssetCategory, string> = {
  All:     'all',
  Models:  'models',
  Meshes:  'meshes',
  Audio:   'audio',
  Images:  'images',
  Plugins: 'plugins',
}

type GenerateTab = 'marketplace' | 'generate'
type GenerateQuality = 'draft' | 'standard' | 'premium'
type GenerateAssetType = 'mesh' | 'texture'

interface MeshTextures {
  albedo: string
  normal: string
  roughness: string
}

interface GeneratedAsset {
  id: string
  prompt: string
  type: GenerateAssetType
  quality: GenerateQuality
  status: 'loading' | 'complete' | 'demo' | 'error' | 'pending'
  meshUrl?: string | null
  fbxUrl?: string | null
  thumbnailUrl?: string | null
  videoUrl?: string | null
  polygonCount?: number | null
  taskId?: string | null
  textureUrl?: string | null
  normalUrl?: string | null
  roughnessUrl?: string | null
  resolution?: string
  textures?: MeshTextures | null
  luauCode?: string | null
  costEstimateUsd?: number
  createdAt: Date
}

// ─── Community types ───────────────────────────────────────────────────────────

type CommunityAssetCategory = 'Buildings' | 'Vehicles' | 'Nature' | 'Props' | 'Characters' | 'Furniture' | 'Weapons'
type AssetStyle = 'realistic' | 'low-poly' | 'stylized' | 'cartoon'

interface CommunityAssetItem {
  id: string
  name: string
  creator: string
  description: string
  downloads: number
  rating: number
  category: CommunityAssetCategory
  polyCount: number
  style: AssetStyle
  tags: string[]
  gradientFrom: string
  gradientTo: string
}

const COMMUNITY_ASSETS_DATA: CommunityAssetItem[] = [
  // Buildings
  { id: 'bld-001', name: 'Medieval Castle Tower', creator: 'StoneForge3D',   description: 'Tall stone tower with crenellations and arrow slits.',    downloads: 4820,  rating: 4.9, category: 'Buildings',  polyCount: 2100, style: 'realistic',  tags: ['castle','medieval','tower'],    gradientFrom: '#2a2a2a', gradientTo: '#1c1c1c' },
  { id: 'bld-002', name: 'Modern House',          creator: 'ArchViz3D',      description: 'Contemporary house with flat roof and large windows.',   downloads: 6340,  rating: 4.7, category: 'Buildings',  polyCount:  820, style: 'low-poly',   tags: ['house','modern','residential'], gradientFrom: '#475569', gradientTo: '#334155' },
  { id: 'bld-004', name: 'Ruined Stone Wall',     creator: 'RuinsWorkshop',  description: 'Crumbled ancient wall with moss and weathering.',        downloads: 3210,  rating: 4.6, category: 'Buildings',  polyCount:  940, style: 'realistic',  tags: ['ruins','wall','stone'],         gradientFrom: '#B0B0B0', gradientTo: '#2a2a2a' },
  { id: 'bld-005', name: 'Fantasy Tavern',        creator: 'TavernCraft',    description: 'Cozy medieval tavern with thatched roof and warm glow.', downloads: 5570,  rating: 4.9, category: 'Buildings',  polyCount: 1650, style: 'stylized',   tags: ['tavern','inn','medieval'],      gradientFrom: '#92400E', gradientTo: '#78350F' },
  // Vehicles
  { id: 'veh-001', name: 'Sports Car (Red)',      creator: 'AutoMesh3D',     description: 'Sleek sports car with separate wheel meshes.',           downloads: 7120,  rating: 4.8, category: 'Vehicles',   polyCount: 3200, style: 'realistic',  tags: ['car','sports','racing'],        gradientFrom: '#DC2626', gradientTo: '#991B1B' },
  { id: 'veh-002', name: 'Off-Road Truck',        creator: 'TruckMesh',      description: 'Heavy 4x4 with chunky tires and roll cage.',            downloads: 4450,  rating: 4.7, category: 'Vehicles',   polyCount: 2800, style: 'realistic',  tags: ['truck','4x4','offroad'],        gradientFrom: '#065F46', gradientTo: '#064E3B' },
  { id: 'veh-003', name: 'Wooden Sailing Ship',   creator: 'NavalForge',     description: 'Classic tall ship with three masts, pirate-ready.',     downloads: 3890,  rating: 4.9, category: 'Vehicles',   polyCount: 4100, style: 'stylized',   tags: ['ship','pirate','naval'],        gradientFrom: '#92400E', gradientTo: '#6B3A1F' },
  // Nature
  { id: 'nat-001', name: 'Oak Tree (Stylized)',   creator: 'PolyForest',     description: 'Lush oak with summer and autumn color variants.',        downloads: 12400, rating: 4.9, category: 'Nature',     polyCount:  520, style: 'stylized',   tags: ['tree','oak','forest'],          gradientFrom: '#15803D', gradientTo: '#14532D' },
  { id: 'nat-002', name: 'Boulder Pack x3',       creator: 'TerrainKit',     description: 'Three rock boulders in S, M, L sizes.',                 downloads: 9210,  rating: 4.7, category: 'Nature',     polyCount:  380, style: 'realistic',  tags: ['rock','boulder','terrain'],     gradientFrom: '#57534E', gradientTo: '#292524' },
  { id: 'nat-003', name: 'Pine Tree (Winter)',    creator: 'PolyForest',     description: 'Snow-dusted pine with three height variants.',           downloads: 7650,  rating: 4.8, category: 'Nature',     polyCount:  440, style: 'stylized',   tags: ['pine','tree','winter','snow'],  gradientFrom: '#0C4A6E', gradientTo: '#082F49' },
  { id: 'nat-004', name: 'Mushroom Cluster',      creator: 'FairyForge',     description: 'Fantasy mushrooms with optional glowing caps.',          downloads: 5430,  rating: 4.6, category: 'Nature',     polyCount:  290, style: 'cartoon',    tags: ['mushroom','fantasy','magic'],   gradientFrom: '#7C3AED', gradientTo: '#5B21B6' },
  // Props
  { id: 'prp-001', name: 'Treasure Chest',        creator: 'PropFactory',    description: 'Chest with separate lid for open/close animation.',     downloads: 15200, rating: 5.0, category: 'Props',      polyCount:  420, style: 'cartoon',    tags: ['chest','treasure','loot'],      gradientFrom: '#B45309', gradientTo: '#92400E' },
  { id: 'prp-002', name: 'Market Stall',          creator: 'TavernCraft',    description: 'Medieval stall with canopy and hanging goods.',          downloads: 4780,  rating: 4.7, category: 'Props',      polyCount:  560, style: 'stylized',   tags: ['market','stall','shop'],        gradientFrom: '#D97706', gradientTo: '#B45309' },
  { id: 'prp-003', name: 'Wooden Barrel',         creator: 'PropFactory',    description: 'Classic barrel with metal hoops, four size variants.',  downloads: 11300, rating: 4.8, category: 'Props',      polyCount:  160, style: 'realistic',  tags: ['barrel','wood','tavern'],       gradientFrom: '#78350F', gradientTo: '#451A03' },
  { id: 'prp-004', name: 'Campfire',              creator: 'OutdoorKit',     description: 'Fire pit with particle-ready pivot points.',            downloads: 8850,  rating: 4.9, category: 'Props',      polyCount:  240, style: 'stylized',   tags: ['campfire','fire','camp'],       gradientFrom: '#C2410C', gradientTo: '#9A3412' },
  { id: 'prp-005', name: 'Street Lamp (Iron)',    creator: 'PropFactory',    description: 'Victorian iron lamp post for city streets.',            downloads: 8900,  rating: 4.8, category: 'Props',      polyCount:  210, style: 'realistic',  tags: ['lamp','street','urban'],        gradientFrom: '#2a2a2a', gradientTo: '#1c1c1c' },
  // Characters
  { id: 'chr-001', name: 'Knight Warrior',        creator: 'CharacterForge', description: 'Full-plate knight rigged for humanoid animations.',    downloads: 6720,  rating: 4.8, category: 'Characters', polyCount: 2800, style: 'stylized',   tags: ['knight','warrior','armor'],     gradientFrom: '#3730A3', gradientTo: '#312E81' },
  { id: 'chr-002', name: 'Village Merchant',      creator: 'NPCStudio',      description: 'Friendly NPC with idle and talking animations.',       downloads: 4120,  rating: 4.6, category: 'Characters', polyCount: 1900, style: 'cartoon',    tags: ['npc','merchant','villager'],    gradientFrom: '#B45309', gradientTo: '#92400E' },
  // Furniture
  { id: 'fur-001', name: 'Wooden Chair',          creator: 'InteriorKit',    description: 'Handcrafted chair with optional cushion variant.',     downloads: 9340,  rating: 4.7, category: 'Furniture',  polyCount:  180, style: 'realistic',  tags: ['chair','furniture','interior'], gradientFrom: '#7C2D12', gradientTo: '#431407' },
  { id: 'fur-002', name: 'King Throne',           creator: 'RoyalProps',     description: 'Ornate throne with velvet cushion and gold crown.',    downloads: 5640,  rating: 4.9, category: 'Furniture',  polyCount:  780, style: 'stylized',   tags: ['throne','king','royal'],        gradientFrom: '#78350F', gradientTo: '#451A03' },
  // Weapons
  { id: 'wpn-001', name: 'Broad Sword',           creator: 'ArmoryForge',    description: 'One-handed broadsword, grip point clearly marked.',    downloads: 13800, rating: 4.8, category: 'Weapons',    polyCount:  340, style: 'realistic',  tags: ['sword','medieval','combat'],    gradientFrom: '#475569', gradientTo: '#0F172A' },
  { id: 'wpn-002', name: 'Magic Staff',           creator: 'MagicProps',     description: 'Wizard staff with separate glowing crystal orb.',     downloads: 8230,  rating: 4.9, category: 'Weapons',    polyCount:  460, style: 'stylized',   tags: ['staff','magic','wizard'],       gradientFrom: '#5B21B6', gradientTo: '#4C1D95' },
  { id: 'wpn-003', name: 'Crossbow',              creator: 'ArmoryForge',    description: 'Medieval crossbow with carved stock and bolt mesh.',  downloads: 5910,  rating: 4.7, category: 'Weapons',    polyCount:  580, style: 'realistic',  tags: ['crossbow','ranged','medieval'], gradientFrom: '#2a2a2a', gradientTo: '#1c1c1c' },
  { id: 'wpn-004', name: 'Battle Axe',            creator: 'ArmoryForge',    description: 'Double-headed axe with runic engravings.',            downloads: 7460,  rating: 4.8, category: 'Weapons',    polyCount:  490, style: 'stylized',   tags: ['axe','battle-axe','warrior'],   gradientFrom: '#7C3AED', gradientTo: '#5B21B6' },
]

const COMMUNITY_CATEGORIES = ['All', 'Buildings', 'Vehicles', 'Nature', 'Props', 'Characters', 'Furniture', 'Weapons'] as const
type CommunityCategoryLabel = typeof COMMUNITY_CATEGORIES[number]

const SORT_OPTIONS = ['Popular', 'New', 'Top Rated'] as const
type SortLabel = typeof SORT_OPTIONS[number]

const STYLE_COLORS: Record<AssetStyle, string> = {
  realistic: '#B0B0B0',
  'low-poly': '#0891B2',
  stylized: '#7C3AED',
  cartoon: '#D97706',
}

function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
  return String(n)
}

function formatPoly(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating)
  const frac  = rating - full
  const empty = 5 - full - (frac > 0 ? 1 : 0)
  return (
    <span className="flex items-center gap-px">
      {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} className="text-[#FFB81C] text-[9px]">&#9733;</span>)}
      {frac > 0 && <span className="text-[#FFB81C]/50 text-[9px]">&#9733;</span>}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-gray-600 text-[9px]">&#9733;</span>)}
    </span>
  )
}

function generateInsertLuau(asset: CommunityAssetItem): string {
  const varName = asset.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '')
  const catHint: Record<CommunityAssetCategory, string> = {
    Buildings: 'anchor and position on terrain',
    Vehicles:  'attach VehicleSeat for drivable version',
    Nature:    'randomise Y rotation for natural variation',
    Props:     'add ProximityPrompt for interaction',
    Characters:'attach Humanoid and scripts for NPC behavior',
    Furniture: 'place inside building interior',
    Weapons:   'parent to StarterPack or player backpack',
  }
  return [
    `-- ForjeAI: Insert "${asset.name}" (${asset.polyCount.toLocaleString()} polys, ${asset.style})`,
    `-- ${asset.category}: ${catHint[asset.category]}`,
    `-- Download GLB: /api/community/assets/${asset.id} then replace ASSET_ID`,
    ``,
    `local function insert${varName}(position: Vector3)`,
    `  local mesh = Instance.new("MeshPart")`,
    `  mesh.Name = "${asset.name}"`,
    `  mesh.MeshId = "rbxassetid://ASSET_ID"`,
    `  mesh.Size = Vector3.new(1, 1, 1)`,
    `  mesh.CFrame = CFrame.new(position)`,
    `  mesh.Anchored = true`,
    `  mesh.Material = Enum.Material.SmoothPlastic`,
    `  mesh.Parent = workspace`,
    `  return mesh`,
    `end`,
    ``,
    `local placed = insert${varName}(Vector3.new(0, 0, 0))`,
    `print("Placed ${asset.name} at", placed.Position)`,
  ].join('\n')
}

function AssetThumbnail({ asset }: { asset: RobloxAsset }) {
  const [imgError, setImgError] = useState(false)
  const src =
    asset.thumbnailUrl && !imgError
      ? `/api/roblox/thumbnail?id=${asset.id}&size=150x150`
      : null

  if (!src) {
    return (
      <div className="w-full h-16 rounded-md bg-white/5 flex items-center justify-center mb-2">
        <svg className="w-5 h-5 text-gray-700" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative mb-2 h-16 w-full overflow-hidden rounded-md bg-white/5">
      <Image
        src={src}
        alt={asset.name}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
        unoptimized
      />
    </div>
  )
}

function AssetSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-white/8 bg-white/[0.03] p-2.5">
      <div className="mb-2 h-16 w-full rounded-md bg-white/[0.08]" />
      <div className="mb-1.5 h-2.5 w-3/4 rounded bg-white/[0.08]" />
      <div className="h-2 w-1/2 rounded bg-white/5" />
    </div>
  )
}

function GeneratedAssetCard({ asset }: { asset: GeneratedAsset }) {
  const isLoading = asset.status === 'loading'
  const isPending = asset.status === 'pending'
  const isDemo    = asset.status === 'demo'
  const isError   = asset.status === 'error'
  const isWorking = isLoading || isPending
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }
  }, [])

  const previewImg = asset.thumbnailUrl ?? asset.textures?.albedo ?? asset.textureUrl ?? null

  function handleImportToStudio() {
    if (!asset.luauCode) return
    navigator.clipboard.writeText(asset.luauCode).then(() => {
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2.5 space-y-2">
      <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-md bg-white/5">
        {isWorking && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FFB81C]/30 border-t-[#FFB81C]"/>
            <span className="text-[9px] text-gray-500">{isPending ? 'Mesh generating…' : 'Generating…'}</span>
          </div>
        )}
        {!isWorking && !isError && previewImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewImg} alt={asset.prompt} className="h-full w-full object-contain"/>
        )}
        {!isWorking && !isError && !previewImg && (
          <div className="flex flex-col items-center gap-1 text-gray-700">
            <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M14 3V25M3 9L14 15M25 9L14 15" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4"/>
            </svg>
            <span className="text-[8px]">No preview</span>
          </div>
        )}
        {isError && <span className="text-[10px] text-red-400">Failed</span>}
        {isDemo && <span className="absolute right-1 top-1 rounded bg-[#FFB81C]/20 px-1 py-0.5 text-[8px] font-bold text-[#FFB81C]">DEMO</span>}
        {asset.status === 'complete' && asset.meshUrl && <span className="absolute left-1 top-1 rounded bg-emerald-500/20 px-1 py-0.5 text-[8px] font-bold text-emerald-400">GLB READY</span>}
        {isPending && <span className="absolute left-1 top-1 rounded bg-blue-500/20 px-1 py-0.5 text-[8px] font-bold text-blue-400">PENDING</span>}
      </div>

      {asset.textures && (
        <div className="flex gap-1">
          {[
            { label: 'Albedo',  url: asset.textures.albedo },
            { label: 'Normal',  url: asset.textures.normal },
            { label: 'Rough',   url: asset.textures.roughness },
          ].map(({ label, url }) => (
            <div key={label} className="flex-1 relative overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={label} className="w-full h-8 object-cover" />
              <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] text-white/70 bg-black/60 py-0.5">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="truncate text-[11px] font-medium leading-tight text-gray-300" title={asset.prompt}>{asset.prompt}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] text-gray-600">{asset.type === 'mesh' ? '3D Model' : 'Texture'}</span>
          <span className="text-[9px] text-gray-700">·</span>
          <span className="text-[9px] capitalize text-gray-600">{asset.quality}</span>
          {asset.polygonCount != null && <><span className="text-[9px] text-gray-700">·</span><span className="text-[9px] text-gray-600">{asset.polygonCount.toLocaleString()} poly</span></>}
          {asset.resolution && <><span className="text-[9px] text-gray-700">·</span><span className="text-[9px] text-gray-600">{asset.resolution}px</span></>}
          {(asset.costEstimateUsd ?? 0) > 0 && <><span className="text-[9px] text-gray-700">·</span><span className="text-[9px] text-emerald-600">${asset.costEstimateUsd!.toFixed(3)}</span></>}
        </div>
      </div>

      {!isWorking && !isError && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {asset.meshUrl && (
              <a href={asset.meshUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded bg-white/5 px-2 py-1 text-center text-[9px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                GLB
              </a>
            )}
            {asset.fbxUrl && (
              <a href={asset.fbxUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded bg-white/5 px-2 py-1 text-center text-[9px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                FBX
              </a>
            )}
            {(asset.textureUrl ?? asset.textures?.albedo) && (
              <a href={asset.textureUrl ?? asset.textures?.albedo} target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded bg-white/5 px-2 py-1 text-center text-[9px] font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                Texture
              </a>
            )}
          </div>
          {asset.luauCode && (
            <button
              onClick={handleImportToStudio}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold transition-all"
              style={{
                background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(255,184,28,0.1)',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,184,28,0.25)'}`,
                color: copied ? '#4ADE80' : '#FFB81C',
              }}
            >
              {copied ? (
                <><svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied!</>
              ) : (
                <><svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M5 1h4a1 1 0 011 1v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>Copy MeshPart Luau &rarr; Import to Studio</>
              )}
            </button>
          )}
          {isDemo && !asset.meshUrl && !asset.textureUrl && (
            <p className="text-[9px] italic text-gray-700 text-center">Set MESHY_API_KEY + FAL_KEY for real assets</p>
          )}
        </div>
      )}
    </div>
  )
}

function GenerateSubPanel() {
  const [genPrompt, setGenPrompt]             = useState('')
  const [genQuality, setGenQuality]           = useState<GenerateQuality>('standard')
  const [genType, setGenType]                 = useState<GenerateAssetType>('mesh')
  const [isGenerating, setIsGenerating]       = useState(false)
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([])
  const [genError, setGenError]               = useState<string | null>(null)

  async function handleGenerate() {
    if (!genPrompt.trim() || isGenerating) return
    setGenError(null)
    setIsGenerating(true)
    const id = crypto.randomUUID()
    setGeneratedAssets((prev) => [
      { id, prompt: genPrompt.trim(), type: genType, quality: genQuality, status: 'loading', thumbnailUrl: null, createdAt: new Date() },
      ...prev,
    ])
    try {
      if (genType === 'mesh') {
        const res = await fetch('/api/ai/mesh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: genPrompt.trim(), quality: genQuality, withTextures: true }),
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = (await res.json()) as {
          meshUrl?: string | null
          fbxUrl?: string | null
          thumbnailUrl?: string | null
          videoUrl?: string | null
          polygonCount?: number | null
          textures?: { albedo: string; normal: string; roughness: string } | null
          luauCode?: string | null
          costEstimateUsd?: number
          status: string
          taskId?: string | null
        }

        const nextStatus: GeneratedAsset['status'] =
          data.status === 'demo' ? 'demo' :
          data.status === 'pending' ? 'pending' :
          data.status === 'complete' ? 'complete' : 'loading'

        setGeneratedAssets((prev) => prev.map((a) => a.id !== id ? a : {
          ...a,
          status: nextStatus,
          meshUrl: data.meshUrl,
          fbxUrl: data.fbxUrl,
          thumbnailUrl: data.thumbnailUrl,
          videoUrl: data.videoUrl,
          polygonCount: data.polygonCount,
          textures: data.textures,
          luauCode: data.luauCode,
          costEstimateUsd: data.costEstimateUsd,
          taskId: data.taskId,
        }))
      } else {
        const res = await fetch('/api/ai/texture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: genPrompt.trim(), resolution: '1024', seamless: true }),
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = (await res.json()) as {
          textureUrl?: string | null
          normalUrl?: string | null
          roughnessUrl?: string | null
          resolution?: string
          luauCode?: string | null
          costEstimateUsd?: number
          status: string
        }
        const nextStatus: GeneratedAsset['status'] = data.status === 'demo' ? 'demo' : data.status === 'complete' ? 'complete' : 'loading'
        setGeneratedAssets((prev) => prev.map((a) => a.id !== id ? a : {
          ...a,
          status: nextStatus,
          textureUrl: data.textureUrl,
          normalUrl: data.normalUrl,
          roughnessUrl: data.roughnessUrl,
          thumbnailUrl: data.textureUrl,
          textures: data.textureUrl && data.normalUrl && data.roughnessUrl
            ? { albedo: data.textureUrl, normal: data.normalUrl, roughness: data.roughnessUrl }
            : null,
          resolution: data.resolution,
          luauCode: data.luauCode,
          costEstimateUsd: data.costEstimateUsd,
        }))
      }
      setGenPrompt('')
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
      setGeneratedAssets((prev) => prev.map((a) => a.id === id ? { ...a, status: 'error' as const } : a))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-1">
        {(['mesh', 'texture'] as const).map((t) => (
          <button key={t} onClick={() => setGenType(t)} className={['flex-1 rounded-lg py-1.5 text-[10px] font-semibold transition-colors', genType === t ? 'border border-[#FFB81C]/40 bg-[#FFB81C]/20 text-[#FFB81C]' : 'border border-white/10 bg-white/5 text-gray-500 hover:text-gray-300'].join(' ')}>
            {t === 'mesh' ? '3D Model' : 'Texture'}
          </button>
        ))}
      </div>
      <textarea
        value={genPrompt}
        onChange={(e) => setGenPrompt(e.target.value)}
        placeholder={genType === 'mesh' ? 'Describe what you want to generate...\ne.g. "medieval castle tower"' : 'Describe the texture...\ne.g. "mossy stone wall with cracks"'}
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:border-[#FFB81C]/50 focus:outline-none"
      />
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">Quality</p>
        <div className="flex gap-1">
          {(['draft', 'standard', 'premium'] as const).map((q) => (
            <button key={q} onClick={() => setGenQuality(q)} className={['flex-1 rounded py-1 text-[10px] font-semibold capitalize transition-colors', genQuality === q ? 'bg-[#FFB81C] text-black' : 'border border-white/10 bg-white/5 text-gray-500 hover:text-gray-300'].join(' ')}>{q}</button>
          ))}
        </div>
      </div>
      {genError && <p className="rounded border border-red-400/20 bg-red-400/10 px-2 py-1.5 text-[10px] text-red-400">{genError}</p>}
      <button
        onClick={handleGenerate}
        disabled={!genPrompt.trim() || isGenerating}
        className={['w-full rounded-lg py-2 text-xs font-bold transition-all', !genPrompt.trim() || isGenerating ? 'cursor-not-allowed bg-white/5 text-gray-600' : 'bg-[#FFB81C] text-black hover:bg-[#FFB81C]/90 active:scale-95'].join(' ')}
      >
        {isGenerating ? 'Generating...' : `Generate ${genType === 'mesh' ? '3D Model' : 'Texture'}`}
      </button>
      {generatedAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">Generated</p>
          {generatedAssets.map((asset) => <GeneratedAssetCard key={asset.id} asset={asset} />)}
        </div>
      )}
    </div>
  )
}

function RobloxMarketplacePanel() {
  const [activeTab, setActiveTab] = useState<GenerateTab>('marketplace')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('All')
  const [results, setResults] = useState<RobloxAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    let cancelled = false
    async function fetchAssets() {
      setLoading(true)
      setError(null)
      try {
        const cat = CATEGORY_PARAM[activeCategory]
        const endpoint = debouncedQuery.trim()
          ? `/api/roblox/search?query=${encodeURIComponent(debouncedQuery.trim())}&category=${cat}`
          : `/api/roblox/trending?category=${cat}`
        const res = await fetch(endpoint)
        if (!res.ok) throw new Error(`API ${res.status}`)
        const json = await res.json()
        if (!cancelled) setResults(json.results ?? [])
      } catch {
        if (!cancelled) setError('Could not load marketplace. Check your connection.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAssets()
    return () => { cancelled = true }
  }, [debouncedQuery, activeCategory, retryKey])

  async function handleAddToGame(asset: RobloxAsset) {
    setAddingId(asset.id)
    try {
      await fetch('/api/studio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'insertAsset', assetId: asset.id, assetName: asset.name }),
      })
    } finally {
      setAddingId(null)
    }
  }

  function formatPrice(asset: RobloxAsset): { label: string; free: boolean } {
    if (asset.priceStatus === 'Free' || asset.price === 0) return { label: 'Free', free: true }
    if (asset.priceStatus === 'OffSale') return { label: 'Off Sale', free: false }
    if (asset.price > 0) return { label: `R$ ${asset.price}`, free: false }
    return { label: 'Free', free: true }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b border-white/10">
        {(['marketplace', 'generate'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 py-2.5 text-[11px] font-semibold transition-colors',
              activeTab === tab ? 'border-b-2 border-[#FFB81C] text-[#FFB81C]' : 'text-gray-500 hover:text-gray-300',
            ].join(' ')}
          >
            {tab === 'generate' ? '+ Generate' : 'Marketplace'}
          </button>
        ))}
      </div>

      {activeTab === 'generate' && <GenerateSubPanel />}

      {activeTab === 'marketplace' && <>
      <div className="flex-shrink-0 space-y-3 p-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search marketplace..."
            maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-gray-300 placeholder-gray-600 focus:border-[#FFB81C]/50 focus:outline-none"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border border-[#FFB81C] border-t-transparent" />
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors',
                activeCategory === cat
                  ? 'bg-[#FFB81C] text-black'
                  : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-gray-200',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {error ? (
          <div className="py-6 text-center">
            <p className="mb-2 text-xs text-red-400/80">{error}</p>
            <button onClick={() => setRetryKey((k) => k + 1)} className="text-[10px] text-[#FFB81C] hover:underline">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <AssetSkeleton key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-600">
            {debouncedQuery ? 'No results found' : 'Loading marketplace...'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {results.map((asset) => {
              const { label, free } = formatPrice(asset)
              const isAdding = addingId === asset.id
              return (
                <div key={asset.id} className="flex flex-col rounded-lg border border-white/8 bg-white/[0.03] p-2.5 transition-colors hover:border-white/[0.18]">
                  <AssetThumbnail asset={asset} />
                  <p className="line-clamp-2 flex-1 text-[11px] font-medium leading-tight text-gray-300" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] text-gray-600">{asset.creatorName}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={['text-[10px] font-bold', free ? 'text-emerald-400' : 'text-[#FFB81C]'].join(' ')}>
                      {label}
                    </span>
                    <button
                      onClick={() => handleAddToGame(asset)}
                      disabled={isAdding}
                      className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      {isAdding ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-white/[0.06] px-3 py-2">
        <p className="text-center text-[9px] text-gray-700">Powered by Roblox Marketplace</p>
      </div>
      </>}
    </div>
  )
}

function CommunityTab({ onInsertAsset }: { onInsertAsset?: (luau: string, name: string) => void }) {
  const [activeCat, setActiveCat] = useState<CommunityCategoryLabel>('All')
  const [sort, setSort]           = useState<SortLabel>('Popular')
  const [query, setQuery]         = useState('')
  const [inserted, setInserted]   = useState<Set<string>>(new Set())

  const filtered = COMMUNITY_ASSETS_DATA.filter((a) => {
    if (activeCat !== 'All' && a.category !== activeCat) return false
    const q = query.trim().toLowerCase()
    if (q && !a.name.toLowerCase().includes(q) && !a.creator.toLowerCase().includes(q) &&
        !a.tags.some(t => t.includes(q)) && !a.description.toLowerCase().includes(q)) return false
    return true
  }).sort((a, b) => {
    if (sort === 'Popular')   return b.downloads - a.downloads
    if (sort === 'Top Rated') return b.rating - a.rating || b.downloads - a.downloads
    return b.id.localeCompare(a.id)
  })

  const handleInsert = (asset: CommunityAssetItem) => {
    setInserted((prev) => new Set(prev).add(asset.id))
    onInsertAsset?.(generateInsertLuau(asset), asset.name)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 space-y-2 p-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 3D assets..."
            maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-gray-300 placeholder-gray-600 focus:border-[#FFB81C]/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {COMMUNITY_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={['rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors',
                activeCat === cat ? 'bg-[#FFB81C] text-black' : 'border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200',
              ].join(' ')}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-medium text-gray-600">Sort:</span>
            {SORT_OPTIONS.map((s) => (
              <button key={s} onClick={() => setSort(s)}
                className={['rounded px-1.5 py-0.5 text-[9px] font-semibold transition-colors',
                  sort === s ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300',
                ].join(' ')}>
                {s}
              </button>
            ))}
          </div>
          <span className="text-[9px] text-gray-600">{filtered.length} assets</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-gray-600">No assets match</p>
            <button onClick={() => { setQuery(''); setActiveCat('All') }}
              className="text-[10px] text-[#FFB81C]/70 hover:text-[#FFB81C] transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((asset) => {
              const isIns = inserted.has(asset.id)
              return (
                <div key={asset.id} className="overflow-hidden rounded-lg border border-white/8 bg-white/[0.02] transition-all hover:border-white/[0.18]">
                  <div className="relative flex h-14 w-full items-end justify-between p-1.5"
                    style={{ background: `linear-gradient(135deg, ${asset.gradientFrom}, ${asset.gradientTo})` }}>
                    <span className="rounded px-1 py-0.5 text-[7px] font-bold text-white/90"
                      style={{ background: STYLE_COLORS[asset.style] + 'CC' }}>
                      {asset.style}
                    </span>
                    <span className="rounded bg-black/50 px-1 py-0.5 text-[7px] font-mono text-white/80">
                      {formatPoly(asset.polyCount)}p
                    </span>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="truncate text-[10px] font-semibold leading-tight text-gray-200" title={asset.name}>{asset.name}</p>
                    <p className="text-[9px] text-gray-500 leading-tight line-clamp-2">{asset.description}</p>
                    <p className="text-[9px] text-gray-600">@{asset.creator}</p>
                    <div className="flex items-center gap-1 pt-0.5">
                      <StarRating rating={asset.rating} />
                      <span className="text-[8px] text-gray-500">{asset.rating.toFixed(1)}</span>
                      <span className="ml-auto text-[8px] text-gray-600">{formatDownloads(asset.downloads)} dl</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                    <button onClick={() => handleInsert(asset)} disabled={isIns}
                      className={['rounded py-1 text-[8px] font-bold transition-all',
                        isIns ? 'cursor-default bg-emerald-500/20 text-emerald-400' : 'bg-[#FFB81C]/15 text-[#FFB81C] hover:bg-[#FFB81C]/25 active:scale-95',
                      ].join(' ')}>
                      {isIns ? 'Inserted' : 'Insert'}
                    </button>
                    <a href={`/api/community/assets/${asset.id}`} target="_blank" rel="noreferrer"
                      className="rounded py-1 text-[8px] font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-center">
                      Details
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-white/8 p-3">
        <button
          onClick={() => onInsertAsset?.('-- Open the Generate tab to create a custom 3D mesh with Meshy AI', 'Custom Asset')}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#FFB81C]/30 bg-[#FFB81C]/10 py-2 text-[10px] font-semibold text-[#FFB81C] transition-colors hover:bg-[#FFB81C]/20">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Generate Custom 3D Asset
        </button>
      </div>
    </div>
  )
}

function GenerateTab() {
  const [prompt, setPrompt]         = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated]   = useState<{ name: string; gradient: [string, string] } | null>(null)

  const handleGenerate = () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated({ name: prompt.trim(), gradient: ['#7C3AED', '#4338CA'] })
    }, 1600)
  }

  return (
    <div className="flex h-full flex-col space-y-3 p-3">
      <p className="text-[10px] text-gray-500">Describe an asset and AI will generate it.</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. A low-poly medieval castle with four towers..."
        rows={3}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:border-[#FFB81C]/50 focus:outline-none"
      />
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || generating}
        className="w-full rounded-lg bg-[#FFB81C] py-2 text-xs font-bold text-black transition-colors hover:bg-[#E6A519] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {generating ? 'Generating...' : 'Generate Asset'}
      </button>
      {generated && (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
          <div
            className="flex h-20 w-full items-center justify-center text-3xl"
            style={{ background: `linear-gradient(135deg, ${generated.gradient[0]}, ${generated.gradient[1]})` }}
          >
            &#10024;
          </div>
          <div className="p-2.5">
            <p className="text-[11px] font-semibold text-gray-200">{generated.name}</p>
            <p className="mt-0.5 text-[9px] text-gray-500">AI Generated &mdash; Ready to use</p>
            <button className="mt-2 w-full rounded bg-[#FFB81C]/15 py-1 text-[9px] font-bold text-[#FFB81C] transition-colors hover:bg-[#FFB81C]/30">
              Use in Game
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────────

type AssetTab = 'roblox' | 'generate' | 'community'

export interface MarketplacePanelProps {
  onInsertAsset?: (luau: string, name: string) => void
}

export default function MarketplacePanel({ onInsertAsset }: MarketplacePanelProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('community')

  const tabs: { id: AssetTab; label: string }[] = [
    { id: 'community', label: 'Community' },
    { id: 'roblox',    label: 'Roblox'    },
    { id: 'generate',  label: 'Generate'  },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 p-3 pb-0">
        <div className="flex gap-0.5 rounded-lg bg-white/5 p-0.5">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                'flex-1 rounded-md py-1.5 text-[10px] font-semibold transition-all',
                activeTab === id
                  ? 'bg-[#FFB81C] text-black shadow-sm'
                  : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'roblox'    && <RobloxMarketplacePanel />}
        {activeTab === 'generate'  && <GenerateTab />}
        {activeTab === 'community' && <CommunityTab onInsertAsset={onInsertAsset} />}
      </div>
    </div>
  )
}
