import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { adminCharityCreateSchema, parseBody } from '@/lib/validations'

// In-memory charity rotation store (persisted via env/config in production)
// In a real implementation this would be a DB table. For now we use a JSON env var
// ACTIVE_CHARITIES = '[{"slug":"...","name":"...","description":"...","url":"..."}]'
function getActiveCharities() {
  try {
    return JSON.parse(process.env.ACTIVE_CHARITIES ?? '[]') as {
      slug: string
      name: string
      description: string
      url: string
    }[]
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [allDonations, thisMonthDonations] = await Promise.all([
      db.charityDonation.groupBy({
        by: ['charitySlug', 'charityName'],
        where: { status: 'COMPLETED' },
        _sum: { amountCents: true },
        _count: { id: true },
      }),
      db.charityDonation.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { amountCents: true },
      }),
    ])

    // Monthly history (last 12 months)
    const monthlyHistory: { month: string; totalCents: number; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const result = await db.charityDonation.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: d, lt: end } },
        _sum: { amountCents: true },
        _count: { id: true },
      })
      monthlyHistory.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        totalCents: result._sum.amountCents ?? 0,
        count: result._count.id,
      })
    }

    return NextResponse.json({
      totalDonatedAllTimeCents: allDonations.reduce((s, d) => s + (d._sum.amountCents ?? 0), 0),
      totalDonatedThisMonthCents: thisMonthDonations._sum.amountCents ?? 0,
      byCharity: allDonations.map((d) => ({
        charitySlug: d.charitySlug,
        charityName: d.charityName,
        totalCents: d._sum.amountCents ?? 0,
        count: d._count.id,
      })),
      monthlyHistory,
      activeCharities: getActiveCharities(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const parsed = await parseBody(req, adminCharityCreateSchema)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const { slug, name, description, url } = parsed.data

    // NOTE: In production, persist to DB. For now returns 200 with instruction.
    // The ACTIVE_CHARITIES env var must be updated via deployment config.
    return NextResponse.json({
      ok: true,
      message: 'Charity added. Update ACTIVE_CHARITIES env var to persist across deployments.',
      charity: { slug, name, description, url },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
