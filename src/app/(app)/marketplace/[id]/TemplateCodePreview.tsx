'use client'

import React, { useState } from 'react'

// ─── Luau syntax highlighting (shared logic, duplicated here to avoid a
//     server-component → client-component import boundary issue) ────────────────

function highlightLuau(code: string): React.ReactNode[] {
  type Span = { start: number; end: number; type: 'keyword' | 'string' | 'comment' | 'number' }
  const spans: Span[] = []

  const addMatches = (re: RegExp, type: Span['type']) => {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(code)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, type })
    }
  }

  addMatches(/(--\[\[[\s\S]*?\]\]|--[^\n]*)/g, 'comment')
  addMatches(/(["'])(?:\\.|(?!\1)[^\\])*?\1/g, 'string')
  addMatches(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?|0x[0-9a-fA-F]+)\b/g, 'number')
  addMatches(/\b(local|function|if|then|else|elseif|end|for|while|do|repeat|until|return|break|continue|in|and|or|not|true|false|nil|self|type|export|import)\b/g, 'keyword')

  spans.sort((a, b) => a.start - b.start)
  const resolved: Span[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start < cursor) continue
    resolved.push(span)
    cursor = span.end
  }

  const colorMap: Record<Span['type'], string> = {
    keyword: '#D4AF37',
    string: '#4ADE80',
    comment: 'rgba(255,255,255,0.28)',
    number: '#67E8F9',
  }

  const nodes: React.ReactNode[] = []
  let pos = 0
  for (const span of resolved) {
    if (pos < span.start) nodes.push(code.slice(pos, span.start))
    nodes.push(
      <span key={span.start} style={{ color: colorMap[span.type] }}>
        {code.slice(span.start, span.end)}
      </span>
    )
    pos = span.end
  }
  if (pos < code.length) nodes.push(code.slice(pos))
  return nodes
}

// ─── Extract Luau code from description ──────────────────────────────────────

export function extractLuauFromDescription(description: string): string | null {
  const start = description.indexOf('---LUAU---')
  if (start === -1) return null
  const codeStart = start + '---LUAU---'.length
  const end = description.indexOf('---END---', codeStart)
  const code = end === -1
    ? description.slice(codeStart).trim()
    : description.slice(codeStart, end).trim()
  return code.length > 0 ? code : null
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] px-2.5 py-1 rounded-md border transition-all duration-150 font-medium"
      style={{
        border: copied ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.1)',
        background: copied ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
        color: copied ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.4)',
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── UseInEditorButton ────────────────────────────────────────────────────────

function UseInEditorButton({ slug, title }: { slug: string; title: string }) {
  return (
    <a
      href={`/editor?template=${encodeURIComponent(slug)}`}
      className="text-[10px] px-2.5 py-1 rounded-md border transition-all duration-150 font-medium"
      style={{
        border: '1px solid rgba(212,175,55,0.35)',
        background: 'rgba(212,175,55,0.08)',
        color: 'rgba(212,175,55,0.85)',
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
      title={`Open ${title} in the ForjeGames AI Editor`}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
        <path d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Use in Editor
    </a>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TemplateCodePreview({
  description,
  slug,
  title,
}: {
  description: string
  slug: string
  title: string
}) {
  const [expanded, setExpanded] = useState(false)

  const luauCode = extractLuauFromDescription(description)
  if (!luauCode) return null

  const lineCount = luauCode.split('\n').length

  return (
    <div className="bg-[#0d0d14] border border-white/10 rounded-xl overflow-hidden">
      {/* Header — always visible, acts as collapse toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          {/* Code bracket icon */}
          <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path d="M4.5 2.5L1.5 6.5L4.5 10.5M8.5 2.5L11.5 6.5L8.5 10.5" stroke="#D4AF37" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Luau Code Preview</p>
            <p className="text-[10px] text-white/30 mt-0.5">{lineCount} lines · ready to run in Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/8">
            .luau
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-white/30 transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden
          >
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {/* Expanded code pane */}
      {expanded && (
        <div>
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-t border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
          >
            <span
              className="text-[10px] tracking-widest uppercase font-semibold"
              style={{ color: 'rgba(212,175,55,0.45)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              Luau
            </span>
            <div className="flex items-center gap-2">
              <UseInEditorButton slug={slug} title={title} />
              <CopyButton code={luauCode} />
            </div>
          </div>

          {/* Code block */}
          <pre
            className="m-0 overflow-x-auto"
            style={{
              padding: '14px 16px',
              fontSize: 12,
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.72)',
              overflowY: 'auto',
              maxHeight: 380,
              whiteSpace: 'pre',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.08) transparent',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              background: 'transparent',
            }}
          >
            <code>{highlightLuau(luauCode)}</code>
          </pre>

          {/* Footer CTA */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(212,175,55,0.03)' }}
          >
            <p className="text-[11px] text-white/30">
              Load this code into the AI editor and run it against your Studio session.
            </p>
            <a
              href={`/editor?template=${encodeURIComponent(slug)}`}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-all duration-150"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #c49b2f)',
                color: '#030712',
                textDecoration: 'none',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(212,175,55,0.2)',
              }}
            >
              Open in Editor
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
