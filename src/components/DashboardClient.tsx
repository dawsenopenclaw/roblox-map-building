'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  firstName: string
  subscription: string
}

interface TokenData {
  balance: number
  lifetimeSpent: number
  planLimit: number
}

type ElementType = 'folder' | 'terrain' | 'building' | 'npc' | 'script' | 'ui' | 'workspace'

interface GameElement {
  id: string
  label: string
  type: ElementType
  children?: GameElement[]
  expanded?: boolean
}

interface RecentCommand {
  id: string
  text: string
  tokensUsed: number
  timestamp: number
  status: 'done' | 'running' | 'failed'
}

interface SelectedElement {
  id: string
  label: string
  type: ElementType
  position: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  material: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const AUTOCOMPLETE_SUGGESTIONS = [
  'Build a castle with stone walls',
  'Add terrain: forest biome',
  'Place NPC: shopkeeper at (0, 0, 0)',
  'Generate UI: health bar',
  'Create a racing track with banked curves',
  'Add ambient lighting: golden hour',
  'Spawn 10 trees randomly across terrain',
  'Build a water fountain centerpiece',
]

const INITIAL_TREE: GameElement[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    type: 'workspace',
    expanded: true,
    children: [
      { id: 'terrain', label: 'Terrain', type: 'terrain' },
      {
        id: 'buildings',
        label: 'Buildings',
        type: 'folder',
        expanded: true,
        children: [
          { id: 'b1', label: 'Castle_Main', type: 'building' },
          { id: 'b2', label: 'Market_Stall', type: 'building' },
          { id: 'b3', label: 'Watchtower', type: 'building' },
        ],
      },
      {
        id: 'npcs',
        label: 'NPCs',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'n1', label: 'Shopkeeper', type: 'npc' },
          { id: 'n2', label: 'Guard_01', type: 'npc' },
        ],
      },
      {
        id: 'scripts',
        label: 'Scripts',
        type: 'folder',
        expanded: false,
        children: [
          { id: 's1', label: 'GameInit', type: 'script' },
          { id: 's2', label: 'PlayerController', type: 'script' },
          { id: 's3', label: 'EconomyManager', type: 'script' },
          { id: 's4', label: 'UIController', type: 'script' },
        ],
      },
      { id: 'ui', label: 'UI Elements', type: 'ui' },
    ],
  },
]

const DEMO_COMMANDS: RecentCommand[] = [
  { id: '1', text: 'Build a stone castle entrance arch', tokensUsed: 12, timestamp: Date.now() - 1000 * 60 * 8, status: 'done' },
  { id: '2', text: 'Add forest terrain around the perimeter', tokensUsed: 24, timestamp: Date.now() - 1000 * 60 * 23, status: 'done' },
  { id: '3', text: 'Place shopkeeper NPC near market stall', tokensUsed: 8, timestamp: Date.now() - 1000 * 60 * 45, status: 'done' },
]

const ELEMENT_ICONS: Record<ElementType, string> = {
  workspace: '🌐',
  folder: '📁',
  terrain: '🏔️',
  building: '🏗️',
  npc: '👤',
  script: '📜',
  ui: '🎨',
}

const ELEMENT_COLORS: Record<ElementType, string> = {
  workspace: 'text-blue-400',
  folder: 'text-yellow-400',
  terrain: 'text-green-400',
  building: 'text-orange-400',
  npc: 'text-purple-400',
  script: 'text-cyan-400',
  ui: 'text-pink-400',
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  selected,
  onSelect,
  onToggle,
}: {
  node: GameElement
  depth: number
  selected: string | null
  onSelect: (node: GameElement) => void
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selected === node.id

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect(node)
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors text-left group ${
          isSelected
            ? 'bg-[#FFB81C]/15 text-white'
            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {hasChildren ? (
          <span className="text-gray-500 w-3 flex-shrink-0 text-center">
            {node.expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className="text-sm flex-shrink-0">{ELEMENT_ICONS[node.type]}</span>
        <span className={`truncate font-mono ${isSelected ? 'text-white' : ELEMENT_COLORS[node.type]}`}>
          {node.label}
        </span>
        {node.children && (
          <span className="ml-auto text-gray-600 text-xs flex-shrink-0">
            {node.children.length}
          </span>
        )}
      </button>

      {hasChildren && node.expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ViewportGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="small-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#3B4580" strokeWidth="0.5" />
        </pattern>
        <pattern id="large-grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#small-grid)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#4B5590" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#large-grid)" />
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function DashboardClient({ firstName, subscription }: DashboardProps) {
  const { data: tokenData } = useSWR<TokenData>('/api/tokens/balance', fetcher, {
    refreshInterval: 30000,
  })

  const [tree, setTree] = useState<GameElement[]>(INITIAL_TREE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedProps, setSelectedProps] = useState<SelectedElement | null>(null)
  const [command, setCommand] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>(DEMO_COMMANDS)
  const [projectName] = useState('My First Game')
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const commandRef = useRef<HTMLInputElement>(null)

  const tokenBalance = tokenData?.balance ?? 142

  const filteredSuggestions = command.length > 1
    ? AUTOCOMPLETE_SUGGESTIONS.filter((s) => s.toLowerCase().includes(command.toLowerCase()))
    : AUTOCOMPLETE_SUGGESTIONS.slice(0, 4)

  const toggleNode = useCallback((id: string) => {
    const toggle = (nodes: GameElement[]): GameElement[] =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, expanded: !n.expanded }
          : n.children
          ? { ...n, children: toggle(n.children) }
          : n
      )
    setTree((prev) => toggle(prev))
  }, [])

  const selectNode = useCallback((node: GameElement) => {
    setSelectedId(node.id)
    if (node.type !== 'folder' && node.type !== 'workspace') {
      setSelectedProps({
        id: node.id,
        label: node.label,
        type: node.type,
        position: { x: Math.floor(Math.random() * 200 - 100), y: 0, z: Math.floor(Math.random() * 200 - 100) },
        size: { x: 10, y: 8, z: 10 },
        material: node.type === 'terrain' ? 'Grass' : node.type === 'building' ? 'SmoothPlastic' : 'Neon',
      })
    } else {
      setSelectedProps(null)
    }
  }, [])

  const submitCommand = useCallback(async () => {
    if (!command.trim() || isSubmitting) return
    const text = command.trim()
    setCommand('')
    setShowSuggestions(false)
    setIsSubmitting(true)

    const newCmd: RecentCommand = {
      id: Date.now().toString(),
      text,
      tokensUsed: 0,
      timestamp: Date.now(),
      status: 'running',
    }
    setRecentCommands((prev) => [newCmd, ...prev.slice(0, 9)])

    try {
      const res = await fetch('/api/build/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text }),
      })
      const data = await res.json()
      setRecentCommands((prev) =>
        prev.map((c) =>
          c.id === newCmd.id
            ? { ...c, tokensUsed: data.tokensUsed ?? 10, status: 'done' }
            : c
        )
      )
    } catch {
      setRecentCommands((prev) =>
        prev.map((c) =>
          c.id === newCmd.id ? { ...c, status: 'failed' } : c
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [command, isSubmitting])

  // Keyboard: Enter to submit, Escape to close suggestions
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSuggestions(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#0A0E1A] text-white" style={{ height: 'calc(100vh - 0px)' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="h-11 bg-[#0D1020] border-b border-white/8 flex items-center px-4 gap-4 flex-shrink-0 select-none">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-6 h-6 rounded bg-[#FFB81C] flex items-center justify-center flex-shrink-0">
            <span className="text-[#0A0E1A] text-xs font-black">R</span>
          </div>
          <span className="text-white font-bold text-sm hidden sm:block">RobloxForge</span>
        </div>

        {/* Project name dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 border border-white/10 text-sm text-gray-200 transition-colors"
          >
            <span className="text-gray-500 text-xs">📁</span>
            <span className="font-medium">{projectName}</span>
            <svg className="w-3 h-3 text-gray-500 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#111425] border border-white/10 rounded-lg shadow-xl z-50 py-1">
              <div className="px-3 py-2 border-b border-white/8 mb-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Recent Projects</p>
              </div>
              {['My First Game', 'Medieval Castle', 'Tropical Island'].map((p) => (
                <button
                  key={p}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    p === projectName ? 'text-[#FFB81C] bg-[#FFB81C]/8' : 'text-gray-300 hover:bg-white/5'
                  }`}
                  onClick={() => setShowProjectMenu(false)}
                >
                  {p}
                </button>
              ))}
              <div className="border-t border-white/8 mt-1 pt-1">
                <Link href="/voice" className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5">
                  + New project
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Token balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFB81C]/8 border border-[#FFB81C]/20 text-sm">
          <span className="text-[#FFB81C] text-xs">⚡</span>
          <span className="text-[#FFB81C] font-bold">{tokenBalance.toLocaleString()}</span>
          <span className="text-[#FFB81C]/60 text-xs hidden sm:block">tokens</span>
        </div>

        {/* Profile avatar */}
        <Link
          href="/settings"
          className="w-7 h-7 rounded-full bg-[#FFB81C]/20 border border-[#FFB81C]/30 flex items-center justify-center text-[#FFB81C] text-xs font-bold hover:bg-[#FFB81C]/30 transition-colors"
          aria-label="Profile settings"
        >
          {firstName.charAt(0).toUpperCase()}
        </Link>
      </div>

      {/* ── Body (explorer + viewport + properties) ──────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left sidebar — Project Navigator / Explorer */}
        <aside className="w-56 bg-[#0D1020] border-r border-white/8 flex flex-col flex-shrink-0">
          {/* Explorer header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Explorer</span>
            <button
              className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
              aria-label="Add element"
              title="Add new element"
            >
              +
            </button>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selected={selectedId}
                onSelect={selectNode}
                onToggle={toggleNode}
              />
            ))}
          </div>

          {/* Add element button */}
          <div className="p-2 border-t border-white/8">
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-dashed border-white/10 hover:border-white/20">
              <span>+</span>
              <span>Add element</span>
            </button>
          </div>
        </aside>

        {/* Center — 3D Viewport */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[#080B16]">
          {/* Viewport toolbar */}
          <div className="h-8 bg-[#0B0E1C] border-b border-white/8 flex items-center px-3 gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              {['Perspective', 'Top', 'Front', 'Side'].map((v, i) => (
                <button
                  key={v}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    i === 0 ? 'bg-[#FFB81C]/15 text-[#FFB81C] border border-[#FFB81C]/20' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1 text-gray-600">
              <button className="p-1 hover:text-gray-400 transition-colors" title="Move" aria-label="Move tool">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
              <button className="p-1 hover:text-gray-400 transition-colors" title="Rotate" aria-label="Rotate tool">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-1 hover:text-gray-400 transition-colors" title="Scale" aria-label="Scale tool">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Viewport canvas */}
          <div className="flex-1 relative overflow-hidden">
            <ViewportGrid />

            {/* Center axis indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {selectedId && selectedProps ? (
                  <div className="bg-[#0D1020]/80 border border-white/10 rounded-xl px-6 py-4 backdrop-blur-sm">
                    <p className="text-xs text-gray-500 mb-1">Selected</p>
                    <p className="text-lg font-semibold text-white">{selectedProps.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedProps.type} — properties in right panel</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Select an element or use the command bar below</p>
                    <p className="text-gray-700 text-xs mt-1">Tip: Press Tab to focus the command bar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coord overlay */}
            <div className="absolute bottom-2 left-3 text-gray-700 text-xs font-mono pointer-events-none">
              X: 0 &nbsp; Y: 0 &nbsp; Z: 0
            </div>

            {/* FPS + instance count */}
            <div className="absolute bottom-2 right-3 text-gray-700 text-xs font-mono pointer-events-none">
              0 instances
            </div>
          </div>

          {/* ── Command bar ─────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 bg-[#0B0E1C] border-t border-white/8">
            {/* Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="border-b border-white/8 px-3 pt-2 pb-1">
                <p className="text-xs text-gray-600 mb-1.5">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setCommand(s)
                        commandRef.current?.focus()
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="flex-1 relative">
                <input
                  ref={commandRef}
                  type="text"
                  value={command}
                  onChange={(e) => {
                    setCommand(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitCommand()
                    if (e.key === 'Escape') setShowSuggestions(false)
                  }}
                  placeholder="Type a command or click the mic to speak..."
                  className="w-full bg-[#141728] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FFB81C]/40 focus:bg-[#141728] transition-colors"
                  aria-label="Build command input"
                />
              </div>

              {/* Mic button */}
              <button
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Voice input"
                title="Voice command"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Submit */}
              <button
                onClick={submitCommand}
                disabled={!command.trim() || isSubmitting}
                className="h-9 px-4 rounded-lg bg-[#FFB81C] hover:bg-[#FFB81C]/90 disabled:opacity-30 disabled:cursor-not-allowed text-[#0A0E1A] text-sm font-semibold transition-colors flex-shrink-0 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-[#0A0E1A]/30 border-t-[#0A0E1A] rounded-full animate-spin" />
                ) : (
                  <>
                    Build
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar — Properties / AI Output */}
        <aside className="w-60 bg-[#0D1020] border-l border-white/8 flex flex-col flex-shrink-0">
          {selectedProps ? (
            <>
              {/* Properties panel */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8">
                <span className="text-sm">{ELEMENT_ICONS[selectedProps.type]}</span>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Properties</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Name */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Name</p>
                  <input
                    defaultValue={selectedProps.label}
                    className="w-full bg-[#141728] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                  />
                </div>

                {/* Position */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Position</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis}>
                        <p className="text-xs text-gray-600 mb-1 text-center">{axis.toUpperCase()}</p>
                        <input
                          defaultValue={selectedProps.position[axis]}
                          className="w-full bg-[#141728] border border-white/10 rounded px-1.5 py-1 text-xs text-gray-200 font-mono text-center focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Size</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis}>
                        <p className="text-xs text-gray-600 mb-1 text-center">{axis.toUpperCase()}</p>
                        <input
                          defaultValue={selectedProps.size[axis]}
                          className="w-full bg-[#141728] border border-white/10 rounded px-1.5 py-1 text-xs text-gray-200 font-mono text-center focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Material */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Material</p>
                  <select
                    defaultValue={selectedProps.material}
                    className="w-full bg-[#141728] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-[#FFB81C]/40 transition-colors appearance-none cursor-pointer"
                  >
                    {['SmoothPlastic', 'Grass', 'Wood', 'Metal', 'Brick', 'Marble', 'Neon', 'Glass'].map((m) => (
                      <option key={m} value={m} className="bg-[#141728]">{m}</option>
                    ))}
                  </select>
                </div>

                {/* Type badge */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">Type</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-white/5 border border-white/10 ${ELEMENT_COLORS[selectedProps.type]}`}>
                    {ELEMENT_ICONS[selectedProps.type]} {selectedProps.type}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* AI Assistant panel */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8">
                <span className="text-sm">🤖</span>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">AI Assistant</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <p className="text-xs text-gray-600">Recent builds</p>

                {recentCommands.map((cmd) => (
                  <div key={cmd.id} className="bg-[#111425] rounded-lg p-2.5 border border-white/5">
                    <p className="text-xs text-gray-300 leading-relaxed">{cmd.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${
                        cmd.status === 'done' ? 'text-green-500' :
                        cmd.status === 'running' ? 'text-[#FFB81C]' : 'text-red-500'
                      }`}>
                        {cmd.status === 'running' && <span className="inline-block w-2 h-2 bg-[#FFB81C] rounded-full animate-pulse mr-1" />}
                        {cmd.status}
                      </span>
                      <span className="text-xs text-gray-600">{timeAgo(cmd.timestamp)}</span>
                    </div>
                    {cmd.tokensUsed > 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className="text-[#FFB81C] text-xs">⚡</span>
                        <span className="text-xs text-gray-600">{cmd.tokensUsed} tokens</span>
                      </div>
                    )}
                  </div>
                ))}

                {recentCommands.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-xs">No commands yet.</p>
                    <p className="text-gray-700 text-xs mt-1">Type a command below to start building.</p>
                  </div>
                )}
              </div>

              {/* Token cost display */}
              {recentCommands[0]?.tokensUsed > 0 && (
                <div className="p-3 border-t border-white/8">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Last operation</span>
                    <span className="flex items-center gap-1 text-[#FFB81C]">
                      <span>⚡</span>
                      <span className="font-semibold">{recentCommands[0].tokensUsed} tokens</span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
