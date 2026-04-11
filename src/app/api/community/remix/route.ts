import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { grantXp } from '@/lib/viral/xp-engine'

/**
 * POST /api/community/remix
 *
 * Clones a public showcase project into the calling user's account, increments
 * the original's fork count, and awards XP.
 *
 * Body: { projectId: string }
 *
 * Response:
 *   200 { forkedProjectId, fromProjectId, xp: { amount, totalXp, level, leveledUp } }
 *   400 if projectId is missing
 *   401 if not authenticated (demo mode falls through to 200)
 *   403 if the project is not public / remix-disabled
 *   404 if the project does not exist
 *
 * Demo mode: when there's no Clerk session OR the DB is unavailable, returns a
 * stub success payload so the UI can be previewed.
 */

interface RemixBody {
  projectId?: string
}

const DEMO_RESULT = {
  demo: true,
  forkedProjectId: 'proj_demo_fork',
  fromProjectId: 'proj_demo_source',
  forkCount: 42,
  xp: {
    amount: 10,
    totalXp: 260,
    level: 3,
    leveledUp: false,
  },
}

export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch {
    /* fall through to demo */
  }

  let body: RemixBody
  try {
    body = (await req.json()) as RemixBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  if (!clerkId) return NextResponse.json(DEMO_RESULT)

  try {
    const { db } = await import('@/lib/db')

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, xp: true },
    })
    if (!user) return NextResponse.json(DEMO_RESULT)

    const source = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        isPublic: true,
        allowRemix: true,
        promptHistory: true,
        thumbnailUrl: true,
        forkCount: true,
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    if (!source.isPublic) {
      return NextResponse.json({ error: 'Project is not public' }, { status: 403 })
    }
    if (source.allowRemix === false) {
      return NextResponse.json({ error: 'Remix is disabled for this project' }, { status: 403 })
    }
    if (source.userId === user.id) {
      return NextResponse.json({ error: 'You cannot remix your own project' }, { status: 400 })
    }

    const [forked] = await db.$transaction([
      db.project.create({
        data: {
          name: `${source.name} (remix)`,
          description: source.description,
          userId: user.id,
          isPublic: false,
          forkedFromId: source.id,
          thumbnailUrl: source.thumbnailUrl,
          promptHistory: (source.promptHistory as unknown) ?? [],
        },
        select: { id: true },
      }),
      db.project.update({
        where: { id: source.id },
        data: { forkCount: { increment: 1 } },
        select: { forkCount: true },
      }),
    ])

    // Award XP — we grant both XP_ACTIONS (fork given to the remixer, fork
    // received to the original author). The author grant is fire-and-forget
    // and tolerates failure.
    const remixerGrant = grantXp(user.xp ?? 0, 'FORK_GIVEN')
    await db.user.update({
      where: { id: user.id },
      data: { xp: remixerGrant.totalXpAfter, level: remixerGrant.levelAfter },
    })

    // Best-effort author award (non-blocking).
    void (async () => {
      try {
        const author = await db.user.findUnique({
          where: { id: source.userId },
          select: { id: true, xp: true },
        })
        if (author) {
          const g = grantXp(author.xp ?? 0, 'FORK_RECEIVED')
          await db.user.update({
            where: { id: author.id },
            data: { xp: g.totalXpAfter, level: g.levelAfter },
          })
        }
      } catch {
        /* swallow */
      }
    })()

    return NextResponse.json({
      forkedProjectId: forked.id,
      fromProjectId: source.id,
      forkCount: (source.forkCount ?? 0) + 1,
      xp: {
        amount: remixerGrant.award.amount,
        totalXp: remixerGrant.totalXpAfter,
        level: remixerGrant.levelAfter,
        leveledUp: remixerGrant.leveledUp,
      },
    })
  } catch {
    return NextResponse.json(DEMO_RESULT)
  }
}
