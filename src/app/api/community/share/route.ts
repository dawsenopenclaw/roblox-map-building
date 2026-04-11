import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { grantXp } from '@/lib/viral/xp-engine'
import { buildReferralUrl, generateUserKey, type ReferralChannel } from '@/lib/viral/referral-link'
import { createShareRecord } from '@/lib/viral/viral-loop'

/**
 * POST /api/community/share
 *
 * Creates a shareable link with an OG image preview for any project.
 * Tracks click-throughs via the returned shareId.
 *
 * Body:
 *   {
 *     projectId: string;
 *     channel?: ReferralChannel;
 *     campaign?: string;
 *   }
 *
 * Response:
 *   200 {
 *     shareId: string;
 *     shareUrl: string;
 *     ogImageUrl: string;
 *     expiresAt: string;
 *   }
 */

interface ShareBody {
  projectId?: string
  channel?: ReferralChannel
  campaign?: string
}

const DEMO_RESULT = {
  demo: true,
  shareId: 'shr_demo_abc',
  shareUrl: 'https://forjegames.com/p/demo?ref=demo.twitter',
  ogImageUrl: 'https://forjegames.com/api/og?project=demo',
  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
}

function baseUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env) return env.replace(/\/$/, '')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('host') ?? 'forjegames.com'
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch {
    /* demo */
  }

  let body: ShareBody
  try {
    body = (await req.json()) as ShareBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }
  const channel: ReferralChannel = body.channel ?? 'direct'
  const campaign = body.campaign

  if (!clerkId) return NextResponse.json(DEMO_RESULT)

  try {
    const { db } = await import('@/lib/db')
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, xp: true },
    })
    if (!user) return NextResponse.json(DEMO_RESULT)

    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, isPublic: true, slug: true, name: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const shareId = `shr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const userKey = generateUserKey(user.id)
    const base = baseUrl(req)
    const shareUrl = buildReferralUrl(
      `${base}/p/${project.slug ?? project.id}`,
      { userKey, channel, campaign },
      { sid: shareId },
    )
    const ogImageUrl = `${base}/api/og?project=${encodeURIComponent(project.id)}`
    const expiresAt = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()

    const record = createShareRecord({
      shareId,
      inviterUserId: user.id,
      resourceId: project.id,
      resourceKind: 'project',
      channel,
    })

    // Persist via a generic shareEvent table if present.
    try {
      // @ts-expect-error — shareEvent model may not exist in all envs; tolerate absence.
      if (db.shareEvent?.create) {
        // @ts-expect-error — see above
        await db.shareEvent.create({
          data: {
            id: shareId,
            userId: user.id,
            projectId: project.id,
            channel,
            campaign: campaign ?? null,
            clicks: 0,
            signups: 0,
            createdAt: new Date(record.createdAt),
            expiresAt: new Date(expiresAt),
          },
        })
      }
    } catch {
      /* table missing — that's OK, we still return the URL */
    }

    // Award XP for sharing.
    const grant = grantXp(user.xp ?? 0, 'SHARE_CREATED')
    try {
      await db.user.update({
        where: { id: user.id },
        data: { xp: grant.totalXpAfter, level: grant.levelAfter },
      })
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      shareId,
      shareUrl,
      ogImageUrl,
      expiresAt,
      xp: {
        amount: grant.award.amount,
        totalXp: grant.totalXpAfter,
        level: grant.levelAfter,
        leveledUp: grant.leveledUp,
      },
    })
  } catch {
    return NextResponse.json(DEMO_RESULT)
  }
}
