'use client'

import React, { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type McpToolStatus = 'running' | 'complete' | 'failed'

export interface McpToolResult {
  /** Lucide-style tool identifier matched to a known MCP tool name */
  toolName: string
  status: McpToolStatus
  /** Human-readable label: "Generating 3D model…" */
  label?: string
  /** Optional result preview data */
  meshUrl?: string
  textureUrl?: string
  luauLineCount?: number
  errorMessage?: string
}

// ─── Tool icon map ────────────────────────────────────────────────────────────

function ToolIcon({ toolName, size = 16 }: { toolName: string; size?: number }) {
  const s = size
  switch (toolName) {
    case 'text-to-3d':
    case 'generate-mesh':
    case 'image-to-3d':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      )
    case 'generate-texture':
    case 'paint-texture':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>
      )
    case 'optimize-mesh':
    case 'remesh':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 10 14 10 20"/>
          <polyline points="20 10 14 10 14 4"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
          <line x1="3" y1="21" x2="14" y2="10"/>
        </svg>
      )
    case 'plan-city':
    case 'generate-city':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="M3 9l9-7 9 7"/>
          <path d="M9 22V12h6v10"/>
        </svg>
      )
    case 'generate-building':
    case 'create-building':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    case 'layout-district':
    case 'layout-zone':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    case 'generate-terrain':
    case 'sculpt-terrain':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
        </svg>
      )
    case 'paint-terrain':
    case 'color-terrain':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z"/>
          <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
          <path d="M14.5 17.5 4.5 15"/>
        </svg>
      )
    case 'create-water':
    case 'add-water':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
          <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
        </svg>
      )
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )
  }
}

// ─── Status icons ─────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6" fill="rgba(74,222,128,0.18)" stroke="rgba(74,222,128,0.5)" strokeWidth="1"/>
      <path d="M3.5 6.5l2.5 2.5 3.5-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6" fill="rgba(239,68,68,0.18)" stroke="rgba(239,68,68,0.5)" strokeWidth="1"/>
      <path d="M4.5 4.5l4 4M8.5 4.5l-4 4" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'mcpSpin 0.9s linear infinite' }}>
      <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(212,175,55,0.2)" strokeWidth="1.5"/>
      <path d="M6.5 1A5.5 5.5 0 0 1 12 6.5" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Tool label map ───────────────────────────────────────────────────────────

function getToolLabel(toolName: string): string {
  const labels: Record<string, string> = {
    'text-to-3d': 'Text to 3D',
    'generate-mesh': 'Generate Mesh',
    'image-to-3d': 'Image to 3D',
    'generate-texture': 'Generate Texture',
    'paint-texture': 'Paint Texture',
    'optimize-mesh': 'Optimize Mesh',
    'remesh': 'Remesh',
    'plan-city': 'Plan City',
    'generate-city': 'Generate City',
    'generate-building': 'Generate Building',
    'create-building': 'Create Building',
    'layout-district': 'Layout District',
    'layout-zone': 'Layout Zone',
    'generate-terrain': 'Generate Terrain',
    'sculpt-terrain': 'Sculpt Terrain',
    'paint-terrain': 'Paint Terrain',
    'color-terrain': 'Color Terrain',
    'create-water': 'Create Water',
    'add-water': 'Add Water',
  }
  return labels[toolName] ?? toolName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── McpToolCard ──────────────────────────────────────────────────────────────

const MCP_CARD_STYLES = `
  @keyframes mcpSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes mcpCardIn {
    0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes mcpPulseRing {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.12); }
  }
  @keyframes mcpShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes mcpGoldBorderPulse {
    0%, 100% { border-color: rgba(212,175,55,0.35); box-shadow: 0 0 12px rgba(212,175,55,0.08); }
    50%       { border-color: rgba(212,175,55,0.65); box-shadow: 0 0 22px rgba(212,175,55,0.18), 0 0 40px rgba(212,175,55,0.08); }
  }
`

export function McpToolCard({ tool }: { tool: McpToolResult }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const isRunning  = tool.status === 'running'
  const isComplete = tool.status === 'complete'
  const isFailed   = tool.status === 'failed'

  const label = tool.label ?? getToolLabel(tool.toolName)

  return (
    <>
      <style>{MCP_CARD_STYLES}</style>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 12,
          background: isRunning
            ? 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(5,8,16,0.9) 100%)'
            : isComplete
            ? 'linear-gradient(135deg, rgba(74,222,128,0.05) 0%, rgba(5,8,16,0.9) 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(5,8,16,0.9) 100%)',
          border: isRunning
            ? '1px solid rgba(212,175,55,0.35)'
            : isComplete
            ? '1px solid rgba(74,222,128,0.28)'
            : '1px solid rgba(239,68,68,0.28)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maxWidth: 340,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
          transition: 'opacity 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          animation: isRunning ? 'mcpGoldBorderPulse 2.4s ease-in-out infinite' : undefined,
        }}
      >
        {/* Running shimmer overlay */}
        {isRunning && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(105deg, transparent 20%, rgba(212,175,55,0.04) 50%, transparent 80%)',
              backgroundSize: '200% 100%',
              animation: 'mcpShimmer 2s linear infinite',
              pointerEvents: 'none',
              borderRadius: 'inherit',
            }}
          />
        )}

        {/* Tool icon badge */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isRunning
              ? 'rgba(212,175,55,0.12)'
              : isComplete
              ? 'rgba(74,222,128,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: isRunning
              ? '1px solid rgba(212,175,55,0.25)'
              : isComplete
              ? '1px solid rgba(74,222,128,0.22)'
              : '1px solid rgba(239,68,68,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: isRunning ? '#D4AF37' : isComplete ? '#4ADE80' : '#F87171',
            position: 'relative',
          }}
        >
          <ToolIcon toolName={tool.toolName} size={15} />
          {/* Pulse ring for running state */}
          {isRunning && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: 11,
                border: '1px solid rgba(212,175,55,0.3)',
                animation: 'mcpPulseRing 1.8s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isRunning ? '#D4AF37' : isComplete ? '#4ADE80' : '#F87171',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              {getToolLabel(tool.toolName)}
            </span>
            {/* Status icon */}
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              {isRunning  && <SpinnerIcon />}
              {isComplete && <CheckIcon />}
              {isFailed   && <ErrorIcon />}
            </div>
          </div>

          {/* Status text */}
          {isRunning && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: 'Inter, sans-serif',
                background: 'linear-gradient(90deg, rgba(212,175,55,0.5) 0%, rgba(255,220,80,0.9) 40%, rgba(212,175,55,0.5) 80%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'mcpShimmer 2.2s linear infinite',
              }}
            >
              {label}
            </p>
          )}

          {isComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                Completed successfully
              </p>
              {/* Result preview row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                {tool.meshUrl && (
                  <a
                    href={tool.meshUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      fontFamily: 'Inter, sans-serif',
                      color: 'rgba(99,179,237,0.85)',
                      background: 'rgba(99,179,237,0.08)',
                      border: '1px solid rgba(99,179,237,0.18)',
                      borderRadius: 5,
                      padding: '2px 7px',
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(147,210,255,1)'
                      e.currentTarget.style.borderColor = 'rgba(99,179,237,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(99,179,237,0.85)'
                      e.currentTarget.style.borderColor = 'rgba(99,179,237,0.18)'
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    </svg>
                    View Mesh
                  </a>
                )}
                {tool.luauLineCount !== undefined && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'rgba(74,222,128,0.75)',
                      background: 'rgba(74,222,128,0.07)',
                      border: '1px solid rgba(74,222,128,0.15)',
                      borderRadius: 5,
                      padding: '2px 7px',
                    }}
                  >
                    {tool.luauLineCount} lines Luau
                  </span>
                )}
                {tool.textureUrl && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.12)',
                      flexShrink: 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tool.textureUrl}
                      alt="Texture preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {isFailed && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'rgba(248,113,113,0.8)',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.4,
              }}
            >
              {tool.errorMessage ?? 'Tool execution failed'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}
