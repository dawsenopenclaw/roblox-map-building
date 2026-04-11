'use client'

/**
 * BetaCodeGenerator — admin-only widget for minting batches of beta invite codes.
 *
 * Flow:
 *  1. Admin picks count, cohort, bonus credits, expiration, max uses
 *  2. POST /api/admin/beta returns the freshly generated codes
 *  3. Admin can export the codes (CSV) or copy them
 *  4. Separate section lists existing codes with redemption status + revoke
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BetaInviteRow {
  id: string
  code: string
  cohort: string | null
  bonusCredits: number
  maxUses: number
  useCount: number
  expiresAt: string | null
  createdAt: string
  usedAt: string | null
  usedBy: { id: string; email: string; username: string | null } | null
}

interface GeneratedCode {
  code: string
  cohort: string | null
  bonusCredits: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function codesToCsv(codes: GeneratedCode[]): string {
  const header = 'code,cohort,bonusCredits'
  const rows = codes.map(
    (c) => `${c.code},${c.cohort ?? ''},${c.bonusCredits}`,
  )
  return [header, ...rows].join('\n')
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BetaCodeGenerator() {
  // form state
  const [count, setCount] = useState(10)
  const [cohort, setCohort] = useState('')
  const [bonusCredits, setBonusCredits] = useState(500)
  const [maxUses, setMaxUses] = useState(1)
  const [expiresAt, setExpiresAt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [lastBatch, setLastBatch] = useState<GeneratedCode[]>([])

  // list state
  const [invites, setInvites] = useState<BetaInviteRow[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch('/api/admin/beta', { method: 'GET' })
      const data = (await res.json()) as { invites?: BetaInviteRow[]; error?: string }
      if (!res.ok) {
        setListError(data.error ?? 'Failed to load invites')
        return
      }
      setInvites(data.invites ?? [])
    } catch {
      setListError('Network error loading invites')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchInvites()
  }, [fetchInvites])

  const onGenerate = useCallback(async () => {
    setGenerating(true)
    setGenError(null)
    try {
      const body: Record<string, unknown> = { count }
      if (cohort.trim()) body.cohort = cohort.trim()
      if (bonusCredits > 0) body.bonusCredits = bonusCredits
      if (maxUses !== 1) body.maxUses = maxUses
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString()

      const res = await fetch('/api/admin/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as {
        codes?: GeneratedCode[]
        error?: string
        generated?: number
      }
      if (!res.ok) {
        setGenError(data.error ?? 'Failed to generate codes')
        return
      }
      setLastBatch(data.codes ?? [])
      void fetchInvites()
    } catch {
      setGenError('Network error')
    } finally {
      setGenerating(false)
    }
  }, [count, cohort, bonusCredits, maxUses, expiresAt, fetchInvites])

  const onRevoke = useCallback(
    async (code: string) => {
      if (!confirm(`Revoke invite code "${code}"? This cannot be undone.`)) return
      try {
        const res = await fetch('/api/admin/beta', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        if (res.ok) {
          setInvites((prev) => prev.filter((r) => r.code !== code))
        }
      } catch {
        // no-op
      }
    },
    [],
  )

  const onExportBatch = useCallback(() => {
    if (lastBatch.length === 0) return
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`beta-codes-${stamp}.csv`, codesToCsv(lastBatch))
  }, [lastBatch])

  const onExportAll = useCallback(() => {
    if (invites.length === 0) return
    const header = 'code,cohort,bonusCredits,maxUses,useCount,expiresAt,usedBy,createdAt'
    const rows = invites.map((i) =>
      [
        i.code,
        i.cohort ?? '',
        i.bonusCredits,
        i.maxUses,
        i.useCount,
        i.expiresAt ?? '',
        i.usedBy?.email ?? '',
        i.createdAt,
      ].join(','),
    )
    const csv = [header, ...rows].join('\n')
    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`beta-invites-all-${stamp}.csv`, csv)
  }, [invites])

  const onCopyBatch = useCallback(async () => {
    if (lastBatch.length === 0) return
    try {
      await navigator.clipboard.writeText(lastBatch.map((c) => c.code).join('\n'))
    } catch {
      // clipboard denied
    }
  }, [lastBatch])

  const stats = useMemo(() => {
    const total = invites.length
    const redeemed = invites.filter((i) => i.useCount >= i.maxUses).length
    const active = invites.filter((i) => i.useCount < i.maxUses).length
    return { total, redeemed, active }
  }, [invites])

  return (
    <div className="space-y-6 text-neutral-100">
      {/* ── Generator form ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="mb-1 text-lg font-semibold">Generate invite codes</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Mint a batch of invite codes for a cohort. Codes can be exported as CSV.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Count">
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              className={inputCls}
            />
          </Field>
          <Field label="Cohort (optional)">
            <input
              type="text"
              placeholder="e.g. youtuber"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Bonus credits">
            <input
              type="number"
              min={0}
              value={bonusCredits}
              onChange={(e) => setBonusCredits(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
          <Field label="Max uses">
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value) || 1)}
              className={inputCls}
            />
          </Field>
          <Field label="Expires at (optional)">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || count < 1}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? 'Generating…' : `Generate ${count} code${count === 1 ? '' : 's'}`}
          </button>
          {lastBatch.length > 0 && (
            <>
              <button
                type="button"
                onClick={onExportBatch}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={onCopyBatch}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
              >
                Copy codes
              </button>
            </>
          )}
          {genError && <span className="text-sm text-red-400">{genError}</span>}
        </div>

        {lastBatch.length > 0 && (
          <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 font-mono text-xs text-amber-200">
            {lastBatch.map((c) => (
              <div key={c.code}>{c.code}</div>
            ))}
          </div>
        )}
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-4">
        <StatBox label="Total codes" value={stats.total} />
        <StatBox label="Active" value={stats.active} accent />
        <StatBox label="Redeemed" value={stats.redeemed} />
      </section>

      {/* ── Existing invites list ─────────────────────────────────────── */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Existing invites</h2>
            <p className="text-sm text-neutral-400">
              {listLoading ? 'Loading…' : `${invites.length} code${invites.length === 1 ? '' : 's'} on file`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchInvites()}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onExportAll}
              disabled={invites.length === 0}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
            >
              Export all CSV
            </button>
          </div>
        </div>

        {listError && (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {listError}
          </div>
        )}

        <div className="overflow-auto">
          <table className="w-full min-w-[800px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="border-b border-neutral-800 py-2 pr-3">Code</th>
                <th className="border-b border-neutral-800 py-2 pr-3">Cohort</th>
                <th className="border-b border-neutral-800 py-2 pr-3">Bonus</th>
                <th className="border-b border-neutral-800 py-2 pr-3">Uses</th>
                <th className="border-b border-neutral-800 py-2 pr-3">Expires</th>
                <th className="border-b border-neutral-800 py-2 pr-3">Redeemed by</th>
                <th className="border-b border-neutral-800 py-2 pr-3">Created</th>
                <th className="border-b border-neutral-800 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const exhausted = inv.useCount >= inv.maxUses
                const expired = inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()
                return (
                  <tr key={inv.id} className="text-neutral-200">
                    <td className="border-b border-neutral-800/60 py-2 pr-3 font-mono text-amber-300">
                      {inv.code}
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 pr-3 text-neutral-400">
                      {inv.cohort ?? '—'}
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 pr-3">
                      {inv.bonusCredits}
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 pr-3">
                      <span className={exhausted ? 'text-neutral-500' : 'text-emerald-400'}>
                        {inv.useCount}/{inv.maxUses}
                      </span>
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 pr-3 text-neutral-400">
                      {expired ? (
                        <span className="text-red-400">Expired</span>
                      ) : (
                        formatDate(inv.expiresAt)
                      )}
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 pr-3 text-neutral-400">
                      {inv.usedBy?.email ?? '—'}
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 pr-3 text-neutral-500">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="border-b border-neutral-800/60 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void onRevoke(inv.code)}
                        className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                )
              })}
              {!listLoading && invites.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-sm text-neutral-500">
                    No invite codes yet. Generate a batch above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ─── Small helpers ──────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </span>
      {children}
    </label>
  )
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'border-neutral-800 bg-neutral-900/60'
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ? 'text-amber-300' : 'text-neutral-100'}`}>
        {value}
      </div>
    </div>
  )
}

export default BetaCodeGenerator
