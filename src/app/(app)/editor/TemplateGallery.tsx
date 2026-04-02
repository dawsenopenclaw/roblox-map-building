'use client'

import { useState, useEffect, useCallback } from 'react'
import { GAME_TEMPLATES, TEMPLATE_CATEGORIES } from './templates'
import type { TemplateCategory, GameTemplate } from './templates'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  open: boolean
  onClose: () => void
  onSelect: (prompt: string) => void
}

// ─── Category tab ──────────────────────────────────────────────────────────────

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium transition-all duration-150 flex-shrink-0"
      style={{
        padding: '5px 12px',
        borderRadius: '6px',
        background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
        border: `1px solid ${active ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.06)'}`,
        color: active ? '#D4AF37' : '#71717a',
      }}
    >
      {label}
    </button>
  )
}

// ─── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onSelect,
  index,
}: {
  template: GameTemplate
  onSelect: (t: GameTemplate) => void
  index: number
}) {
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 30)
    return () => clearTimeout(t)
  }, [index])

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(template)}
      className="text-left w-full transition-all duration-200 active:scale-95"
      style={{
        padding: '14px',
        borderRadius: '10px',
        background: hovered
          ? `linear-gradient(135deg, rgba(${hexToRgb(template.previewColor)},0.12) 0%, rgba(255,255,255,0.03) 100%)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? `${template.previewColor}55` : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? `0 0 16px ${template.previewColor}22` : 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity 0.25s ease-out ${index * 30}ms, transform 0.25s ease-out ${index * 30}ms, background 0.15s, border-color 0.15s, box-shadow 0.15s`,
      }}
    >
      {/* Icon + name row */}
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="flex-shrink-0 flex items-center justify-center text-lg"
          style={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${template.previewColor}30, ${template.previewColor}10)`,
            border: `1px solid ${template.previewColor}40`,
          }}
        >
          {template.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">{template.name}</p>
          <p
            className="text-[10px] font-medium mt-0.5"
            style={{ color: template.previewColor, opacity: 0.85 }}
          >
            {template.category}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
        {template.description}
      </p>

      {/* Use template CTA */}
      {hovered && (
        <div
          className="mt-3 flex items-center gap-1 text-xs font-medium"
          style={{ color: '#D4AF37' }}
        >
          <span>Use this template</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  )
}

// ─── Hex → rgb helper (no alpha) ──────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

// ─── Main modal ────────────────────────────────────────────────────────────────

export function TemplateGallery({ open, onClose, onSelect }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'All'>('All')
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  // Animate in
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setMounted(true), 10)
      return () => clearTimeout(t)
    } else {
      setMounted(false)
    }
  }, [open])

  // Dismiss on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSelect = useCallback(
    (template: GameTemplate) => {
      onSelect(template.initialPrompt)
      onClose()
    },
    [onSelect, onClose],
  )

  if (!open) return null

  const lowerSearch = search.toLowerCase()
  const filtered = GAME_TEMPLATES.filter((t) => {
    const matchCategory = activeCategory === 'All' || t.category === activeCategory
    const matchSearch =
      !lowerSearch ||
      t.name.toLowerCase().includes(lowerSearch) ||
      t.description.toLowerCase().includes(lowerSearch) ||
      t.category.toLowerCase().includes(lowerSearch)
    return matchCategory && matchSearch
  })

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal panel */}
      <div
        className="relative flex flex-col w-full sm:max-w-2xl"
        style={{
          background: '#0c0c0e',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          maxHeight: '85vh',
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease',
          opacity: mounted ? 1 : 0,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-start justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2 className="text-base font-bold text-zinc-100">Start from a template</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pick a game type — ForjeAI builds the full starter kit for you.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors ml-4 mt-0.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search + category filters */}
        <div className="flex-shrink-0 px-5 py-3 flex flex-col gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Search */}
          <div
            className="flex items-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '8px',
              padding: '6px 10px',
            }}
          >
            <svg className="flex-shrink-0 text-zinc-600" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <CategoryTab
              label="All"
              active={activeCategory === 'All'}
              onClick={() => setActiveCategory('All')}
            />
            {TEMPLATE_CATEGORIES.map((cat) => (
              <CategoryTab
                key={cat}
                label={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto forge-scroll px-5 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-3xl mb-3">🔍</span>
              <p className="text-sm text-zinc-500">No templates match &ldquo;{search}&rdquo;</p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('All') }}
                className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filtered.map((template, i) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelect}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-zinc-600">
            {filtered.length} template{filtered.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Start blank instead
          </button>
        </div>
      </div>
    </div>
  )
}
