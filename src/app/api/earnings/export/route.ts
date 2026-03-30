import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/earnings/export
 *
 * Returns a CSV of all CreatorEarning rows for the authenticated user.
 * Triggers a browser download via Content-Disposition header.
 */
export async function GET() {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { db } = await import('@/lib/db')

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const earnings = await db.creatorEarning.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      // 10 000-row cap: a single CSV export beyond this is impractical
      // and would OOM a serverless function. Callers needing more should
      // use date-range pagination via query params (future work).
      take: 10_000,
      select: {
        id: true,
        templateName: true,
        amountCents: true,
        netCents: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    })

    // Build CSV rows
    const header = ['ID', 'Template', 'Sale Amount (USD)', 'Your Payout (USD)', 'Status', 'Paid At', 'Created At']

    const rows = earnings.map((e) => [
      e.id,
      csvEscape(e.templateName ?? ''),
      (e.amountCents / 100).toFixed(2),
      (e.netCents / 100).toFixed(2),
      e.status,
      e.paidAt ? e.paidAt.toISOString() : '',
      e.createdAt.toISOString(),
    ])

    const csv = [header, ...rows]
      .map((row) => row.join(','))
      .join('\r\n')

    const filename = `forjegames-earnings-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Wrap a CSV cell value in quotes if it contains commas, quotes, or newlines. */
function csvEscape(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
