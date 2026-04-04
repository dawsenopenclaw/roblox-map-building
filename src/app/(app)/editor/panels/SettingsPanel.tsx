'use client'

import React, { useState } from 'react'
import { useEditorSettings } from '../hooks/useEditorSettings'
import type {
  CodeStyle,
  BuildScale,
  FontSize,
} from '../hooks/useEditorSettings'
import { THEMES } from '@/lib/themes'
import type { Theme } from '@/lib/themes'

// ─── Prop types ───────────────────────────────────────────────────────────────

export interface StudioStatus {
  connected: boolean
  placeName?: string
  placeId?: number
  screenshotUrl?: string
  lastActivity?: string
  sessionId?: string
  pluginVersion?: string
}

export interface SettingsPanelProps {
  studioStatus: StudioStatus
  totalTokens?: number
  tokensRemaining?: number | null
  onDisconnect?: () => void
  onRescanWorkspace?: () => void
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pt-3 pb-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold first:pt-0">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px mx-1 my-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked
          ? 'linear-gradient(90deg, #D4AF37, #D4AF37)'
          : 'rgba(255,255,255,0.1)',
        boxShadow: checked ? '0 0 8px rgba(212,175,55,0.35)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
  disabled,
}: {
  label: string
  sub?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.025] transition-colors">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-xs text-gray-200 font-medium leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{sub}</p>}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

function SegmentRow<T extends string>({
  label,
  sub,
  value,
  options,
  onChange,
}: {
  label: string
  sub?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="px-3 py-2.5 space-y-1.5">
      <div>
        <p className="text-xs text-gray-200 font-medium leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{sub}</p>}
      </div>
      <div className="flex gap-1 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-2 py-1 rounded text-[10px] font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50"
            style={
              value === opt.value
                ? {
                    background: 'linear-gradient(90deg, rgba(212,175,55,0.2), rgba(212,175,55,0.2))',
                    border: '1px solid rgba(212,175,55,0.4)',
                    color: '#D4AF37',
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.45)',
                  }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Theme Grid ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Theme['category'], string> = {
  minimal:   'Minimal',
  vibrant:   'Vibrant',
  aesthetic: 'Aesthetic',
  luxury:    'Luxury',
}

const CATEGORIES: Theme['category'][] = ['minimal', 'vibrant', 'aesthetic', 'luxury']

function ThemeGrid({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="px-3 py-2.5 space-y-3">
      <p className="text-xs text-gray-200 font-medium leading-tight">Theme</p>
      {CATEGORIES.map((cat) => {
        const group = THEMES.filter((t) => t.category === cat)
        return (
          <div key={cat} className="space-y-1.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {group.map((theme) => {
                const active = value === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => onChange(theme.id)}
                    className="relative text-left rounded-lg p-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50"
                    style={{
                      background: active
                        ? 'rgba(212,175,55,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      border: active
                        ? '1px solid rgba(212,175,55,0.45)'
                        : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Color preview dots */}
                    <div className="flex gap-1 mb-1.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: theme.preview.bg, border: '1px solid rgba(255,255,255,0.12)' }}
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: theme.preview.accent }}
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: theme.preview.surface, border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                    <p className="text-[11px] font-semibold leading-tight"
                      style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.75)' }}>
                      {theme.name}
                    </p>
                    {/* Active checkmark */}
                    {active && (
                      <span
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(212,175,55,0.2)' }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4l1.8 2 3.2-3.5" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  fullWidth,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'gold' | 'danger'
  disabled?: boolean
  fullWidth?: boolean
}) {
  const baseClass = [
    'px-3 py-2 rounded-lg text-[11px] font-semibold transition-all duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
  ].join(' ')

  const styles: Record<string, React.CSSProperties> = {
    ghost:  { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' },
    gold:   { background: 'rgba(212,175,55,0.08)',  border: '1px solid rgba(212,175,55,0.22)',  color: '#D4AF37' },
    danger: { background: 'rgba(239,68,68,0.08)',   border: '1px solid rgba(239,68,68,0.22)',   color: '#F87171' },
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClass} style={styles[variant]}>
      {children}
    </button>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function SettingsPanel({
  studioStatus,
  totalTokens = 0,
  tokensRemaining = null,
  onDisconnect,
  onRescanWorkspace,
}: SettingsPanelProps) {
  const { settings, update } = useEditorSettings()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exportDone, setExportDone] = useState(false)

  function handleExportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      settings,
      note: 'Full project export is available via the Projects panel.',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `forjegames-settings-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 2500)
  }

  function handleDeleteAllProjects() {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('fg_'))
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {
      // noop
    }
    setShowDeleteConfirm(false)
    window.location.reload()
  }

  const tokenTotal = totalTokens + (tokensRemaining ?? 0)

  return (
    <div
      className="p-3 space-y-0.5 text-gray-100"
      style={{ animation: 'panel-slide-in 0.2s ease-out forwards' }}
    >

      {/* ── AI Settings ──────────────────────────────────────── */}
      <SectionLabel>AI Settings</SectionLabel>

      <SegmentRow<CodeStyle>
        label="Code style"
        sub="How generated Luau is written"
        value={settings.codeStyle}
        options={[
          { value: 'beginner', label: 'Beginner' },
          { value: 'advanced', label: 'Advanced' },
        ]}
        onChange={(v) => update('codeStyle', v)}
      />

      <SegmentRow<BuildScale>
        label="Default build scale"
        value={settings.buildScale}
        options={[
          { value: 'small',   label: 'Small'   },
          { value: 'medium',  label: 'Medium'  },
          { value: 'large',   label: 'Large'   },
          { value: 'massive', label: 'Massive' },
        ]}
        onChange={(v) => update('buildScale', v)}
      />

      <ToggleRow
        label="Auto-execute in Studio"
        sub="Send code to Studio immediately after generation"
        checked={settings.autoExecute}
        onChange={(v) => update('autoExecute', v)}
      />

      <div className="px-3 py-2.5">
        <p className="text-xs text-gray-200 font-medium leading-tight">Language</p>
        <p className="text-[10px] text-gray-500 mt-0.5">English &mdash; more coming soon</p>
      </div>

      <Divider />

      {/* ── Editor Settings ──────────────────────────────────── */}
      <SectionLabel>Editor Settings</SectionLabel>

      <ThemeGrid
        value={settings.theme}
        onChange={(v) => update('theme', v)}
      />

      <SegmentRow<FontSize>
        label="Font size"
        sub="Chat and code output text size"
        value={settings.fontSize}
        options={[
          { value: 'small',  label: 'Small'  },
          { value: 'medium', label: 'Medium' },
          { value: 'large',  label: 'Large'  },
        ]}
        onChange={(v) => update('fontSize', v)}
      />

      <ToggleRow
        label="Show line numbers"
        sub="Display line numbers in code blocks"
        checked={settings.showLineNumbers}
        onChange={(v) => update('showLineNumbers', v)}
      />

      <ToggleRow
        label="Sound effects"
        sub="UI feedback sounds on actions"
        checked={settings.soundEffects}
        onChange={(v) => update('soundEffects', v)}
      />

      <ToggleRow
        label="Auto-save"
        sub="Save sessions automatically"
        checked={settings.autoSave}
        onChange={(v) => update('autoSave', v)}
      />

      <Divider />

      {/* ── Studio Connection ────────────────────────────────── */}
      <SectionLabel>Studio Connection</SectionLabel>

      <div className="mx-3 my-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: studioStatus.connected ? '#10B981' : '#6B7280',
              boxShadow:       studioStatus.connected ? '0 0 6px #10B981' : 'none',
            }}
          />
          <span className="text-xs font-semibold text-gray-200">
            {studioStatus.connected ? 'Connected' : 'Not Connected'}
          </span>
          {studioStatus.connected && studioStatus.placeName && (
            <span className="text-[10px] text-[#D4AF37] truncate flex-1">
              {studioStatus.placeName}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {studioStatus.connected && studioStatus.placeId && (
            <p className="text-[10px] text-gray-500">
              Place ID:&nbsp;
              <span className="text-gray-300 font-mono">{studioStatus.placeId}</span>
            </p>
          )}
          <p className="text-[10px] text-gray-500">
            Plugin:&nbsp;
            <span className="text-gray-300 font-mono">
              {studioStatus.pluginVersion ?? 'v1.0.0'}
            </span>
          </p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {studioStatus.connected && (
            <ActionBtn variant="danger" onClick={onDisconnect}>
              Disconnect
            </ActionBtn>
          )}
          <ActionBtn
            variant="gold"
            onClick={onRescanWorkspace}
            disabled={!studioStatus.connected}
          >
            Re-scan workspace
          </ActionBtn>
        </div>
      </div>

      <ToggleRow
        label="Auto-reconnect"
        sub="Reconnect to Studio on page focus"
        checked={settings.autoReconnect}
        onChange={(v) => update('autoReconnect', v)}
      />

      <Divider />

      {/* ── Account ──────────────────────────────────────────── */}
      <SectionLabel>Account</SectionLabel>

      <div className="mx-3 my-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-medium">Tokens used (session)</p>
          <span className="text-xs font-bold" style={{ color: '#D4AF37' }}>
            {totalTokens.toLocaleString()}
          </span>
        </div>

        {tokensRemaining !== null && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-medium">Tokens remaining</p>
            <span className="text-xs font-bold text-gray-200">
              {tokensRemaining.toLocaleString()}
            </span>
          </div>
        )}

        {tokensRemaining !== null && tokenTotal > 0 && (
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalTokens / tokenTotal) * 100)}%`,
                background: 'linear-gradient(90deg, #D4AF37, #D4AF37)',
              }}
            />
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 space-y-1.5">
        <ActionBtn variant="gold" fullWidth onClick={handleExportData}>
          {exportDone ? 'Exported!' : 'Export all data'}
        </ActionBtn>

        {showDeleteConfirm ? (
          <div
            className="rounded-lg p-2.5 space-y-2"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <p className="text-[11px] text-red-400 font-medium leading-snug">
              This will permanently delete all local projects. This cannot be undone.
            </p>
            <div className="flex gap-1.5">
              <ActionBtn variant="danger" fullWidth onClick={handleDeleteAllProjects}>
                Yes, delete all
              </ActionBtn>
              <ActionBtn variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </ActionBtn>
            </div>
          </div>
        ) : (
          <ActionBtn variant="danger" fullWidth onClick={() => setShowDeleteConfirm(true)}>
            Delete all projects
          </ActionBtn>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 pb-1">
        <p className="text-[10px] text-gray-700 text-center">ForjeGames v0.1.0</p>
      </div>
    </div>
  )
}
