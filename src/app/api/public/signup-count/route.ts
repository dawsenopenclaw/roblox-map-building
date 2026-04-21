import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Cache for 5 minutes — no auth needed, public endpoint
export const revalidate = 300

export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    const count = await db.user.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    })
    return NextResponse.json(
      { count },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
