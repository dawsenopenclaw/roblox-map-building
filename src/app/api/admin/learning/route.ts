import { NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { db } from '@/lib/db'
import { getAILevel } from '@/lib/ai/ai-xp'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // ── 1. AI Level from Redis ──────────────────────────────────────────
    const aiLevel = await getAILevel()

    // ── 2. Quality trends (last 7 days, grouped by day) ─────────────────
    const qualityTrends = await db.$queryRaw<Array<{
      day: string
      avgScore: number
      count: number
    }>>(Prisma.sql`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') as day,
        ROUND(AVG(score))::int as "avgScore",
        COUNT(*)::int as count
      FROM "BuildFeedback"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
        AND "buildType" != 'rule'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY day ASC
    `) as Array<{ day: string; avgScore: number; count: number }>

    // ── 3. Score by category ────────────────────────────────────────────
    const categoryScores = await db.$queryRaw<Array<{
      category: string
      avgScore: number
      count: number
    }>>(Prisma.sql`
      SELECT
        COALESCE(category, 'unknown') as category,
        ROUND(AVG(score))::int as "avgScore",
        COUNT(*)::int as count
      FROM "BuildFeedback"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
        AND "buildType" != 'rule'
      GROUP BY COALESCE(category, 'unknown')
      ORDER BY count DESC
      LIMIT 15
    `) as Array<{ category: string; avgScore: number; count: number }>

    // ── 4. Score by model ───────────────────────────────────────────────
    const modelScores = await db.$queryRaw<Array<{
      model: string
      avgScore: number
      count: number
      bestCategory: string
    }>>(Prisma.sql`
      SELECT
        model,
        ROUND(AVG(score))::int as "avgScore",
        COUNT(*)::int as count,
        (
          SELECT COALESCE(bf2.category, 'unknown')
          FROM "BuildFeedback" bf2
          WHERE bf2.model = "BuildFeedback".model
            AND bf2."buildType" != 'rule'
            AND bf2."createdAt" > NOW() - INTERVAL '7 days'
          GROUP BY COALESCE(bf2.category, 'unknown')
          ORDER BY AVG(bf2.score) DESC
          LIMIT 1
        ) as "bestCategory"
      FROM "BuildFeedback"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
        AND "buildType" != 'rule'
        AND model != 'self-improve'
      GROUP BY model
      ORDER BY "avgScore" DESC
    `) as Array<{ model: string; avgScore: number; count: number; bestCategory: string }>

    // ── 5. Active learned rules ─────────────────────────────────────────
    const learnedRules = await db.buildFeedback.findMany({
      where: { buildType: 'rule', model: 'self-improve' },
      orderBy: { score: 'desc' },
      take: 50,
      select: {
        prompt: true,
        score: true,
        category: true,
        createdAt: true,
      },
    })

    const rules = learnedRules.map(r => ({
      rule: r.prompt || '',
      confidence: r.score,
      category: r.category || 'global',
      createdAt: r.createdAt.toISOString(),
    }))

    // ── 6. Recent builds (last 20) ──────────────────────────────────────
    const recentBuilds = await db.buildFeedback.findMany({
      where: { buildType: { not: 'rule' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        prompt: true,
        score: true,
        model: true,
        category: true,
        userVote: true,
        partCount: true,
        buildType: true,
        createdAt: true,
      },
    })

    const recent = recentBuilds.map(b => ({
      prompt: (b.prompt || '').slice(0, 120),
      score: b.score,
      model: b.model,
      category: b.category || 'unknown',
      userVote: b.userVote,
      partCount: b.partCount,
      buildType: b.buildType,
      createdAt: b.createdAt.toISOString(),
    }))

    return NextResponse.json({
      aiLevel,
      qualityTrends,
      categoryScores,
      modelScores,
      rules,
      recentBuilds: recent,
    })
  } catch (err) {
    console.error('[Learning API]', err)
    return NextResponse.json(
      { error: 'Failed to load learning data' },
      { status: 500 },
    )
  }
}
