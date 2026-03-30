'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolMode = 'select' | 'move' | 'rotate' | 'scale'

export interface ToolbarProps {
  activeTool: ToolMode
  onToolChange: (tool: ToolMode) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onAdd: (type: 'part' | 'model' | 'script' | 'light' | 'spawn') => void
  className?: string
}

// ---------------------------------------------------------------------------
// Tooltip wrapper
// ---------------------------------------------------------------------------

function TooltipButton({
  tooltip,
  children,
  onClick,
  active,
  disabled,
  danger,
}: {
  tooltip: string
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  danger?: boolean
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={[
          'w-7 h-7 rounded flex items-center justify-center transition-colors',
          active
            ? 'text-[#D4AF37] bg-[#D4AF37]/12'
            : danger
              ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/8',
          disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
        aria-label={tooltip}
      >
        {children}
      </button>
      {show && !disabled && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap pointer-events-none z-50"
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
        >
          {tooltip}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(255,255,255,0.12)' }}
          />
        </div>
      )}
    </div>
  )
}

function Separator() {
  return (
    <div
      className="w-px mx-0.5 self-stretch my-1.5"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    />
  )
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

export function Toolbar({
  activeTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDelete,
  onAdd,
  className = '',
}: ToolbarProps) {
  return (
    <div
      className={`flex items-center gap-0.5 px-2 h-9 flex-shrink-0 ${className}`}
      style={{
        background: '#111113',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Select */}
      <TooltipButton tooltip="Select (V)" active={activeTool === 'select'} onClick={() => onToolChange('select')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M3 2l10 6-5 1-2 5L3 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill={activeTool === 'select' ? 'currentColor' : 'none'}/>
        </svg>
      </TooltipButton>

      {/* Move */}
      <TooltipButton tooltip="Move (G)" active={activeTool === 'move'} onClick={() => onToolChange('move')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12M8 2l-2 2M8 2l2 2M8 14l-2-2M8 14l2-2M2 8l2-2M2 8l2 2M14 8l-2-2M14 8l-2 2"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TooltipButton>

      {/* Rotate */}
      <TooltipButton tooltip="Rotate (R)" active={activeTool === 'rotate'} onClick={() => onToolChange('rotate')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M2 8a6 6 0 106-6H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M5 5L2 8l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TooltipButton>

      {/* Scale */}
      <TooltipButton tooltip="Scale (S)" active={activeTool === 'scale'} onClick={() => onToolChange('scale')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10 6l2-2M12 4v4M12 4h-4M6 10l-2 2M4 12v-4M4 12h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TooltipButton>

      <Separator />

      {/* Undo */}
      <TooltipButton tooltip="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M3 6H9.5a4.5 4.5 0 010 9H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M3 3l-2 3 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TooltipButton>

      {/* Redo */}
      <TooltipButton tooltip="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M13 6H6.5a4.5 4.5 0 000 9H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M13 3l2 3-2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TooltipButton>

      {/* Delete */}
      <TooltipButton tooltip="Delete (Del)" danger onClick={onDelete}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      </TooltipButton>

      <Separator />

      {/* Add Part */}
      <TooltipButton tooltip="Add Part" onClick={() => onAdd('part')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M12 9v5M9.5 11.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </TooltipButton>

      {/* Add Model */}
      <TooltipButton tooltip="Add Model" onClick={() => onAdd('model')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M8 2l5 3v5l-5 3-5-3V5l5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M13 9v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M11.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </TooltipButton>

      {/* Add Script */}
      <TooltipButton tooltip="Add Script" onClick={() => onAdd('script')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TooltipButton>

      {/* Add Light */}
      <TooltipButton tooltip="Add Light" onClick={() => onAdd('light')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </TooltipButton>

      {/* Add Spawn */}
      <TooltipButton tooltip="Add SpawnLocation" onClick={() => onAdd('spawn')}>
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </TooltipButton>

      {/* Right side — flex spacer + keyboard hint */}
      <div className="flex-1" />
      <span className="text-[9px] text-zinc-700 hidden lg:block pr-1">
        {activeTool === 'select' && 'V · Select'}
        {activeTool === 'move' && 'G · Move'}
        {activeTool === 'rotate' && 'R · Rotate'}
        {activeTool === 'scale' && 'S · Scale'}
      </span>
    </div>
  )
}
