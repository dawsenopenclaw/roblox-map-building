'use client'

/**
 * TemplateGalleryV2 — marketplace-style gallery of 8 pre-authored game templates.
 *
 * Pure presentation: fetches the catalog from /api/templates/list, shows
 * filters by genre, and exposes a one-click "Use this template" button. The
 * actual install is handled by the parent via the `onUse` callback (so this
 * component stays router-free and reusable).
 */

import { useEffect, useMemo, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateCatalogEntry {
  id: string
  name: string
  description: string
  genre: string
  estimatedBuildTime: string
  thumbnailPrompt: string
  partCount: number
  scriptCount: number
  uiTemplates: string[]
  mechanics: string[]
  priceCredits: number
}

interface TemplateGalleryV2Props {
  /** Called when the user clicks "Use this template". */
  onUse?: (template: TemplateCatalogEntry) => void | Promise<void>
  /** Optional override for the API endpoint (defaults to /api/templates/list). */
  endpoint?: string
  /** Fixed default filter — useful for embedding in a dashboard section. */
  defaultGenre?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GENRE_LABELS: Record<string, string> = {
  tycoon: 'Tycoon',
  obby: 'Obby',
  simulator: 'Simulator',
  'tower-defense': 'Tower Defense',
  'combat-arena': 'Combat Arena',
  racing: 'Racing',
  survival: 'Survival',
  roleplay: 'Roleplay',
}

const GENRE_EMOJI: Record<string, string> = {
  tycoon: '🏭',
  obby: '🏃',
  simulator: '👆',
  'tower-defense': '🗼',
  'combat-arena': '⚔️',
  racing: '🏁',
  survival: '🏕️',
  roleplay: '🏘️',
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function TemplateCard({
  entry,
  onUse,
  busy,
}: {
  entry: TemplateCatalogEntry
  onUse?: (template: TemplateCatalogEntry) => void | Promise<void>
  busy: boolean
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950 shadow-lg transition-all hover:border-amber-500/40 hover:shadow-amber-500/10">
      {/* Thumbnail placeholder — genre emoji on a gradient */}
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-amber-900/20">
        <span className="text-6xl drop-shadow-lg" aria-hidden="true">
          {GENRE_EMOJI[entry.genre] ?? '🎮'}
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200 backdrop-blur-sm">
          {GENRE_LABELS[entry.genre] ?? entry.genre}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-500/40">
          {entry.priceCredits} credits
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <header>
          <h3 className="text-base font-bold text-zinc-100">{entry.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-zinc-400">
            {entry.description}
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md bg-zinc-800/50 px-2 py-1.5">
            <dt className="text-zinc-500">Parts</dt>
            <dd className="font-semibold text-zinc-200">{entry.partCount}</dd>
          </div>
          <div className="rounded-md bg-zinc-800/50 px-2 py-1.5">
            <dt className="text-zinc-500">Scripts</dt>
            <dd className="font-semibold text-zinc-200">{entry.scriptCount}</dd>
          </div>
          <div className="col-span-2 rounded-md bg-zinc-800/50 px-2 py-1.5">
            <dt className="text-zinc-500">Build time</dt>
            <dd className="font-semibold text-zinc-200">{entry.estimatedBuildTime}</dd>
          </div>
        </dl>

        {entry.mechanics.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {entry.mechanics.slice(0, 4).map((m) => (
              <li
                key={m}
                className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30"
              >
                {m}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onUse?.(entry)}
            className={cn(
              'w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-md transition-all',
              'hover:bg-amber-400 hover:shadow-amber-500/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
              busy && 'cursor-wait opacity-60',
            )}
          >
            {busy ? 'Installing…' : 'Use this template'}
          </button>
        </div>
      </div>
    </article>
  )
}

function GenreFilter({
  value,
  onChange,
  genres,
}: {
  value: string
  onChange: (v: string) => void
  genres: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
          value === 'all'
            ? 'bg-amber-500 text-zinc-950'
            : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700',
        )}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
            value === g
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700',
          )}
        >
          {GENRE_EMOJI[g]} {GENRE_LABELS[g] ?? g}
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TemplateGalleryV2({
  onUse,
  endpoint = '/api/templates/list',
  defaultGenre = 'all',
}: TemplateGalleryV2Props) {
  const [entries, setEntries] = useState<TemplateCatalogEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [genre, setGenre] = useState<string>(defaultGenre)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as {
          ok: boolean
          templates?: TemplateCatalogEntry[]
        }
        if (cancelled) return
        if (!json.ok || !json.templates) {
          setError('Failed to load template catalog.')
          return
        }
        setEntries(json.templates)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [endpoint])

  const genres = useMemo(() => {
    if (!entries) return []
    return Array.from(new Set(entries.map((e) => e.genre)))
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    return genre === 'all' ? entries : entries.filter((e) => e.genre === genre)
  }, [entries, genre])

  async function handleUse(entry: TemplateCatalogEntry) {
    if (!onUse || busyId) return
    setBusyId(entry.id)
    try {
      await onUse(entry)
    } finally {
      setBusyId(null)
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-300">
        Could not load templates: {error}
      </div>
    )
  }

  if (!entries) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/50"
          />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Game Templates</h2>
          <p className="text-sm text-zinc-400">
            Production-ready starter games. One click drops a complete, playable
            experience into your place.
          </p>
        </div>
        <span className="text-xs text-zinc-500">
          {filtered.length} of {entries.length} shown
        </span>
      </header>

      <GenreFilter value={genre} onChange={setGenre} genres={genres} />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
          No templates match this filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((entry) => (
            <TemplateCard
              key={entry.id}
              entry={entry}
              onUse={handleUse}
              busy={busyId === entry.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}
