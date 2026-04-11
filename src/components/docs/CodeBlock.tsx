'use client'

import { useMemo, useState, useCallback } from 'react'
import { Check, Copy } from 'lucide-react'

export interface CodeTab {
  label: string
  language: string
  code: string
}

interface CodeBlockProps {
  /** Single-language usage. Omit when passing `tabs`. */
  code?: string
  language?: string
  /** Multi-language usage. */
  tabs?: CodeTab[]
  /** Optional filename/header label shown above the code. */
  filename?: string
  /** Show line numbers (default: true). */
  lineNumbers?: boolean
  /** 1-indexed line numbers to highlight. */
  highlightLines?: number[]
}

// Extremely small, deterministic token colorizer. It is intentionally
// framework-free so it ships fine with SSR and avoids pulling in a full
// syntax-highlighter dependency. Languages we target: ts/tsx/js, python,
// bash, lua, json.
function tokenize(language: string, code: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const lang = language.toLowerCase()

  const keywords: Record<string, RegExp> = {
    ts: /\b(const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|class|interface|type|extends|implements|new|this|true|false|null|undefined|as|in|of|try|catch|throw)\b/g,
    tsx: /\b(const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|class|interface|type|extends|implements|new|this|true|false|null|undefined|as|in|of|try|catch|throw)\b/g,
    typescript:
      /\b(const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|class|interface|type|extends|implements|new|this|true|false|null|undefined|as|in|of|try|catch|throw)\b/g,
    javascript:
      /\b(const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|class|new|this|true|false|null|undefined|in|of|try|catch|throw)\b/g,
    js: /\b(const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|class|new|this|true|false|null|undefined|in|of|try|catch|throw)\b/g,
    python:
      /\b(def|class|return|if|elif|else|for|while|import|from|as|async|await|None|True|False|with|try|except|finally|raise|pass|in|not|and|or|is|lambda|yield|self)\b/g,
    py: /\b(def|class|return|if|elif|else|for|while|import|from|as|async|await|None|True|False|with|try|except|finally|raise|pass|in|not|and|or|is|lambda|yield|self)\b/g,
    bash: /\b(if|then|else|fi|for|do|done|while|case|esac|function|export|return|in)\b/g,
    sh: /\b(if|then|else|fi|for|do|done|while|case|esac|function|export|return|in)\b/g,
    lua: /\b(local|function|end|if|then|else|elseif|return|for|do|while|in|nil|true|false|and|or|not|repeat|until|break)\b/g,
    json: /\b(true|false|null)\b/g,
  }
  const kwRe = keywords[lang] ?? keywords.ts

  // Mask strings & comments first so regex doesn't bleed into them.
  type Span = { start: number; end: number; cls: string; text: string }
  const spans: Span[] = []

  const pushSpans = (re: RegExp, cls: string) => {
    let m: RegExpExecArray | null
    while ((m = re.exec(code)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length, cls, text: m[0] })
    }
  }

  // order matters: comments first, then strings, then numbers, then keywords
  if (lang === 'python' || lang === 'py' || lang === 'bash' || lang === 'sh') {
    pushSpans(/#[^\n]*/g, 'cmt')
  }
  pushSpans(/\/\/[^\n]*/g, 'cmt')
  pushSpans(/\/\*[\s\S]*?\*\//g, 'cmt')
  pushSpans(/"(?:[^"\\\n]|\\.)*"/g, 'str')
  pushSpans(/'(?:[^'\\\n]|\\.)*'/g, 'str')
  pushSpans(/`(?:[^`\\]|\\.)*`/g, 'str')
  pushSpans(/\b\d+(?:\.\d+)?\b/g, 'num')
  pushSpans(kwRe, 'kw')

  // Resolve overlaps: keep the first (earlier in the list = earlier priority).
  spans.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start))
  const accepted: Span[] = []
  let cursor = 0
  for (const s of spans) {
    if (s.start < cursor) continue
    accepted.push(s)
    cursor = s.end
  }

  // Stitch.
  let out = ''
  let i = 0
  for (const s of accepted) {
    if (s.start > i) out += escape(code.slice(i, s.start))
    out += `<span class="tok-${s.cls}">${escape(s.text)}</span>`
    i = s.end
  }
  if (i < code.length) out += escape(code.slice(i))
  return out
}

function renderLines(
  html: string,
  opts: { lineNumbers: boolean; highlightLines: Set<number> },
): string {
  const rawLines = html.split('\n')
  return rawLines
    .map((line, idx) => {
      const n = idx + 1
      const highlighted = opts.highlightLines.has(n)
      return `<span class="code-line${
        highlighted ? ' code-line-hl' : ''
      }" data-line="${n}">${
        opts.lineNumbers
          ? `<span class="code-line-num" aria-hidden="true">${n}</span>`
          : ''
      }<span class="code-line-content">${line || ' '}</span></span>`
    })
    .join('\n')
}

export default function CodeBlock({
  code,
  language = 'text',
  tabs,
  filename,
  lineNumbers = true,
  highlightLines = [],
}: CodeBlockProps) {
  const resolvedTabs: CodeTab[] = useMemo(() => {
    if (tabs && tabs.length > 0) return tabs
    return [{ label: language || 'code', language, code: code ?? '' }]
  }, [tabs, code, language])

  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)

  const current = resolvedTabs[active] ?? resolvedTabs[0]

  const highlightSet = useMemo(() => new Set(highlightLines), [highlightLines])

  const rendered = useMemo(() => {
    const tokenized = tokenize(current.language, current.code)
    return renderLines(tokenized, {
      lineNumbers,
      highlightLines: highlightSet,
    })
  }, [current, lineNumbers, highlightSet])

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(current.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      // no-op
    }
  }, [current])

  return (
    <figure className="group my-6 overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0f]">
      <style jsx global>{`
        .forje-code pre {
          margin: 0;
          padding: 14px 0;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
            'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #e4e4e7;
          tab-size: 2;
        }
        .forje-code .code-line {
          display: block;
          padding: 0 16px;
          position: relative;
        }
        .forje-code .code-line-hl {
          background: rgba(212, 175, 55, 0.09);
          box-shadow: inset 2px 0 0 #d4af37;
        }
        .forje-code .code-line-num {
          display: inline-block;
          width: 2.25rem;
          margin-right: 1rem;
          text-align: right;
          color: #52525b;
          user-select: none;
        }
        .forje-code .tok-kw {
          color: #f472b6;
        }
        .forje-code .tok-str {
          color: #86efac;
        }
        .forje-code .tok-num {
          color: #fcd34d;
        }
        .forje-code .tok-cmt {
          color: #71717a;
          font-style: italic;
        }
      `}</style>

      <div className="flex items-center justify-between gap-3 border-b border-white/5 bg-[#0f0f13] px-3 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {resolvedTabs.length > 1 ? (
            resolvedTabs.map((tab, idx) => (
              <button
                key={`${tab.label}-${idx}`}
                type="button"
                onClick={() => setActive(idx)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  idx === active
                    ? 'bg-white/10 text-white'
                    : 'text-white/45 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))
          ) : (
            <span className="px-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
              {filename ?? current.language}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy size={12} aria-hidden="true" /> Copy
            </>
          )}
        </button>
      </div>

      <div className="forje-code">
        <pre>
          <code
            className={`language-${current.language}`}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </pre>
      </div>
    </figure>
  )
}
