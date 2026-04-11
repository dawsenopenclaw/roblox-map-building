import { NextResponse } from 'next/server'

/**
 * GET /api/community/weekly-spotlight
 *
 * Returns the top 5 trending projects for the current week, scored by a
 * blend of fork count, reaction count, and recency. Used by the homepage
 * "Weekly Spotlight" section.
 *
 * Response:
 *   200 {
 *     weekStart: string (ISO)
 *     weekEnd: string (ISO)
 *     projects: Array<SpotlightProject>
 *   }
 *
 * Caching: 10 minutes.
 */

export const revalidate = 600

interface SpotlightProject {
  id: string
  name: string
  slug: string | null
  thumbnailUrl: string | null
  author: { username: string; avatarUrl: string | null }
  forkCount: number
  reactionCount: number
  score: number
}

const DEMO_PROJECTS: SpotlightProject[] = [
  {
    id: 'proj_demo_1',
    name: 'Neon Cyber Obby',
    slug: 'neon-cyber-obby',
    thumbnailUrl: null,
    author: { username: 'pixeldev', avatarUrl: null },
    forkCount: 142,
    reactionCount: 389,
    score: 9.2,
  },
  {
    id: 'proj_demo_2',
    name: 'Bakery Tycoon XL',
    slug: 'bakery-tycoon-xl',
    thumbnailUrl: null,
    author: { username: 'dough_master', avatarUrl: null },
    forkCount: 98,
    reactionCount: 276,
    score: 7.8,
  },
  {
    id: 'proj_demo_3',
    name: 'Sanatorium Nights',
    slug: 'sanatorium-nights',
    thumbnailUrl: null,
    author: { username: 'gothkid', avatarUrl: null },
    forkCount: 73,
    reactionCount: 412,
    score: 7.5,
  },
  {
    id: 'proj_demo_4',
    name: 'Drift Mountain GP',
    slug: 'drift-mountain-gp',
    thumbnailUrl: null,
    author: { username: 'apexgrip', avatarUrl: null },
    forkCount: 61,
    reactionCount: 208,
    score: 6.4,
  },
  {
    id: 'proj_demo_5',
    name: 'Time Loop Chambers',
    slug: 'time-loop-chambers',
    thumbnailUrl: null,
    author: { username: 'knotworks', avatarUrl: null },
    forkCount: 54,
    reactionCount: 191,
    score: 5.9,
  },
]

function weekBoundsUtc(now: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dayOfWeek = d.getUTCDay() // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const start = new Date(d.getTime() - daysSinceMonday * 86_400_000)
  const end = new Date(start.getTime() + 7 * 86_400_000)
  return { start, end }
}

export async function GET() {
  const { start, end } = weekBoundsUtc()

  try {
    const { db } = await import('@/lib/db')

    // Query public projects created or updated within the current week.
    const projects = await db.project.findMany({
      where: {
        isPublic: true,
        updatedAt: { gte: start, lt: end },
      },
      orderBy: [{ forkCount: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailUrl: true,
        forkCount: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { username: true, avatarUrl: true } },
      },
    })

    if (projects.length === 0) {
      return NextResponse.json({
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        projects: DEMO_PROJECTS,
        demo: true,
      })
    }

    // Build reaction counts lazily — if the table isn't present, degrade.
    let reactionCounts: Map<string, number> = new Map()
    try {
      // @ts-expect-error — model may not exist
      if (db.projectReaction?.groupBy) {
        // @ts-expect-error — see above
        const grouped: Array<{ projectId: string; _count: { emoji: number } }> =
          // @ts-expect-error — see above
          await db.projectReaction.groupBy({
            by: ['projectId'],
            where: { projectId: { in: projects.map((p) => p.id) } },
            _count: { emoji: true },
          })
        reactionCounts = new Map(grouped.map((g) => [g.projectId, g._count.emoji]))
      }
    } catch {
      /* ignore */
    }

    // Score = forks * 1.0 + reactions * 0.3 + recency bonus
    const now = Date.now()
    const scored: SpotlightProject[] = projects
      .map((p) => {
        const reactionCount = reactionCounts.get(p.id) ?? 0
        const ageDays = Math.max(0, (now - new Date(p.updatedAt).getTime()) / 86_400_000)
        const recencyBonus = Math.max(0, 7 - ageDays) * 0.5
        const score = (p.forkCount ?? 0) * 1.0 + reactionCount * 0.3 + recencyBonus
        return {
          id: p.id,
          name: p.name,
          slug: p.slug ?? null,
          thumbnailUrl: p.thumbnailUrl ?? null,
          author: {
            username: p.user?.username ?? 'unknown',
            avatarUrl: p.user?.avatarUrl ?? null,
          },
          forkCount: p.forkCount ?? 0,
          reactionCount,
          score: Number(score.toFixed(2)),
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return NextResponse.json({
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      projects: scored,
    })
  } catch {
    return NextResponse.json({
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      projects: DEMO_PROJECTS,
      demo: true,
    })
  }
}
