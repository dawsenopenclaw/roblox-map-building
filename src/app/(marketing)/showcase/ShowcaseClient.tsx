'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Sparkles } from 'lucide-react'
import ShowcaseCard from '@/components/marketing/ShowcaseCard'
import {
  SHOWCASE_GAMES,
  SHOWCASE_GENRES,
  type ShowcaseGenre,
} from '@/lib/showcase-data'

type GenreFilter = 'All' | ShowcaseGenre

const GENRE_TABS: GenreFilter[] = ['All', ...SHOWCASE_GENRES]

/**
 * Client-side showcase gallery with genre filter tabs. Renders a grid of
 * ShowcaseCard items — each deep-links to the editor with the original prompt
 * pre-filled via a `?prompt=` query string.
 */
export default function ShowcaseClient() {
  const [active, setActive] = useState<GenreFilter>('All')

  // Pre-compute counts per genre so tab labels can show "(N)".
  const counts = useMemo(() => {
    const base: Record<string, number> = { All: SHOWCASE_GAMES.length }
    for (const g of SHOWCASE_GENRES) base[g] = 0
    for (const game of SHOWCASE_GAMES) base[game.genre] = (base[game.genre] ?? 0) + 1
    return base
  }, [])

  const filtered = useMemo(
    () => (active === 'All' ? SHOWCASE_GAMES : SHOWCASE_GAMES.filter((g) => g.genre === active)),
    [active]
  )

  return (
    <section id="gallery" className="py-16 px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        {/* Filter tabs */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Browse by genre
            </h2>
            <p className="text-xs text-white/40 hidden sm:block">
              {filtered.length} {filtered.length === 1 ? 'game' : 'games'}
            </p>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter showcase games by genre"
          >
            {GENRE_TABS.map((tab) => {
              const isActive = active === tab
              const count = counts[tab] ?? 0
              const disabled = tab !== 'All' && count === 0
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="showcase-grid"
                  disabled={disabled}
                  onClick={() => setActive(tab)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(212,175,55,0.20) 0%, rgba(212,175,55,0.08) 100%)',
                          border: '1px solid rgba(212,175,55,0.45)',
                          color: '#D4AF37',
                          boxShadow: '0 0 20px rgba(212,175,55,0.15)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.65)',
                        }
                  }
                >
                  {tab}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isActive ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.55)',
                      minWidth: 20,
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div
            id="showcase-grid"
            role="tabpanel"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((game) => (
              <div key={game.id} id={game.id}>
                <ShowcaseCard game={game} variant="detailed" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-white/70 font-semibold">No games in this genre yet.</p>
            <p className="text-sm text-white/40 mt-1">
              Check back soon — new builds are added every week.
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div
          className="mt-14 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-8"
          style={{
            background:
              'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(5,8,16,0) 70%)',
            border: '1px solid rgba(212,175,55,0.18)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(212,175,55,0.14)',
              border: '1px solid rgba(212,175,55,0.30)',
              boxShadow: '0 0 20px rgba(212,175,55,0.15)',
            }}
          >
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-bold">Ready to build yours?</p>
            <p className="text-gray-400 text-sm mt-0.5">
              Start from a blank prompt or remix any of the games above — it takes
              about two minutes to your first playable build.
            </p>
          </div>
          <Link
            href="/editor"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#050810] transition-all hover:scale-[1.03] active:scale-100 whitespace-nowrap"
            style={{
              background:
                'linear-gradient(135deg, #D4AF37 0%, #F5D878 50%, #B8962E 100%)',
              boxShadow: '0 8px 24px rgba(212,175,55,0.25)',
            }}
          >
            Open the editor
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Waitlist (kept from the previous placeholder — creators can still subscribe) */}
        <div
          className="mt-6 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(212,175,55,0.10)',
              border: '1px solid rgba(212,175,55,0.20)',
            }}
          >
            <Bell className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white text-sm font-semibold">
              Want your build featured here?
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              We highlight the best community creations weekly — drop us a note.
            </p>
          </div>
          <a
            href="mailto:hello@forjegames.com?subject=Showcase%20Submission"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs whitespace-nowrap transition-colors"
            style={{
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.25)',
              background: 'rgba(212,175,55,0.06)',
            }}
          >
            Submit a build
          </a>
        </div>
      </div>
    </section>
  )
}
