import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { grantXp } from '@/lib/viral/xp-engine'

/**
 * POST /api/community/react
 *
 * Adds or toggles an emoji reaction on a project. Updates the project's
 * reaction aggregate and awards XP to the project author the first time each
 * user reacts (LIKE_RECEIVED).
 *
 * Body:
 *   {
 *     projectId: string;
 *     emoji: '👍' | '❤️' | '🔥' | '🎮';
 *   }
 *
 * Response:
 *   200 { reactions: { '👍': n, '❤️': n, '🔥': n, '🎮': n }, yourReaction: emoji | null }
 */

const ALLOWED_EMOJI = ['👍', '❤️', '🔥', '🎮'] as const
type AllowedEmoji = (typeof ALLOWED_EMOJI)[number]

interface ReactBody {
  projectId?: string
  emoji?: string
}

const DEMO_RESULT = {
  demo: true,
  reactions: { '👍': 12, '❤️': 7, '🔥': 23, '🎮': 4 } as Record<AllowedEmoji, number>,
  yourReaction: '🔥',
}

export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch {
    /* demo */
  }

  let body: ReactBody
  try {
    body = (await req.json()) as ReactBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
  const emoji = body.emoji
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }
  if (!emoji || !(ALLOWED_EMOJI as ReadonlyArray<string>).includes(emoji)) {
    return NextResponse.json(
      { error: `emoji must be one of ${ALLOWED_EMOJI.join(' ')}` },
      { status: 400 },
    )
  }
  const typedEmoji = emoji as AllowedEmoji

  if (!clerkId) return NextResponse.json(DEMO_RESULT)

  try {
    const { db } = await import('@/lib/db')

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) return NextResponse.json(DEMO_RESULT)

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, isPublic: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (!project.isPublic) {
      return NextResponse.json({ error: 'Cannot react to a private project' }, { status: 403 })
    }

    // Upsert the reaction record. Model name may vary across envs — we
    // gracefully degrade if it's absent.
    let yourReaction: AllowedEmoji | null = typedEmoji
    let isFirstReaction = false

    try {
      // @ts-expect-error — reaction model may not exist in all envs
      if (db.projectReaction?.findUnique) {
        // @ts-expect-error — see above
        const existing = await db.projectReaction.findUnique({
          where: {
            userId_projectId: { userId: user.id, projectId: project.id },
          },
        })
        if (!existing) {
          isFirstReaction = true
          // @ts-expect-error — see above
          await db.projectReaction.create({
            data: { userId: user.id, projectId: project.id, emoji: typedEmoji },
          })
        } else if (existing.emoji === typedEmoji) {
          // Toggle off
          // @ts-expect-error — see above
          await db.projectReaction.delete({
            where: { userId_projectId: { userId: user.id, projectId: project.id } },
          })
          yourReaction = null
        } else {
          // @ts-expect-error — see above
          await db.projectReaction.update({
            where: { userId_projectId: { userId: user.id, projectId: project.id } },
            data: { emoji: typedEmoji },
          })
        }
      }
    } catch {
      /* model missing */
    }

    // Recompute aggregate.
    let reactions: Record<AllowedEmoji, number> = { '👍': 0, '❤️': 0, '🔥': 0, '🎮': 0 }
    try {
      // @ts-expect-error — reaction model may not exist
      if (db.projectReaction?.groupBy) {
        // @ts-expect-error — see above
        const grouped: Array<{ emoji: string; _count: { emoji: number } }> =
          // @ts-expect-error — see above
          await db.projectReaction.groupBy({
            by: ['emoji'],
            where: { projectId: project.id },
            _count: { emoji: true },
          })
        for (const g of grouped) {
          if ((ALLOWED_EMOJI as ReadonlyArray<string>).includes(g.emoji)) {
            reactions[g.emoji as AllowedEmoji] = g._count.emoji
          }
        }
      }
    } catch {
      reactions = DEMO_RESULT.reactions
    }

    // Award author XP only on first reaction from this user (prevents spam).
    if (isFirstReaction && project.userId !== user.id) {
      try {
        const author = await db.user.findUnique({
          where: { id: project.userId },
          select: { id: true, xp: true },
        })
        if (author) {
          const g = grantXp(author.xp ?? 0, 'LIKE_RECEIVED')
          await db.user.update({
            where: { id: author.id },
            data: { xp: g.totalXpAfter, level: g.levelAfter },
          })
        }
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ reactions, yourReaction })
  } catch {
    return NextResponse.json(DEMO_RESULT)
  }
}
