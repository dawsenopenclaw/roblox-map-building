'use client'

/**
 * ManualBuildPanel — the "no-plugin" safety net.
 *
 * Studio building is ForjeGames' core feature and it MUST work for every
 * user, whether or not they have the plugin installed. When Studio isn't
 * connected, this panel renders inline inside the chat feed for each build
 * response, giving the user three ways to get the generated code into
 * Roblox Studio:
 *
 *   1. Copy the raw Luau and paste into the Command Bar
 *   2. Download a .rbxmx model file and drag it into the viewport
 *   3. Install the plugin for real-time sync (link-out only)
 *
 * The panel is intentionally self-contained — no external state, no store.
 * It is rendered by ChatPanel next to each assistant message that has a
 * `luauCode` field, only when `studioConnected === false`.
 */

import { useState, useCallback, useMemo } from 'react'

interface ManualBuildPanelProps {
  /** The raw Luau code the AI generated. */
  luauCode: string
  /** Optional user prompt — used for the download file name. */
  prompt?: string
}

type CopyState = 'idle' | 'copied' | 'failed'
type DownloadState = 'idle' | 'generating' | 'ready' | 'error'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeFileName(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\- ]+/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 48) || 'build'
  )
}

// ─── Minimal Luau syntax-highlighter (no deps) ───────────────────────────────
// Full highlighters (prism, shiki) add ~100 kB. We only need keyword / string /
// number / comment colors here — a light regex pass is enough.

const LUAU_KEYWORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true',
  'until', 'while', 'continue', 'type', 'export',
])
const LUAU_BUILTINS = new Set([
  'Instance', 'Vector3', 'CFrame', 'Color3', 'BrickColor', 'Enum',
  'workspace', 'game', 'script', 'print', 'warn', 'error',
  'task', 'pairs', 'ipairs', 'tostring', 'tonumber', 'type',
])

interface Token {
  text: string
  color: string
}

function highlightLuau(code: string): Token[] {
  const tokens: Token[] = []
  const len = code.length
  let i = 0
  // Colors tuned for the ForjeGames dark theme (gold accent).
  const C_PLAIN = 'rgba(255,255,255,0.82)'
  const C_COMMENT = 'rgba(140,148,176,0.55)'
  const C_STRING = 'rgba(166,226,46,0.9)'
  const C_NUMBER = 'rgba(255,195,108,0.92)'
  const C_KEYWORD = 'rgba(212,175,55,0.95)'
  const C_BUILTIN = 'rgba(137,207,240,0.88)'

  while (i < len) {
    const ch = code[i]
    // Line comment "-- ..."
    if (ch === '-' && code[i + 1] === '-') {
      let j = i
      while (j < len && code[j] !== '\n') j += 1
      tokens.push({ text: code.slice(i, j), color: C_COMMENT })
      i = j
      continue
    }
    // String literal
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < len && code[j] !== ch) {
        if (code[j] === '\\') j += 2
        else j += 1
      }
      tokens.push({ text: code.slice(i, Math.min(j + 1, len)), color: C_STRING })
      i = j + 1
      continue
    }
    // Number literal
    if (/[0-9]/.test(ch)) {
      let j = i
      while (j < len && /[0-9.]/.test(code[j])) j += 1
      tokens.push({ text: code.slice(i, j), color: C_NUMBER })
      i = j
      continue
    }
    // Identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < len && /[A-Za-z0-9_]/.test(code[j])) j += 1
      const word = code.slice(i, j)
      let color = C_PLAIN
      if (LUAU_KEYWORDS.has(word)) color = C_KEYWORD
      else if (LUAU_BUILTINS.has(word)) color = C_BUILTIN
      tokens.push({ text: word, color })
      i = j
      continue
    }
    // Fallback — single char
    tokens.push({ text: ch, color: C_PLAIN })
    i += 1
  }
  return tokens
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ManualBuildPanel({ luauCode, prompt }: ManualBuildPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [downloadState, setDownloadState] = useState<DownloadState>('idle')
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // Highlight once per code change — even long builds are <500 lines.
  const tokens = useMemo(() => highlightLuau(luauCode), [luauCode])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(luauCode)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 2500)
    }
  }, [luauCode])

  const handleDownload = useCallback(async () => {
    setDownloadState('generating')
    setDownloadError(null)
    try {
      const res = await fetch('/api/studio/export-rbxm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          luauCode,
          fileName: sanitizeFileName(prompt ?? 'build'),
        }),
      })
      if (!res.ok) {
        let message = `Export failed (${res.status})`
        try {
          const data = await res.json() as { message?: string; error?: string }
          message = data.message || data.error || message
        } catch { /* ignore */ }
        setDownloadError(message)
        setDownloadState('error')
        return
      }
      // Stream into a Blob and trigger a browser download.
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sanitizeFileName(prompt ?? 'build')}.rbxmx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Free the blob URL on next tick — anchor click has consumed it.
      setTimeout(() => URL.revokeObjectURL(url), 500)
      setDownloadState('ready')
      setTimeout(() => setDownloadState('idle'), 1800)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Network error')
      setDownloadState('error')
    }
  }, [luauCode, prompt])

  // Truncate the preview when collapsed to keep the chat feed scannable.
  const previewTokens = expanded ? tokens : tokens.slice(0, 180)
  const truncated = !expanded && tokens.length > previewTokens.length

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 10,
        border: '1px solid rgba(212,175,55,0.18)',
        background: 'linear-gradient(180deg, rgba(20,24,44,0.85) 0%, rgba(12,16,32,0.9) 100%)',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header: "Manual build mode" warning */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#FACC15',
            boxShadow: '0 0 6px rgba(250,204,21,0.45)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(250,204,21,0.9)', letterSpacing: 0.2 }}>
          Studio not connected — manual mode
        </span>
      </div>

      {/* Step-by-step instructions */}
      <div style={{ padding: '10px 12px', fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
        <div style={{ marginBottom: 4 }}>
          <strong style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>1.</strong> Copy the code below.
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>2.</strong> Open Roblox Studio.
        </div>
        <div style={{ marginBottom: 4 }}>
          <strong style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>3.</strong> Open the Command Bar (<em>View → Command Bar</em>).
        </div>
        <div>
          <strong style={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>4.</strong> Paste and press Enter.
        </div>
      </div>

      {/* Code block with syntax highlighting */}
      <div
        style={{
          position: 'relative',
          margin: '0 12px 10px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.42)',
          border: '1px solid rgba(255,255,255,0.05)',
          maxHeight: expanded ? 420 : 180,
          overflow: 'auto',
          fontSize: 11.5,
          fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
          padding: '10px 12px',
          lineHeight: 1.55,
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {previewTokens.map((tok, idx) => (
            <span key={idx} style={{ color: tok.color }}>{tok.text}</span>
          ))}
          {truncated && (
            <span style={{ color: 'rgba(140,148,176,0.55)' }}>
              {'\n…'}
            </span>
          )}
        </pre>
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 12px 12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleCopy}
          type="button"
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: '1px solid rgba(212,175,55,0.3)',
            background: copyState === 'copied'
              ? 'rgba(74,222,128,0.14)'
              : 'rgba(212,175,55,0.10)',
            color: copyState === 'copied'
              ? 'rgba(74,222,128,0.95)'
              : 'rgba(212,175,55,0.95)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy code'}
        </button>

        <button
          onClick={handleDownload}
          type="button"
          disabled={downloadState === 'generating'}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.10)',
            background: downloadState === 'ready'
              ? 'rgba(74,222,128,0.14)'
              : 'rgba(255,255,255,0.04)',
            color: downloadState === 'ready'
              ? 'rgba(74,222,128,0.95)'
              : 'rgba(255,255,255,0.78)',
            fontSize: 11,
            fontWeight: 600,
            cursor: downloadState === 'generating' ? 'wait' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          title="Download as .rbxmx model file — drag it into your Studio viewport"
        >
          {downloadState === 'generating'
            ? 'Generating…'
            : downloadState === 'ready'
            ? 'Downloaded!'
            : 'Download .rbxmx'}
        </button>

        {tokens.length > 180 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            type="button"
            style={{
              padding: '6px 10px',
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {expanded ? 'Collapse' : 'Show all'}
          </button>
        )}

        <a
          href="/download"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            padding: '6px 10px',
            borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 10.5,
            textDecoration: 'none',
            fontFamily: 'Inter, sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          title="Install the plugin for real-time sync"
        >
          Install plugin →
        </a>
      </div>

      {downloadError && (
        <div
          style={{
            padding: '0 12px 10px',
            fontSize: 10.5,
            color: 'rgba(248,113,113,0.85)',
            fontFamily: 'Inter, sans-serif',
          }}
          role="alert"
        >
          {downloadError}
        </div>
      )}
    </div>
  )
}
