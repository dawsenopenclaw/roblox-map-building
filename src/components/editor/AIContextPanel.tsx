'use client'

import { useState, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StudioContextForChat {
  camera?: {
    posX: number
    posY: number
    posZ: number
    lookX: number
    lookY: number
    lookZ: number
  } | null
  partCount?: number
  modelCount?: number
  lightCount?: number
  nearbyParts?: {
    name: string
    className: string
    position: string
    size: string
    material: string
    color?: string
    parent?: string
  }[]
  selection?: {
    name: string
    className: string
    path: string
    position?: string
    size?: string
    material?: string
    color?: string
  }[]
  sceneTree?: {
    name: string
    className: string
    position?: string
    childCount?: number
  }[]
  groundY?: number
}

interface AIContextPanelProps {
  studioConnected: boolean
  studioContext: StudioContextForChat | null
  onSendToChat: (message: string) => void
  buildCount?: number
  tokenCount?: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toFixed(1)
}

function truncateId(id: string, len = 12): string {
  if (id.length <= len) return id
  return id.slice(0, len) + '…'
}

/** Returns a compass label (N/NE/E/SE/S/SW/W/NW) from a look vector. */
function compassFromLook(lookX: number, lookZ: number): string {
  const angle = Math.atan2(lookX, lookZ) * (180 / Math.PI)
  const norm = ((angle % 360) + 360) % 360
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(norm / 45) % 8]
}

/** Rough compass bearing in degrees from look vector. */
function bearingFromLook(lookX: number, lookZ: number): number {
  const angle = Math.atan2(lookX, lookZ) * (180 / Math.PI)
  return ((angle % 360) + 360) % 360
}

function classNameColor(className: string): string {
  if (className.includes('Part') || className.includes('Mesh')) return '#D4AF37'
  if (className.includes('Light')) return '#FFB81C'
  if (className.includes('Model') || className.includes('Folder')) return '#7FBAFF'
  if (className.includes('Script')) return '#A78BFA'
  return '#9CA3AF'
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  open,
  onToggle,
  badge,
}: {
  label: string
  open: boolean
  onToggle: () => void
  badge?: string | number
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '6px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#E5E7EB',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '2px',
            height: '10px',
            background: '#D4AF37',
            borderRadius: '1px',
            flexShrink: 0,
          }}
        />
        {label}
        {badge !== undefined && (
          <span
            style={{
              background: '#1F2937',
              border: '1px solid #374151',
              color: '#9CA3AF',
              borderRadius: '10px',
              padding: '0 6px',
              fontSize: '10px',
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        )}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          color: '#6B7280',
        }}
      >
        <path
          d="M2 4l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1F2937',
        borderRadius: '6px',
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: '1',
        minWidth: '0',
      }}
    >
      <span style={{ fontSize: '16px', fontWeight: 700, color: '#F9FAFB', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  variant = 'default',
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'gold'
}) {
  const [hover, setHover] = useState(false)

  const bg = variant === 'gold'
    ? hover ? '#B8960E' : '#D4AF37'
    : hover ? '#1F2937' : '#111827'
  const color = variant === 'gold' ? '#0D0D0D' : '#E5E7EB'
  const border = variant === 'gold' ? '1px solid #D4AF37' : '1px solid #1F2937'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        background: bg,
        border,
        borderRadius: '6px',
        color,
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.12s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: '1px',
        background: '#1F2937',
        margin: '2px 0',
      }}
    />
  )
}

// ─── Compass ───────────────────────────────────────────────────────────────────

function MiniCompass({ bearing }: { bearing: number }) {
  const size = 48
  const cx = size / 2
  const cy = size / 2
  const r = 20
  // Needle tip in direction of bearing
  const rad = (bearing - 90) * (Math.PI / 180)
  const tipX = cx + r * Math.cos(rad)
  const tipY = cy + r * Math.sin(rad)
  // Tail
  const tailRad = rad + Math.PI
  const tailX = cx + (r * 0.5) * Math.cos(tailRad)
  const tailY = cy + (r * 0.5) * Math.sin(tailRad)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r + 2} fill="#111827" stroke="#1F2937" strokeWidth="1" />
      {/* Cardinal labels */}
      <text x={cx} y={6} textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600">N</text>
      <text x={cx} y={size - 1} textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600">S</text>
      <text x={4} y={cy + 3} textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600">W</text>
      <text x={size - 4} y={cy + 3} textAnchor="middle" fill="#6B7280" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600">E</text>
      {/* Tail (south) */}
      <line x1={cx} y1={cy} x2={tailX} y2={tailY} stroke="#374151" strokeWidth="2" strokeLinecap="round" />
      {/* Needle (north → bearing direction) */}
      <line x1={cx} y1={cy} x2={tipX} y2={tipY} stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2" fill="#D4AF37" />
    </svg>
  )
}

// ─── Sections ──────────────────────────────────────────────────────────────────

function ConnectionSection({
  connected,
  studioContext,
  onReconnect,
}: {
  connected: boolean
  studioContext: StudioContextForChat | null
  onReconnect: () => void
}) {
  // Derive a fake session ID from context existence — in production this would come from a prop
  const sessionId = studioContext ? 'sess_' + Math.abs(JSON.stringify(studioContext).length).toString(16) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: connected ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status dot */}
          <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#10B981' : '#EF4444',
              }}
            />
            {connected && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '50%',
                  border: '1.5px solid #10B981',
                  opacity: 0.4,
                  animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: connected ? '#10B981' : '#EF4444',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {connected ? 'Connected to Studio' : 'Not Connected'}
            </span>
            {sessionId && (
              <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                {truncateId(sessionId)}
              </span>
            )}
          </div>
        </div>
        {!connected && (
          <button
            onClick={onReconnect}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              border: '1px solid #374151',
              borderRadius: '5px',
              color: '#9CA3AF',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  )
}

function CameraSection({ camera }: { camera: NonNullable<StudioContextForChat['camera']> }) {
  const bearing = bearingFromLook(camera.lookX, camera.lookZ)
  const compass = compassFromLook(camera.lookX, camera.lookZ)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <MiniCompass bearing={bearing} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, sans-serif', width: '30px' }}>POS</span>
            <span style={{ fontSize: '11px', color: '#E5E7EB', fontFamily: 'Inter, monospace', letterSpacing: '0.03em' }}>
              {fmt(camera.posX)}, {fmt(camera.posY)}, {fmt(camera.posZ)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, sans-serif', width: '30px' }}>LOOK</span>
            <span style={{ fontSize: '11px', color: '#E5E7EB', fontFamily: 'Inter, monospace', letterSpacing: '0.03em' }}>
              {fmt(camera.lookX)}, {fmt(camera.lookY)}, {fmt(camera.lookZ)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, sans-serif', width: '30px' }}>DIR</span>
            <span
              style={{
                fontSize: '11px',
                color: '#D4AF37',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
              }}
            >
              {compass} &middot; {bearing.toFixed(0)}&deg;
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SceneSection({
  ctx,
}: {
  ctx: StudioContextForChat
}) {
  const nearbyCount = ctx.nearbyParts?.length ?? 0
  const nearby = ctx.nearbyParts?.slice(0, 8) ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Stat row */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <StatCard label="Parts" value={ctx.partCount ?? 0} />
        <StatCard label="Models" value={ctx.modelCount ?? 0} />
        <StatCard label="Lights" value={ctx.lightCount ?? 0} />
      </div>

      {/* Nearby objects */}
      {nearbyCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '10px',
              color: '#9CA3AF',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
            }}
          >
            AI can see{' '}
            <span style={{ color: '#D4AF37', fontWeight: 700 }}>{nearbyCount}</span>
            {' '}object{nearbyCount !== 1 ? 's' : ''} near you
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              maxHeight: '120px',
              overflowY: 'auto',
              paddingRight: '2px',
            }}
          >
            {nearby.map((part, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: '#0F1319',
                  borderRadius: '4px',
                  border: '1px solid #1F2937',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#E5E7EB',
                    fontFamily: 'Inter, sans-serif',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100px',
                  }}
                >
                  {part.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: classNameColor(part.className),
                    fontFamily: 'Inter, monospace',
                    flexShrink: 0,
                  }}
                >
                  {part.className}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {nearbyCount === 0 && (
        <div
          style={{
            fontSize: '10px',
            color: '#4B5563',
            fontFamily: 'Inter, sans-serif',
            fontStyle: 'italic',
          }}
        >
          No nearby objects detected
        </div>
      )}
    </div>
  )
}

function SelectionSection({
  selection,
  onSendToChat,
}: {
  selection: NonNullable<StudioContextForChat['selection']>
  onSendToChat: (message: string) => void
}) {
  const handleSendSelection = useCallback(() => {
    const lines = selection.map((obj) => {
      const parts = [
        `- ${obj.name} (${obj.className})`,
        obj.position ? `  Position: ${obj.position}` : null,
        obj.size ? `  Size: ${obj.size}` : null,
        obj.material ? `  Material: ${obj.material}` : null,
        obj.color ? `  Color: ${obj.color}` : null,
      ].filter(Boolean)
      return parts.join('\n')
    })
    onSendToChat(
      `Here is what I have selected in Studio:\n\n${lines.join('\n\n')}`
    )
  }, [selection, onSendToChat])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxHeight: '150px',
          overflowY: 'auto',
        }}
      >
        {selection.map((obj, i) => (
          <div
            key={i}
            style={{
              background: '#0F1319',
              border: '1px solid #1F2937',
              borderRadius: '6px',
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#F9FAFB',
                  fontFamily: 'Inter, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '110px',
                }}
              >
                {obj.name}
              </span>
              <span style={{ fontSize: '10px', color: classNameColor(obj.className), fontFamily: 'Inter, monospace', flexShrink: 0 }}>
                {obj.className}
              </span>
            </div>
            {(obj.position || obj.size) && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {obj.position && (
                  <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, monospace' }}>
                    pos: {obj.position}
                  </span>
                )}
                {obj.size && (
                  <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: 'Inter, monospace' }}>
                    sz: {obj.size}
                  </span>
                )}
              </div>
            )}
            {(obj.material || obj.color) && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {obj.material && (
                  <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
                    {obj.material}
                  </span>
                )}
                {obj.color && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        background: obj.color.startsWith('#') ? obj.color : '#6B7280',
                        border: '1px solid #374151',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'Inter, monospace' }}>
                      {obj.color}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <ActionButton
        label="Tell AI about selection"
        variant="gold"
        icon={
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
        onClick={handleSendSelection}
      />
    </div>
  )
}

function BuildSummarySection({
  buildCount,
  taggedCount,
  partCount,
  lightCount,
}: {
  buildCount: number
  taggedCount: number
  partCount: number
  lightCount: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <StatCard label="Builds" value={buildCount} />
        <StatCard label="Tagged" value={taggedCount} />
      </div>
      <div
        style={{
          padding: '6px 8px',
          background: '#0F1319',
          border: '1px solid #1F2937',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#9CA3AF',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.5,
        }}
      >
        {partCount > 0 || lightCount > 0 ? (
          <>
            <span style={{ color: '#D4AF37', fontWeight: 600 }}>{partCount}</span> parts placed
            {lightCount > 0 && (
              <>, <span style={{ color: '#FFB81C', fontWeight: 600 }}>{lightCount}</span> lights</>
            )}
            {' '}this session
          </>
        ) : (
          <span style={{ color: '#4B5563', fontStyle: 'italic' }}>No builds recorded yet</span>
        )}
      </div>
    </div>
  )
}

function AnalysisSection({ onSendToChat }: { onSendToChat: (msg: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <ActionButton
        label="Analyze my game"
        icon={
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 8.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
        onClick={() =>
          onSendToChat(
            'Please analyze my current Roblox game. Review the scene structure, object placement, part count, and overall layout. Identify any issues and give me actionable feedback.'
          )
        }
      />
      <ActionButton
        label="Optimize performance"
        icon={
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1.5 3.5H11l-2.8 2 1 3.5L6 8l-3.2 2 1-3.5L1 4.5h3.5L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        }
        onClick={() =>
          onSendToChat(
            'Analyze my game for performance issues. Check part count, draw calls, unnecessary objects, lighting complexity, and streaming. Give me a prioritized list of optimizations.'
          )
        }
      />
      <ActionButton
        label="Suggest improvements"
        icon={
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1a4 4 0 010 8M6 9v2M4.5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        }
        onClick={() =>
          onSendToChat(
            'Based on what you can see in my scene, suggest improvements to make the game more engaging, visually appealing, and fun for players. Be specific and actionable.'
          )
        }
      />
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '24px 16px',
        textAlign: 'center',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="2" y="2" width="28" height="28" rx="6" stroke="#1F2937" strokeWidth="1.5" />
        <circle cx="16" cy="14" r="5" stroke="#374151" strokeWidth="1.5" />
        <path d="M9 24c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
          No Studio data
        </div>
        <div style={{ fontSize: '11px', color: '#374151', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
          Connect the ForjeGames plugin to enable context awareness
        </div>
      </div>
    </div>
  )
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function AIContextPanel({
  studioConnected,
  studioContext,
  onSendToChat,
  buildCount = 0,
  tokenCount,
}: AIContextPanelProps) {
  const [open, setOpen] = useState({
    camera: true,
    scene: true,
    selection: true,
    build: false,
    analysis: true,
  })

  const toggle = useCallback((key: keyof typeof open) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const hasCamera = !!(studioContext?.camera)
  const hasSelection = !!(studioContext?.selection?.length)
  const hasScene = studioConnected || studioContext !== null
  const taggedCount = 0 // would come from build history in production

  return (
    <div
      style={{
        width: '240px',
        background: '#0A0E17',
        border: '1px solid #1F2937',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid #1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1L8.8 4.8H13L9.8 7.4L11 11.5L7 9L3 11.5L4.2 7.4L1 4.8H5.2L7 1Z"
              fill="#D4AF37"
            />
          </svg>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#F9FAFB',
              letterSpacing: '0.04em',
            }}
          >
            AI Context
          </span>
        </div>
        {tokenCount !== undefined && (
          <span
            style={{
              fontSize: '10px',
              color: '#6B7280',
              fontFamily: 'Inter, monospace',
            }}
          >
            {tokenCount.toLocaleString()} tkns
          </span>
        )}
      </div>

      {/* Scrollable body */}
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Connection */}
        <ConnectionSection
          connected={studioConnected}
          studioContext={studioContext}
          onReconnect={() => onSendToChat('Reconnect to Roblox Studio please.')}
        />

        {/* If no context at all, show empty state for data sections */}
        {!studioContext ? (
          <EmptyState />
        ) : (
          <>
            <Divider />

            {/* Camera */}
            {hasCamera && (
              <>
                <SectionHeader
                  label="Camera View"
                  open={open.camera}
                  onToggle={() => toggle('camera')}
                />
                {open.camera && <CameraSection camera={studioContext.camera!} />}
                <Divider />
              </>
            )}

            {/* Scene */}
            {hasScene && (
              <>
                <SectionHeader
                  label="Scene Awareness"
                  open={open.scene}
                  onToggle={() => toggle('scene')}
                  badge={studioContext.nearbyParts?.length}
                />
                {open.scene && <SceneSection ctx={studioContext} />}
                <Divider />
              </>
            )}

            {/* Selection */}
            {hasSelection && (
              <>
                <SectionHeader
                  label="Selected Objects"
                  open={open.selection}
                  onToggle={() => toggle('selection')}
                  badge={studioContext.selection!.length}
                />
                {open.selection && (
                  <SelectionSection
                    selection={studioContext.selection!}
                    onSendToChat={onSendToChat}
                  />
                )}
                <Divider />
              </>
            )}

            {/* Build Summary */}
            <SectionHeader
              label="Build Summary"
              open={open.build}
              onToggle={() => toggle('build')}
              badge={buildCount > 0 ? buildCount : undefined}
            />
            {open.build && (
              <BuildSummarySection
                buildCount={buildCount}
                taggedCount={taggedCount}
                partCount={studioContext.partCount ?? 0}
                lightCount={studioContext.lightCount ?? 0}
              />
            )}

            <Divider />
          </>
        )}

        {/* Game Analysis — always shown */}
        <SectionHeader
          label="Game Analysis"
          open={open.analysis}
          onToggle={() => toggle('analysis')}
        />
        {open.analysis && <AnalysisSection onSendToChat={onSendToChat} />}
      </div>

      {/* Ping animation keyframes via style tag — inline styles can't do @keyframes */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default AIContextPanel
