import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { notifyAchievementUnlockedClient } from '@/lib/notifications-client'
import { XPEventType } from '@prisma/client'
import { grantXp } from '@/lib/xp-server'

// GET /api/gamification/achievements — all achievements with user unlock status
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        userAchievements: {
          select: {
            unlockedAt: true,
            achievement: { select: { slug: true } },
          },
        },
      },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const unlockedSlugs = new Set(user.userAchievements.map((ua) => ua.achievement.slug))
    const unlockedAt = new Map(
      user.userAchievements.map((ua) => [ua.achievement.slug, ua.unlockedAt])
    )

    const achievements = ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: unlockedSlugs.has(a.slug),
      unlockedAt: unlockedAt.get(a.slug) ?? null,
    }))

    return NextResponse.json({ achievements, unlockedCount: unlockedSlugs.size, total: ACHIEVEMENTS.length })
  } catch (err) {
    console.error('[achievements GET] DB error — returning all locked fallback:', err)
    // Return all achievements as locked so the page always renders
    const achievements = ACHIEVEMENTS.map((a) => ({
      ...a,
      condition: undefined,
      unlocked: false,
      unlockedAt: null,
    }))
    return NextResponse.json({
      achievements,
      unlockedCount: 0,
      total: ACHIEVEMENTS.length,
      _fallback: true,
    })
  }
}

/**
 * Verify that the user actually meets the condition for a given achievement.
 * Returns true if the condition is satisfied, false otherwise.
 * Conditions that require complex external state (e.g. WEEKEND_BUILDS, ALL_CATEGORIES)
 * are server-verified here; unknown condition types are rejected.
 */
async function verifyCondition(
  userId: string,
  condition: Record<string, unknown>
): Promise<boolean> {
  const type = condition.type as string
  const threshold = condition.threshold as number | undefined

  switch (type) {
    case 'BUILD_COUNT': {
      const count = await db.gameBuild.count({ where: { userId } })
      return count >= (threshold ?? 1)
    }
    case 'PUBLISH_COUNT': {
      const count = await db.template.count({ where: { creatorId: userId, status: 'PUBLISHED' } })
      return count >= (threshold ?? 1)
    }
    case 'SALE_COUNT': {
      const count = await db.templatePurchase.count({ where: { template: { creatorId: userId } } })
      return count >= (threshold ?? 1)
    }
    case 'PURCHASE_COUNT': {
      const count = await db.templatePurchase.count({ where: { buyerId: userId } })
      return count >= (threshold ?? 1)
    }
    case 'REVIEW_COUNT': {
      const count = await db.templateReview.count({ where: { reviewerId: userId } })
      return count >= (threshold ?? 1)
    }
    case 'REFERRAL_COUNT': {
      const count = await db.referral.count({ where: { referrerId: userId } })
      return count >= (threshold ?? 1)
    }
    case 'LOGIN_STREAK': {
      const streak = await db.streak.findUnique({ where: { userId }, select: { loginStreak: true } })
      return (streak?.loginStreak ?? 0) >= (threshold ?? 1)
    }
    case 'XP_THRESHOLD': {
      const xp = await db.userXP.findUnique({ where: { userId }, select: { totalXp: true } })
      return (xp?.totalXp ?? 0) >= (threshold ?? 0)
    }
    case 'TOTAL_EARNED_CENTS': {
      const account = await db.creatorAccount.findUnique({ where: { userId }, select: { totalEarnedCents: true } })
      return (account?.totalEarnedCents ?? 0) >= (threshold ?? 0)
    }
    case 'STRIPE_CONNECTED': {
      const account = await db.creatorAccount.findUnique({ where: { userId }, select: { chargesEnabled: true } })
      return account?.chargesEnabled === true
    }
    case 'PROFILE_COMPLETE': {
      const u = await db.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true, avatarUrl: true } })
      return !!(u?.username && u?.displayName && u?.avatarUrl)
    }
    case 'RECEIVE_FIVE_STAR': {
      const review = await db.templateReview.findFirst({
        where: { template: { creatorId: userId }, rating: 5 },
        select: { id: true },
      })
      return review !== null
    }
    case 'PERFECT_RATING': {
      const minReviews = (condition.minReviews as number) ?? 10
      const template = await db.template.findFirst({
        where: { creatorId: userId, reviewCount: { gte: minReviews }, averageRating: 5 },
        select: { id: true },
      })
      return template !== null
    }
    case 'BUILDS_IN_DAY': {
      // Check if user has threshold+ builds on any single calendar day (UTC)
      const builds = await db.gameBuild.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
      const counts: Record<string, number> = {}
      for (const b of builds) {
        const day = b.createdAt.toISOString().slice(0, 10)
        counts[day] = (counts[day] ?? 0) + 1
        if (counts[day] >= (threshold ?? 5)) return true
      }
      return false
    }
    case 'WEEKEND_BUILDS': {
      const builds = await db.gameBuild.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
      // Check for any pair of Sat+Sun in the same ISO week
      const weekendDays: Record<string, { sat: boolean; sun: boolean }> = {}
      for (const b of builds) {
        const d = b.createdAt
        const day = d.getUTCDay()
        if (day !== 0 && day !== 6) continue
        // Use year + week-of-year as key
        const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        const week = Math.floor((d.getTime() - startOfYear.getTime()) / 604800000)
        const key = `${d.getUTCFullYear()}-${week}`
        if (!weekendDays[key]) weekendDays[key] = { sat: false, sun: false }
        if (day === 6) weekendDays[key].sat = true
        if (day === 0) weekendDays[key].sun = true
        if (weekendDays[key].sat && weekendDays[key].sun) return true
      }
      return false
    }
    case 'ALL_CATEGORIES': {
      const ALL_CATS = ['GAME_TEMPLATE', 'MAP_TEMPLATE', 'UI_KIT', 'SCRIPT', 'ASSET', 'SOUND']
      const published = await db.template.findMany({
        where: { creatorId: userId, status: 'PUBLISHED' },
        select: { category: true },
        distinct: ['category'],
      })
      const publishedCats = new Set(published.map((t) => t.category))
      return ALL_CATS.every((c) => publishedCats.has(c as never))
    }
    default:
      // Unknown condition type — reject
      return false
  }
}

// POST /api/gamification/achievements — unlock an achievement by slug (server-verified)
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { slug } = body as { slug?: string }
    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

    const achievementDef = ACHIEVEMENTS.find((a) => a.slug === slug)
    if (!achievementDef) return NextResponse.json({ error: 'Unknown achievement' }, { status: 404 })

    const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Server-side condition verification — prevents clients from unlocking achievements they haven't earned
    const conditionMet = await verifyCondition(user.id, achievementDef.condition)
    if (!conditionMet) {
      return NextResponse.json({ error: 'Achievement condition not met' }, { status: 403 })
    }

    // Find or create the Achievement DB record
    const achievement = await db.achievement.upsert({
      where: { slug },
      create: {
        slug: achievementDef.slug,
        name: achievementDef.name,
        description: achievementDef.description,
        icon: achievementDef.icon,
        category: achievementDef.category,
        xpReward: achievementDef.xpReward,
        condition: achievementDef.condition as never,
      },
      update: {},
    })

    // Idempotent — skip if already unlocked
    const existing = await db.userAchievement.findUnique({
      where: { userId_achievementId: { userId: user.id, achievementId: achievement.id } },
    })
    if (existing) {
      return NextResponse.json({ alreadyUnlocked: true, unlockedAt: existing.unlockedAt })
    }

    await db.userAchievement.create({
      data: { userId: user.id, achievementId: achievement.id },
    })

    // Grant XP reward for the achievement directly (bypasses daily cap, no HTTP round-trip)
    if (achievement.xpReward > 0) {
      await grantXp(user.id, XPEventType.ACHIEVEMENT, {
        xpReward: achievement.xpReward,
        achievementSlug: slug,
      }).catch((err) => console.error('Failed to grant achievement XP:', err))
    }

    // Fire notification (best-effort)
    notifyAchievementUnlockedClient(user.id, {
      name: achievement.name,
      description: achievement.description,
      xpReward: achievement.xpReward,
    }).catch((err) => console.error('Achievement notification failed:', err))

    return NextResponse.json({ unlocked: true, achievement: { slug, name: achievement.name, xpReward: achievement.xpReward } }, { status: 201 })
  } catch (error) {
    console.error('Achievements POST error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', details: 'Database not connected' },
      { status: 503 }
    )
  }
}
