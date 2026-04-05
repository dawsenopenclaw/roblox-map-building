'use client'

import React, { useState, useRef, useEffect } from 'react'

// ─── Tool definitions ─────────────────────────────────────────────────────────

interface McpTool {
  id: string
  label: string
  envKey: string
}

interface McpToolGroup {
  id: string
  label: string
  shortLabel: string
  tools: McpTool[]
  /** Icon renderer */
  icon: React.ReactNode
}

const TOOL_GROUPS: McpToolGroup[] = [
  {
    id: '3d-assets',
    label: '3D Assets',
    shortLabel: '3D',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    tools: [
      { id: 'text-to-3d',        label: 'Text to 3D',        envKey: 'MESHY_API_KEY' },
      { id: 'generate-texture',  label: 'Generate Texture',  envKey: 'MESHY_API_KEY' },
      { id: 'optimize-mesh',     label: 'Optimize Mesh',     envKey: 'MESHY_API_KEY' },
      { id: 'image-to-3d',       label: 'Image to 3D',       envKey: 'MESHY_API_KEY' },
    ],
  },
  {
    id: 'city-builder',
    label: 'City Builder',
    shortLabel: 'City',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <path d="M3 9l9-7 9 7"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    tools: [
      { id: 'plan-city',          label: 'Plan City',          envKey: 'ROBLOX_API_KEY' },
      { id: 'generate-building',  label: 'Generate Building',  envKey: 'ROBLOX_API_KEY' },
      { id: 'layout-district',    label: 'Layout District',    envKey: 'ROBLOX_API_KEY' },
    ],
  },
  {
    id: 'terrain',
    label: 'Terrain',
    shortLabel: 'Terrain',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
      </svg>
    ),
    tools: [
      { id: 'generate-terrain', label: 'Generate Terrain', envKey: 'ROBLOX_API_KEY' },
      { id: 'paint-terrain',    label: 'Paint Terrain',    envKey: 'ROBLOX_API_KEY' },
      { id: 'create-water',     label: 'Create Water',     envKey: 'ROBLOX_API_KEY' },
    ],
  },
]

// ─── Per-group status (green = all ready, grey = missing key) ─────────────────

type GroupStatus = 'ready' | 'partial' | 'unavailable'

function getGroupStatus(group: McpToolGroup): GroupStatus {
  if (typeof window === 'undefined') return 'unavailable'
  // In a real app, check if the env key exists via /api/mcp/status.
  // Here we check localStorage for a user-supplied key as a client-side proxy.
  const lsKeyMap: Record<string, string> = {
    MESHY_API_KEY:  'fg_meshy_key',
    ROBLOX_API_KEY: 'fg_roblox_key',
  }
  const envKeys = [...new Set(group.tools.map((t) => t.envKey))]
  const ready = envKeys.filter((k) => {
    const lsKey = lsKeyMap[k]
    return lsKey ? !!localStorage.getItem(lsKey) : true
  })
  if (ready.length === envKeys.length) return 'ready'
  if (ready.length > 0)               return 'partial'
  return 'unavailable'
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ToolGroupTooltip({
  group,
  onClose,
}: {
  group: McpToolGroup
  onClose: () => void
}) {
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'rgba(8,10,22,0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '10px 12px',
        minWidth: 160,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'mcpTtIn 0.14s cubic-bezier(0.4,0,0.2,1) forwards',
      }}
    >
      {/* Arrow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          background: 'rgba(8,10,22,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          borderRight: 'none',
          rotate: '45deg',
        }}
      />
      <p
        style={{
          margin: '0 0 8px 0',
          fontSize: 10,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {group.label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {group.tools.map((tool) => (
          <div
            key={tool.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 11,
              color: 'rgba(255,255,255,0.65)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 5px rgba(74,222,128,0.6)',
                flexShrink: 0,
              }}
            />
            {tool.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Toolbar styles ───────────────────────────────────────────────────────────

const TOOLBAR_STYLES = `
  @keyframes mcpTtIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`

// ─── McpToolbar ───────────────────────────────────────────────────────────────

export function McpToolbar() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, GroupStatus>>({})
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Compute statuses once on mount (client-side only)
  useEffect(() => {
    const result: Record<string, GroupStatus> = {}
    for (const g of TOOL_GROUPS) {
      result[g.id] = getGroupStatus(g)
    }
    setStatuses(result)
  }, [])

  const handleMouseEnter = (groupId: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setActiveGroup(groupId)
  }

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => setActiveGroup(null), 120)
  }

  return (
    <>
      <style>{TOOLBAR_STYLES}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          padding: '5px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(5,8,16,0.6)',
        }}
      >
        {/* Label */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)',
            fontFamily: 'Inter, sans-serif',
            marginRight: 4,
            userSelect: 'none',
          }}
        >
          MCP
        </span>

        {/* Group buttons */}
        {TOOL_GROUPS.map((group) => {
          const status = statuses[group.id] ?? 'unavailable'
          const dotColor =
            status === 'ready'       ? '#4ADE80' :
            status === 'partial'     ? '#D4AF37' :
                                       'rgba(255,255,255,0.18)'
          const dotShadow =
            status === 'ready'   ? '0 0 5px rgba(74,222,128,0.7)' :
            status === 'partial' ? '0 0 5px rgba(212,175,55,0.6)' :
                                   'none'

          const isActive = activeGroup === group.id

          return (
            <div
              key={group.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => handleMouseEnter(group.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid transparent',
                  color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)',
                  cursor: 'default',
                  fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  transition: 'all 0.15s ease-out',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)', transition: 'color 0.15s' }}>
                  {group.icon}
                </span>
                {group.shortLabel}
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: dotColor,
                    boxShadow: dotShadow,
                    flexShrink: 0,
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                />
              </button>

              {isActive && (
                <ToolGroupTooltip
                  group={group}
                  onClose={() => setActiveGroup(null)}
                />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
