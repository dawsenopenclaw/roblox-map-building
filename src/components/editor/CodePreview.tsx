'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodePreviewMetadata {
  lines: number
  instances?: number
  performance?: string
  tokens?: number
}

export interface CodePreviewProps {
  code: string
  /** Previous version of the code — when provided, renders a diff view */
  previousCode?: string
  title?: string
  onExecute?: (code: string) => void
  onCopy?: () => void
  metadata?: CodePreviewMetadata
}

// ─── Diff Engine ──────────────────────────────────────────────────────────────

type DiffLineType = 'added' | 'removed' | 'unchanged'
interface DiffLine {
  type: DiffLineType
  content: string
  oldLineNum?: number
  newLineNum?: number
}

function computeLineDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n')
  const newLines = newCode.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based diff (Myers would be better but this works for our sizes)
  const lcs = buildLCSTable(oldLines, newLines)
  let i = oldLines.length
  let j = newLines.length
  const reversed: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      reversed.push({ type: 'unchanged', content: oldLines[i - 1]!, oldLineNum: i, newLineNum: j })
      i--; j--
    } else if (j > 0 && (i === 0 || (lcs[i]?.[j - 1] ?? 0) >= (lcs[i - 1]?.[j] ?? 0))) {
      reversed.push({ type: 'added', content: newLines[j - 1]!, newLineNum: j })
      j--
    } else if (i > 0) {
      reversed.push({ type: 'removed', content: oldLines[i - 1]!, oldLineNum: i })
      i--
    }
  }

  for (let k = reversed.length - 1; k >= 0; k--) result.push(reversed[k]!)
  return result
}

function buildLCSTable(a: string[], b: string[]): number[][] {
  const m = a.length, n = b.length
  // For very large diffs, skip LCS and just show all as changed
  if (m > 500 || n > 500) return []
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? (dp[i - 1]?.[j - 1] ?? 0) + 1
        : Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0)
    }
  }
  return dp
}

// ─── Script Tab Detection ──────────────────────────────────────────────────────

interface ScriptTab {
  label: string
  code: string
}

function detectScriptType(block: string): string {
  const lower = block.toLowerCase()
  if (lower.includes('-- localscript') || lower.includes('--localscript') || lower.includes('game.players.localplayer') || lower.includes('localplayer')) return 'LocalScript'
  if (lower.includes('-- modulescript') || lower.includes('--modulescript') || lower.includes('return {') || lower.includes('local module =')) return 'ModuleScript'
  if (lower.includes('-- serverscript') || lower.includes('--serverscript') || lower.includes('game.players.playeradded') || lower.includes('players.playeradded')) return 'ServerScript'
  return 'Script'
}

function parseCodeBlocks(rawCode: string): ScriptTab[] {
  // Split on triple-backtick lua/luau fences first
  const fencePattern = /```(?:lua|luau)?\n([\s\S]*?)```/g
  const blocks: ScriptTab[] = []
  let match: RegExpExecArray | null

  while ((match = fencePattern.exec(rawCode)) !== null) {
    const block = match[1].trim()
    if (block.length > 0) {
      blocks.push({ label: detectScriptType(block), code: block })
    }
  }

  // If no fenced blocks, treat entire string as one script
  if (blocks.length === 0) {
    return [{ label: detectScriptType(rawCode), code: rawCode.trim() }]
  }

  // De-duplicate labels (ServerScript, ServerScript2…)
  const seen: Record<string, number> = {}
  return blocks.map((b) => {
    const count = (seen[b.label] = (seen[b.label] ?? 0) + 1)
    return { ...b, label: count === 1 ? b.label : `${b.label} ${count}` }
  })
}

// ─── Luau Syntax Highlighter ──────────────────────────────────────────────────

interface Token {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'funcname' | 'plain'
  value: string
}

const KEYWORDS = new Set([
  'local', 'function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'while',
  'do', 'return', 'true', 'false', 'nil', 'not', 'and', 'or', 'in', 'repeat',
  'until', 'break', 'continue', 'type', 'export',
])

function tokenizeLuau(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Comment: -- to end of line
    if (line[i] === '-' && line[i + 1] === '-') {
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }

    // String: single or double quoted
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i]
      let j = i + 1
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++ // skip escaped char
        j++
      }
      j++ // closing quote
      tokens.push({ type: 'string', value: line.slice(i, j) })
      i = j
      continue
    }

    // Long string [[ ... ]]
    if (line[i] === '[' && line[i + 1] === '[') {
      const end = line.indexOf(']]', i + 2)
      if (end !== -1) {
        tokens.push({ type: 'string', value: line.slice(i, end + 2) })
        i = end + 2
        continue
      }
    }

    // Number (integer or float, optionally prefixed with 0x)
    if (/[0-9]/.test(line[i]) || (line[i] === '.' && /[0-9]/.test(line[i + 1] ?? ''))) {
      let j = i
      if (line[j] === '0' && (line[j + 1] === 'x' || line[j + 1] === 'X')) {
        j += 2
        while (j < line.length && /[0-9a-fA-F_]/.test(line[j])) j++
      } else {
        while (j < line.length && /[0-9._eE]/.test(line[j])) j++
      }
      tokens.push({ type: 'number', value: line.slice(i, j) })
      i = j
      continue
    }

    // Identifier or keyword
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++
      const word = line.slice(i, j)

      // Function name: identifier immediately followed by (
      const rest = line.slice(j).trimStart()
      if (rest.startsWith('(') && !KEYWORDS.has(word)) {
        tokens.push({ type: 'funcname', value: word })
      } else if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    // Fallback: single char
    tokens.push({ type: 'plain', value: line[i] })
    i++
  }

  return tokens
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  keyword:  '#C084FC', // purple
  string:   '#4ADE80', // green
  number:   '#FB923C', // orange
  comment:  '#6B7280', // grey
  funcname: '#60A5FA', // blue
  plain:    '#E5E7EB', // near-white
}

function HighlightedLine({ line, showLineNum, lineNum }: { line: string; showLineNum: boolean; lineNum: number }) {
  const tokens = tokenizeLuau(line)
  return (
    <div style={{ display: 'flex', minHeight: '1.5em' }}>
      {showLineNum && (
        <span style={{
          minWidth: '2.8rem',
          paddingRight: '1rem',
          textAlign: 'right',
          color: '#4B5563',
          userSelect: 'none',
          flexShrink: 0,
        }}>
          {lineNum}
        </span>
      )}
      <span style={{ flex: 1, whiteSpace: 'pre' }}>
        {tokens.map((tok, idx) => (
          <span key={idx} style={{ color: TOKEN_COLORS[tok.type] }}>{tok.value}</span>
        ))}
      </span>
    </div>
  )
}

// ─── Performance Rating Badge ──────────────────────────────────────────────────

const PERF_COLORS: Record<string, { bg: string; text: string }> = {
  Excellent: { bg: 'rgba(74,222,128,0.15)',  text: '#4ADE80' },
  Good:      { bg: 'rgba(250,204,21,0.15)',  text: '#FACC15' },
  Fair:      { bg: 'rgba(251,146,60,0.15)',  text: '#FB923C' },
  Poor:      { bg: 'rgba(248,113,113,0.15)', text: '#F87171' },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CodePreview({ code, previousCode, title, onExecute, onCopy, metadata }: CodePreviewProps) {
  const tabs = parseCodeBlocks(code)
  const [activeTab, setActiveTab] = useState(0)
  const [showLineNums, setShowLineNums] = useState(true)
  const [showDiff, setShowDiff] = useState(!!previousCode)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset active tab when the code prop changes (tab count may shrink)
  useEffect(() => {
    setActiveTab(0)
    setEditing(false)
    setEditValue('')
  }, [code])

  const currentCode = tabs[activeTab]?.code ?? ''

  // When switching tabs, exit editing mode
  useEffect(() => {
    setEditing(false)
    setEditValue('')
  }, [activeTab])

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(0, 0)
    }
  }, [editing])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea')
      el.value = currentCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [currentCode, onCopy])

  const handleSendToStudio = useCallback(() => {
    onExecute?.(currentCode)
  }, [currentCode, onExecute])

  const handleEditAndResend = useCallback(() => {
    setEditValue(currentCode)
    setEditing(true)
  }, [currentCode])

  const handleRunEdited = useCallback(() => {
    onExecute?.(editValue)
    setEditing(false)
  }, [editValue, onExecute])

  const handleCancelEdit = useCallback(() => {
    setEditing(false)
    setEditValue('')
  }, [])

  const handleDownload = useCallback(() => {
    const label = tabs[activeTab]?.label ?? 'script'
    const filename = `${label.replace(/\s+/g, '_').toLowerCase()}.lua`
    const blob = new Blob([currentCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    // Revoke on the next tick — some browsers need the URL to remain valid
    // until after the click event has been fully processed.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }, [currentCode, tabs, activeTab])

  const lines = currentCode.split('\n')
  const lineCount = metadata?.lines ?? lines.length
  const perfKey = metadata?.performance ?? ''
  const perfStyle = PERF_COLORS[perfKey]

  // ── Styles ──

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: '10px',
    overflow: 'hidden',
    fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
    fontSize: '13px',
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.4)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexWrap: 'wrap',
  }

  const titleStyle: React.CSSProperties = {
    color: '#9CA3AF',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    marginRight: 'auto',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
  }

  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#D1D5DB',
    fontSize: '11px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  }

  const btnGold: React.CSSProperties = {
    ...btnBase,
    border: '1px solid rgba(212,175,55,0.4)',
    background: 'rgba(212,175,55,0.1)',
    color: '#D4AF37',
  }

  const btnGreen: React.CSSProperties = {
    ...btnBase,
    border: '1px solid rgba(74,222,128,0.35)',
    background: 'rgba(74,222,128,0.08)',
    color: '#4ADE80',
  }

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.2)',
    overflowX: 'auto',
  }

  const codeAreaStyle: React.CSSProperties = {
    padding: '12px 16px',
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '420px',
    background: 'rgba(0,0,0,0.3)',
    lineHeight: '1.6',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '280px',
    maxHeight: '420px',
    resize: 'vertical',
    background: 'rgba(0,0,0,0.5)',
    color: '#E5E7EB',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '13px',
    fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
    lineHeight: '1.6',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '7px 14px',
    background: 'rgba(0,0,0,0.4)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    flexWrap: 'wrap',
  }

  const metaChipStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontFamily: 'Inter, sans-serif',
    color: '#6B7280',
  }

  return (
    <div style={containerStyle}>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        {title && <span style={titleStyle}>{title}</span>}

        {/* Copy */}
        <button style={copied ? btnGreen : btnBase} onClick={handleCopy}>
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5V4a1.5 1.5 0 00-1.5-1.5H4A1.5 1.5 0 002.5 4v7A1.5 1.5 0 004 12.5h1" stroke="currentColor" strokeWidth="1.5"/></svg>
              Copy
            </>
          )}
        </button>

        {/* Send to Studio */}
        {onExecute && (
          <button style={btnGold} onClick={handleSendToStudio}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8l10-5-3 5 3 5L2 8z" fill="currentColor"/></svg>
            Send to Studio
          </button>
        )}

        {/* Edit & Re-send */}
        {onExecute && !editing && (
          <button style={btnBase} onClick={handleEditAndResend}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            Edit & Re-send
          </button>
        )}

        {/* Download */}
        <button style={btnBase} onClick={handleDownload}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          .lua
        </button>

        {/* Diff toggle — only when previousCode is provided */}
        {previousCode && (
          <button
            style={{ ...btnBase, color: showDiff ? '#4ADE80' : '#6B7280', borderColor: showDiff ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.1)' }}
            onClick={() => setShowDiff((v) => !v)}
            title="Toggle diff view"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4h3M4 8h5M4 12h4" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 4h3M9 8h3M9 12h3" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Diff
          </button>
        )}

        {/* Line numbers toggle */}
        <button
          style={{ ...btnBase, color: showLineNums ? '#D4AF37' : '#6B7280', borderColor: showLineNums ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.1)' }}
          onClick={() => setShowLineNums((v) => !v)}
          title="Toggle line numbers"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M5 4h9M5 8h9M5 12h9M2 4h.5M2 8h.5M2 12h.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          #
        </button>
      </div>

      {/* Tabs — only shown when multiple blocks */}
      {tabs.length > 1 && (
        <div style={tabBarStyle}>
          {tabs.map((tab, idx) => {
            const isActive = idx === activeTab
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                style={{
                  padding: '7px 14px',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  color: isActive ? '#D4AF37' : '#6B7280',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #D4AF37' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Code display or edit textarea */}
      {editing ? (
        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)' }}>
          <textarea
            ref={textareaRef}
            style={textareaStyle}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button style={btnGold} onClick={handleRunEdited}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 5-10 5V3z" fill="currentColor"/></svg>
              Run edited code
            </button>
            <button style={btnBase} onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : showDiff && previousCode ? (
        /* ── Diff View ── */
        <div style={codeAreaStyle}>
          {computeLineDiff(previousCode, currentCode).map((diffLine, idx) => {
            const bgColor = diffLine.type === 'added'
              ? 'rgba(74,222,128,0.1)'
              : diffLine.type === 'removed'
                ? 'rgba(248,113,113,0.1)'
                : 'transparent'
            const prefix = diffLine.type === 'added' ? '+' : diffLine.type === 'removed' ? '-' : ' '
            const prefixColor = diffLine.type === 'added' ? '#4ADE80' : diffLine.type === 'removed' ? '#F87171' : '#4B5563'

            return (
              <div key={idx} style={{ display: 'flex', minHeight: '1.5em', background: bgColor, borderLeft: diffLine.type !== 'unchanged' ? `3px solid ${prefixColor}` : '3px solid transparent', paddingLeft: '4px' }}>
                {showLineNums && (
                  <span style={{ minWidth: '2rem', paddingRight: '0.5rem', textAlign: 'right', color: '#4B5563', userSelect: 'none', flexShrink: 0, fontSize: '11px' }}>
                    {diffLine.type === 'removed' ? diffLine.oldLineNum : diffLine.type === 'added' ? diffLine.newLineNum : diffLine.newLineNum}
                  </span>
                )}
                <span style={{ color: prefixColor, minWidth: '1rem', userSelect: 'none', flexShrink: 0 }}>{prefix}</span>
                <span style={{ flex: 1, whiteSpace: 'pre', textDecoration: diffLine.type === 'removed' ? 'line-through' : 'none', opacity: diffLine.type === 'removed' ? 0.7 : 1 }}>
                  {tokenizeLuau(diffLine.content).map((tok, tidx) => (
                    <span key={tidx} style={{ color: TOKEN_COLORS[tok.type] }}>{tok.value}</span>
                  ))}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Normal View ── */
        <div style={codeAreaStyle}>
          {lines.map((line, idx) => (
            <HighlightedLine
              key={idx}
              line={line}
              showLineNum={showLineNums}
              lineNum={idx + 1}
            />
          ))}
        </div>
      )}

      {/* Metadata footer */}
      <div style={footerStyle}>
        {/* Lines */}
        <span style={metaChipStyle}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {lineCount} lines
        </span>

        {/* Instances */}
        {metadata?.instances !== undefined && (
          <span style={metaChipStyle}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
            ~{metadata.instances.toLocaleString()} instances
          </span>
        )}

        {/* Performance */}
        {perfKey && perfStyle && (
          <span style={{
            ...metaChipStyle,
            background: perfStyle.bg,
            color: perfStyle.text,
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${perfStyle.text}33`,
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {perfKey}
          </span>
        )}

        {/* Token cost */}
        {metadata?.tokens !== undefined && (
          <span style={{ ...metaChipStyle, marginLeft: 'auto' }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v6M6 7h3.5a1.5 1.5 0 010 3H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {metadata.tokens.toLocaleString()} tokens
          </span>
        )}
      </div>
    </div>
  )
}
