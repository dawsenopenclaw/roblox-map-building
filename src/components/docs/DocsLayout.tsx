'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
  ArrowRight,
  X,
  BookOpen,
  Terminal,
  Sparkles,
  Mic,
  Image as ImageIcon,
  ShoppingBag,
  CreditCard,
  Code,
  PackageOpen,
  LifeBuoy,
  Rocket,
  Wrench,
} from 'lucide-react'
import {
  DOCS_SEARCH_INDEX,
  searchDocs,
  type DocSearchHit,
} from '@/lib/docs-search'

// ─────────────────────────────────────────────────────────────────────────────
// Navigation model — single source of truth for the sidebar + prev/next.

export interface DocNavItem {
  href: string
  label: string
  icon?: typeof BookOpen
}

export interface DocNavSection {
  label: string
  items: DocNavItem[]
}

export const DOCS_NAV: DocNavSection[] = [
  {
    label: 'Introduction',
    items: [
      { href: '/docs', label: 'Overview', icon: BookOpen },
      { href: '/docs/getting-started', label: 'Getting Started', icon: Rocket },
    ],
  },
  {
    label: 'Editor',
    items: [
      { href: '/docs/editor', label: 'Editor Overview', icon: Terminal },
      { href: '/docs/ai-modes', label: 'AI Modes', icon: Sparkles },
      { href: '/docs/voice-input', label: 'Voice Input', icon: Mic },
      { href: '/docs/image-to-map', label: 'Image to Map', icon: ImageIcon },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { href: '/docs/studio-plugin', label: 'Studio Plugin', icon: PackageOpen },
      { href: '/docs/marketplace', label: 'Marketplace', icon: ShoppingBag },
    ],
  },
  {
    label: 'Billing',
    items: [
      { href: '/docs/pricing-credits', label: 'Pricing & Credits', icon: CreditCard },
    ],
  },
  {
    label: 'Developers',
    items: [
      { href: '/docs/api', label: 'REST API', icon: Code },
      { href: '/docs/sdk', label: 'SDKs', icon: Code },
    ],
  },
  {
    label: 'Help',
    items: [
      { href: '/docs/troubleshooting', label: 'Troubleshooting', icon: Wrench },
      { href: '/help', label: 'Support', icon: LifeBuoy },
    ],
  },
]

// Flat ordered list of docs pages — used for prev/next and to validate the
// active pathname when computing breadcrumbs.
const FLAT_DOCS: DocNavItem[] = DOCS_NAV.flatMap((section) =>
  section.items.filter((item) => item.href.startsWith('/docs')),
)

function findAdjacent(pathname: string): { prev?: DocNavItem; next?: DocNavItem } {
  const idx = FLAT_DOCS.findIndex((item) => item.href === pathname)
  if (idx === -1) return {}
  return {
    prev: idx > 0 ? FLAT_DOCS[idx - 1] : undefined,
    next: idx < FLAT_DOCS.length - 1 ? FLAT_DOCS[idx + 1] : undefined,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface DocTocItem {
  id: string
  label: string
  depth?: 2 | 3
}

export interface DocsLayoutProps {
  title: string
  description?: string
  /** Optional eyebrow shown above the title (e.g. "Guide", "Reference"). */
  eyebrow?: string
  /** Anchor links for the right-rail "On this page". */
  toc?: DocTocItem[]
  /** Hide the right rail entirely (e.g. on the docs home). */
  hideToc?: boolean
  children: ReactNode
}

export default function DocsLayout({
  title,
  description,
  eyebrow,
  toc = [],
  hideToc = false,
  children,
}: DocsLayoutProps) {
  const pathname = usePathname() ?? '/docs'
  const adjacent = useMemo(() => findAdjacent(pathname), [pathname])

  // Sidebar collapsed sections — default: all open, but each section can
  // collapse. Persist the state in-memory per page visit.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggleSection = (label: string) =>
    setCollapsed((c) => ({ ...c, [label]: !c[label] }))

  // Mobile sidebar drawer.
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Active ToC heading tracking via IntersectionObserver.
  const [activeHeading, setActiveHeading] = useState<string | null>(null)
  useEffect(() => {
    if (hideToc || toc.length === 0 || typeof window === 'undefined') return
    const elements = toc
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActiveHeading(visible.target.id)
      },
      { rootMargin: '-88px 0px -70% 0px', threshold: 0 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [toc, hideToc, pathname])

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      {/* Mobile top bar */}
      <div className="sticky top-16 z-30 border-b border-white/5 bg-[#050810]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white"
          >
            <BookOpen size={14} aria-hidden="true" />
            Docs menu
          </button>
          <span className="truncate text-xs text-white/40">{title}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-0 px-4 pt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:px-8 xl:grid-cols-[260px_minmax(0,1fr)_240px] xl:gap-10">
        {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pb-10 pr-2">
            <DocsSearch />
            <Sidebar
              pathname={pathname}
              collapsed={collapsed}
              onToggle={toggleSection}
            />
          </div>
        </aside>

        {/* ── Mobile drawer ─────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-0 flex h-full w-[82vw] max-w-[320px] flex-col overflow-y-auto border-r border-white/10 bg-[#0a0d16] p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Documentation</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close docs menu"
                  className="rounded-md p-1 text-white/60 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <DocsSearch />
              <Sidebar
                pathname={pathname}
                collapsed={collapsed}
                onToggle={toggleSection}
              />
            </div>
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="min-w-0 pb-24 pt-2 lg:pt-8">
          <article className="mx-auto max-w-3xl">
            <header className="mb-10 border-b border-white/5 pb-8">
              {eyebrow && (
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4AF37]">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-[42px]">
                {title}
              </h1>
              {description && (
                <p className="mt-4 text-base leading-relaxed text-white/55">
                  {description}
                </p>
              )}
            </header>

            <div className="docs-prose text-[15px] leading-[1.75] text-white/75">
              {children}
            </div>

            {/* Prev / next navigation */}
            {(adjacent.prev || adjacent.next) && (
              <nav
                className="mt-20 grid gap-3 border-t border-white/5 pt-8 sm:grid-cols-2"
                aria-label="Docs pagination"
              >
                {adjacent.prev ? (
                  <Link
                    href={adjacent.prev.href}
                    className="group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-left transition-colors hover:border-[#D4AF37]/30 hover:bg-white/[0.04]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      <ArrowLeft size={12} aria-hidden="true" /> Previous
                    </span>
                    <span className="mt-1 text-sm font-semibold text-white group-hover:text-[#D4AF37]">
                      {adjacent.prev.label}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
                {adjacent.next ? (
                  <Link
                    href={adjacent.next.href}
                    className="group flex flex-col rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-right transition-colors hover:border-[#D4AF37]/30 hover:bg-white/[0.04] sm:text-right"
                  >
                    <span className="inline-flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      Next <ArrowRight size={12} aria-hidden="true" />
                    </span>
                    <span className="mt-1 text-sm font-semibold text-white group-hover:text-[#D4AF37]">
                      {adjacent.next.label}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
              </nav>
            )}
          </article>
        </main>

        {/* ── Right rail: on this page ──────────────────────────────────── */}
        {!hideToc && toc.length > 0 && (
          <aside className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto pb-10 pl-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                On this page
              </p>
              <ul className="flex flex-col gap-1 border-l border-white/5">
                {toc.map((item) => {
                  const isActive = activeHeading === item.id
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block border-l-2 py-1 text-[13px] transition-colors ${
                          item.depth === 3 ? 'pl-6' : 'pl-3'
                        } ${
                          isActive
                            ? 'border-[#D4AF37] text-[#D4AF37]'
                            : 'border-transparent text-white/45 hover:text-white/80'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>
        )}
      </div>

      <style jsx global>{`
        .docs-prose h2 {
          scroll-margin-top: 96px;
          margin-top: 3rem;
          margin-bottom: 1rem;
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.015em;
          color: #ffffff;
        }
        .docs-prose h3 {
          scroll-margin-top: 96px;
          margin-top: 2.25rem;
          margin-bottom: 0.75rem;
          font-size: 1.2rem;
          font-weight: 600;
          color: #fafafa;
        }
        .docs-prose h4 {
          scroll-margin-top: 96px;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #f4f4f5;
        }
        .docs-prose p {
          margin-bottom: 1.1rem;
        }
        .docs-prose ul,
        .docs-prose ol {
          margin: 1rem 0 1.25rem;
          padding-left: 1.25rem;
        }
        .docs-prose ul {
          list-style: disc;
        }
        .docs-prose ol {
          list-style: decimal;
        }
        .docs-prose li {
          margin-bottom: 0.4rem;
        }
        .docs-prose li::marker {
          color: rgba(212, 175, 55, 0.6);
        }
        .docs-prose a {
          color: #d4af37;
          text-decoration: underline;
          text-decoration-color: rgba(212, 175, 55, 0.35);
          text-underline-offset: 3px;
          transition: text-decoration-color 0.15s;
        }
        .docs-prose a:hover {
          text-decoration-color: #d4af37;
        }
        .docs-prose code {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-size: 0.86em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #fef3c7;
        }
        .docs-prose pre code {
          background: transparent;
          border: 0;
          padding: 0;
          color: inherit;
        }
        .docs-prose strong {
          color: #fafafa;
          font-weight: 600;
        }
        .docs-prose hr {
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin: 2.5rem 0;
        }
        .docs-prose blockquote {
          border-left: 3px solid rgba(212, 175, 55, 0.5);
          padding: 0.25rem 0 0.25rem 1rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 1.25rem 0;
        }
        .docs-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          font-size: 0.92em;
        }
        .docs-prose th,
        .docs-prose td {
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 0.55rem 0.85rem;
          text-align: left;
        }
        .docs-prose th {
          background: rgba(255, 255, 255, 0.03);
          color: #fafafa;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({
  pathname,
  collapsed,
  onToggle,
}: {
  pathname: string
  collapsed: Record<string, boolean>
  onToggle: (label: string) => void
}) {
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-5">
      {DOCS_NAV.map((section) => {
        const isCollapsed = collapsed[section.label] === true
        return (
          <div key={section.label}>
            <button
              type="button"
              onClick={() => onToggle(section.label)}
              className="mb-1.5 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/35 hover:text-white/60"
              aria-expanded={!isCollapsed}
            >
              <span>{section.label}</span>
              {isCollapsed ? (
                <ChevronRight size={12} aria-hidden="true" />
              ) : (
                <ChevronDown size={12} aria-hidden="true" />
              )}
            </button>
            {!isCollapsed && (
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                          active
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {Icon && <Icon size={13} aria-hidden="true" />}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-side search box.

function DocsSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const results = useMemo<DocSearchHit[]>(() => {
    if (!query.trim()) return []
    return searchDocs(query, DOCS_SEARCH_INDEX, 8)
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      const hit = results[activeIdx]
      if (hit) window.location.href = hit.href
    }
  }

  return (
    <div className="relative mb-5">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f1220] px-3 py-2 focus-within:border-[#D4AF37]/40">
        <Search size={14} className="text-white/30" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder="Search docs..."
          aria-label="Search documentation"
          className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 focus:outline-none"
        />
        {!query && (
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
            ⌘K
          </kbd>
        )}
      </div>

      {open && query.trim() && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 max-h-[360px] overflow-y-auto rounded-xl border border-white/10 bg-[#0a0d16] p-1 shadow-2xl"
        >
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12px] text-white/40">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            results.map((hit, idx) => (
              <a
                key={hit.href + idx}
                href={hit.href}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`block rounded-md px-3 py-2 text-[12px] transition-colors ${
                  idx === activeIdx
                    ? 'bg-[#D4AF37]/10 text-white'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <div className="font-semibold">{hit.title}</div>
                {hit.snippet && (
                  <div className="truncate text-[11px] text-white/45">{hit.snippet}</div>
                )}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  )
}
