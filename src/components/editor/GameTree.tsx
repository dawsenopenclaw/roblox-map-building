'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NodeKind = 'workspace' | 'folder' | 'terrain' | 'model' | 'npc' | 'script' | 'ui' | 'other'

export interface GameTreeNode {
  id: string
  name: string
  kind: NodeKind
  children?: GameTreeNode[]
  expanded?: boolean
}

interface ApiGameState {
  connected: boolean
  capturedAt: number | null
  workspace: {
    terrain: Record<string, unknown>
    buildings: Array<{ id: string; name: string; className: string }>
    npcs: Array<{ id: string; name: string; className: string }>
    scripts: Array<{ id: string; name: string; className: string }>
    ui: Array<{ id: string; name: string; className: string }>
    other: Array<{ id: string; name: string; className: string }>
  }
}

interface GameTreeProps {
  onSelect?: (node: GameTreeNode) => void
  className?: string
  sessionId?: string | null
}

// ---------------------------------------------------------------------------
// Demo tree — shown when Studio is not connected
// ---------------------------------------------------------------------------
const DEMO_TREE: GameTreeNode[] = [
  {
    id: 'workspace',
    name: 'Workspace',
    kind: 'workspace',
    expanded: true,
    children: [
      { id: 'terrain', name: 'Terrain', kind: 'terrain' },
      {
        id: 'buildings',
        name: 'Models',
        kind: 'folder',
        expanded: true,
        children: [
          { id: 'b1', name: 'Castle_Main', kind: 'model' },
          { id: 'b2', name: 'Market_Stall', kind: 'model' },
          { id: 'b3', name: 'Watchtower', kind: 'model' },
        ],
      },
      {
        id: 'npcs',
        name: 'NPCs',
        kind: 'folder',
        expanded: false,
        children: [
          { id: 'n1', name: 'Shopkeeper', kind: 'npc' },
          { id: 'n2', name: 'Guard_01', kind: 'npc' },
        ],
      },
      {
        id: 'scripts',
        name: 'Scripts',
        kind: 'folder',
        expanded: false,
        children: [
          { id: 's1', name: 'GameInit', kind: 'script' },
          { id: 's2', name: 'PlayerController', kind: 'script' },
          { id: 's3', name: 'EconomyManager', kind: 'script' },
        ],
      },
      { id: 'ui', name: 'UI Elements', kind: 'ui' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Visual config per node kind
// ---------------------------------------------------------------------------
const KIND_ICON: Record<NodeKind, string> = {
  workspace: 'W',
  folder: 'F',
  terrain: 'T',
  model: 'M',
  npc: 'N',
  script: 'S',
  ui: 'U',
  other: 'O',
}

const KIND_COLOR: Record<NodeKind, string> = {
  workspace: 'text-blue-400',
  folder: 'text-yellow-400',
  terrain: 'text-green-400',
  model: 'text-orange-400',
  npc: 'text-purple-400',
  script: 'text-cyan-400',
  ui: 'text-pink-400',
  other: 'text-gray-400',
}

// ---------------------------------------------------------------------------
// Build tree from API state
// ---------------------------------------------------------------------------
function apiStateToTree(state: ApiGameState): GameTreeNode[] {
  const children: GameTreeNode[] = [
    { id: 'terrain', name: 'Terrain', kind: 'terrain' },
  ]

  if (state.workspace.buildings.length > 0) {
    children.push({
      id: 'folder-models',
      name: 'Models',
      kind: 'folder',
      expanded: true,
      children: state.workspace.buildings.map((b) => ({
        id: b.id,
        name: b.name,
        kind: 'model' as NodeKind,
      })),
    })
  }

  if (state.workspace.npcs.length > 0) {
    children.push({
      id: 'folder-npcs',
      name: 'NPCs',
      kind: 'folder',
      expanded: false,
      children: state.workspace.npcs.map((n) => ({
        id: n.id,
        name: n.name,
        kind: 'npc' as NodeKind,
      })),
    })
  }

  if (state.workspace.scripts.length > 0) {
    children.push({
      id: 'folder-scripts',
      name: 'Scripts',
      kind: 'folder',
      expanded: false,
      children: state.workspace.scripts.map((s) => ({
        id: s.id,
        name: s.name,
        kind: 'script' as NodeKind,
      })),
    })
  }

  if (state.workspace.ui.length > 0) {
    children.push({
      id: 'folder-ui',
      name: 'UI Elements',
      kind: 'folder',
      expanded: false,
      children: state.workspace.ui.map((u) => ({
        id: u.id,
        name: u.name,
        kind: 'ui' as NodeKind,
      })),
    })
  }

  if (state.workspace.other.length > 0) {
    children.push({
      id: 'folder-other',
      name: 'Other',
      kind: 'folder',
      expanded: false,
      children: state.workspace.other.map((o) => ({
        id: o.id,
        name: o.name,
        kind: 'other' as NodeKind,
      })),
    })
  }

  return [
    {
      id: 'workspace',
      name: 'Workspace',
      kind: 'workspace',
      expanded: true,
      children,
    },
  ]
}

// ---------------------------------------------------------------------------
// TreeNode render
// ---------------------------------------------------------------------------
function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onToggle,
}: {
  node: GameTreeNode
  depth: number
  selectedId: string | null
  onSelect: (n: GameTreeNode) => void
  onToggle: (id: string) => void
}) {
  const hasChildren = (node.children?.length ?? 0) > 0
  const isSelected  = selectedId === node.id

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect(node)
        }}
        className={`w-full flex items-center gap-1.5 py-1 rounded text-xs transition-colors text-left ${
          isSelected
            ? 'bg-[#D4AF37]/15 text-white'
            : 'text-gray-300 hover:text-gray-200 hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: '8px' }}
        aria-pressed={isSelected}
      >
        {/* Expand arrow */}
        {hasChildren ? (
          <span className="text-gray-400 w-3 flex-shrink-0 text-center">
            {node.expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {/* Kind icon badge */}
        <span
          className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center flex-shrink-0 bg-white/5 ${KIND_COLOR[node.kind]}`}
        >
          {KIND_ICON[node.kind]}
        </span>

        {/* Label */}
        <span className={`truncate font-mono text-xs ${isSelected ? 'text-white' : KIND_COLOR[node.kind]}`}>
          {node.name}
        </span>

        {/* Child count */}
        {hasChildren && (
          <span className="ml-auto text-gray-500 text-xs flex-shrink-0">
            {node.children!.length}
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && node.expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main GameTree component
// ---------------------------------------------------------------------------
export function GameTree({ onSelect, className = '', sessionId }: GameTreeProps) {
  const [tree, setTree]           = useState<GameTreeNode[]>(DEMO_TREE)
  const [selectedId, setSelected] = useState<string | null>(null)
  const [isLive, setIsLive]       = useState(false)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---------------------------------------------------------------------------
  // Poll /api/studio/state every 3 seconds
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function fetchState() {
      try {
        const url = sessionId ? `/api/studio/state?sessionId=${sessionId}` : '/api/studio/state'
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as ApiGameState
        if (data.connected) {
          setTree(apiStateToTree(data))
          setIsLive(true)
        } else {
          setIsLive(false)
          // Keep current tree structure if we previously had live data
        }
      } catch (err) {
        console.error('[GameTree] Failed to fetch game state:', err instanceof Error ? err.message : err)
        setIsLive(false)
      }
    }

    void fetchState()
    intervalRef.current = setInterval(() => void fetchState(), 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Collapse / expand
  // ---------------------------------------------------------------------------
  const toggleNode = useCallback((id: string) => {
    const toggle = (nodes: GameTreeNode[]): GameTreeNode[] =>
      nodes.map((n) =>
        n.id === id
          ? { ...n, expanded: !n.expanded }
          : n.children
          ? { ...n, children: toggle(n.children) }
          : n
      )
    setTree((prev) => toggle(prev))
  }, [])

  const selectNode = useCallback(
    (node: GameTreeNode) => {
      setSelected(node.id)
      onSelect?.(node)
    },
    [onSelect]
  )

  return (
    <div className={`flex flex-col h-full bg-[#141414] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/8 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Explorer</span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          <button
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
            aria-label="Add element"
            title="Add new element"
          >
            +
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={selectNode}
            onToggle={toggleNode}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/8 flex-shrink-0">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-colors border border-dashed border-white/10 hover:border-white/20">
          <span>+</span>
          <span>Add element</span>
        </button>
      </div>
    </div>
  )
}
