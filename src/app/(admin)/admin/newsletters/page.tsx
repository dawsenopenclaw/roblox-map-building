/**
 * BUG 4: Newsletter admin page.
 *
 * Lists recent newsletters (drafts / scheduled / sent), shows the current
 * opted-in subscriber count, and provides a shortcut to compose a new one.
 *
 * The Newsletter Prisma model is new (see prisma/schema.prisma) — the page
 * gracefully handles the case where `npx prisma generate` / migrate has not
 * yet been run by catching the error and falling back to an empty list.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { db as prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Newsletters — Admin',
  robots: { index: false, follow: false },
}

// Re-render every 60s so subscriber count / recent sends stay reasonably fresh
export const revalidate = 60

interface NewsletterRow {
  id: string
  subject: string
  status: string
  scheduledAt: Date | null
  sentAt: Date | null
  recipientCount: number | null
  createdAt: Date
}

async function loadData(): Promise<{
  newsletters: NewsletterRow[]
  subscriberCount: number
  schemaReady: boolean
}> {
  try {
    // Narrow the prisma client to any to avoid a hard compile error when the
    // generated client is stale (schema added but `prisma generate` not yet
    // run). The page still renders either way.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = prisma as unknown as any
    const newsletters: NewsletterRow[] = client?.newsletter
      ? await client.newsletter.findMany({
          orderBy: { createdAt: 'desc' },
          take: 25,
          select: {
            id: true,
            subject: true,
            status: true,
            scheduledAt: true,
            sentAt: true,
            recipientCount: true,
            createdAt: true,
          },
        })
      : []

    // Count users who have newsletter notifications enabled. We reuse the
    // existing notification preference column to avoid requiring yet another
    // migration for a dedicated subscriber table.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriberCount: number = await (prisma as any).user
      .count({
        where: {
          OR: [
            { notificationPreferences: { path: ['newsletter'], equals: true } },
            { emailNewsletter: true },
          ],
        },
      })
      .catch(() => 0)

    return { newsletters, subscriberCount, schemaReady: true }
  } catch (err) {
    console.warn('[admin/newsletters] load failed — schema may be stale:', err instanceof Error ? err.message : err)
    return { newsletters: [], subscriberCount: 0, schemaReady: false }
  }
}

function fmtDate(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === 'sent'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : status === 'scheduled'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {status}
    </span>
  )
}

export default async function AdminNewslettersPage() {
  const { newsletters, subscriberCount, schemaReady } = await loadData()

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Newsletters</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Compose, schedule, and review weekly digest emails sent to subscribed users.
          </p>
        </div>
        <Link
          href="/admin/newsletters/compose"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-amber-400"
        >
          Compose newsletter
        </Link>
      </header>

      {!schemaReady && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          The <code className="rounded bg-black/30 px-1">Newsletter</code> Prisma model was added
          but the client hasn&apos;t been regenerated yet. Run{' '}
          <code className="rounded bg-black/30 px-1">npx prisma generate</code> and{' '}
          <code className="rounded bg-black/30 px-1">npx prisma migrate dev</code> to enable this
          page.
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-[11px] uppercase tracking-widest text-neutral-500">Subscribers</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-100">
            {subscriberCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-[11px] uppercase tracking-widest text-neutral-500">Total sent</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-100">
            {newsletters.filter((n) => n.status === 'sent').length}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-[11px] uppercase tracking-widest text-neutral-500">Scheduled</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-100">
            {newsletters.filter((n) => n.status === 'scheduled').length}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40">
        <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-200">Recent newsletters</h2>
        </header>
        {newsletters.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-neutral-500">
            No newsletters yet. Click{' '}
            <span className="text-amber-300">Compose newsletter</span> to draft the first one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Recipients</th>
                <th className="px-4 py-2 text-left">Sent / scheduled</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {newsletters.map((n) => (
                <tr key={n.id} className="border-t border-neutral-800/60">
                  <td className="px-4 py-3 text-neutral-200">{n.subject}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={n.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {n.recipientCount?.toLocaleString() ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {fmtDate(n.sentAt ?? n.scheduledAt)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{fmtDate(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
