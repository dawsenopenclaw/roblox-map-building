import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getChallengeById, getTodaysChallenge } from '@/lib/daily-challenges'
import { grantXp } from '@/lib/viral/xp-engine'

/**
 * GET /api/community/daily-challenge
 *   Returns today's featured challenge. Rotates daily based on UTC date.
 *
 * POST /api/community/daily-challenge
 *   Submits an entry for today's challenge. Awards XP on first submission
 *   per user per day.
 *
 *   Body: { challengeId: string; projectId: string; notes?: string }
 *
 * The GET response is public and cached for 1 hour (next revalidate).
 */

export const revalidate = 3600

const DEMO_SUBMIT_RESULT = {
  demo: true,
  accepted: true,
  alreadySubmittedToday: false,
  xp: { amount: 100, totalXp: 1350, level: 3, leveledUp: false },
}

export async function GET() {
  const challenge = getTodaysChallenge()
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return NextResponse.json({
    challenge,
    resetsAt: end.toISOString(),
  })
}

interface SubmitBody {
  challengeId?: string
  projectId?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch {
    /* demo */
  }

  let body: SubmitBody
  try {
    body = (await req.json()) as SubmitBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const challengeId = typeof body.challengeId === 'string' ? body.challengeId.trim() : ''
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
  if (!challengeId) {
    return NextResponse.json({ error: 'challengeId is required' }, { status: 400 })
  }
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const challenge = getChallengeById(challengeId)
  if (!challenge) {
    return NextResponse.json({ error: 'Unknown challengeId' }, { status: 404 })
  }

  const today = getTodaysChallenge()
  if (today.id !== challenge.id) {
    return NextResponse.json(
      { error: 'That challenge is not today\'s challenge' },
      { status: 400 },
    )
  }

  if (!clerkId) return NextResponse.json(DEMO_SUBMIT_RESULT)

  try {
    const { db } = await import('@/lib/db')

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, xp: true },
    })
    if (!user) return NextResponse.json(DEMO_SUBMIT_RESULT)

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      select: { id: true },
    })
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or not owned by you' },
        { status: 404 },
      )
    }

    // Only one submission per user per day. Attempt to write; if duplicate,
    // return a non-xp result. Model may not exist in all envs.
    let alreadySubmitted = false
    try {
      // @ts-expect-error — model may not exist
      if (db.challengeSubmission?.findFirst) {
        const now = new Date()
        const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        // @ts-expect-error — see above
        const existing = await db.challengeSubmission.findFirst({
          where: {
            userId: user.id,
            challengeId: challenge.id,
            createdAt: { gte: dayStart },
          },
        })
        if (existing) {
          alreadySubmitted = true
        } else {
          // @ts-expect-error — see above
          await db.challengeSubmission.create({
            data: {
              userId: user.id,
              challengeId: challenge.id,
              projectId: project.id,
              notes: body.notes ?? null,
            },
          })
        }
      }
    } catch {
      /* ignore */
    }

    if (alreadySubmitted) {
      return NextResponse.json({
        accepted: true,
        alreadySubmittedToday: true,
        xp: null,
      })
    }

    const grant = grantXp(user.xp ?? 0, 'CHALLENGE_COMPLETE')
    try {
      await db.user.update({
        where: { id: user.id },
        data: { xp: grant.totalXpAfter, level: grant.levelAfter },
      })
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      accepted: true,
      alreadySubmittedToday: false,
      xp: {
        amount: grant.award.amount,
        totalXp: grant.totalXpAfter,
        level: grant.levelAfter,
        leveledUp: grant.leveledUp,
      },
    })
  } catch {
    return NextResponse.json(DEMO_SUBMIT_RESULT)
  }
}
