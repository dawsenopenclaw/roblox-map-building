import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { notifyAchievementUnlockedClient } from '@/lib/notifications-client'
import { XPEventType } from '@prisma/client'
import { grantXp } from '@/lib/xp-server'

/**
 * POST /api/gamification/achievements/check
 *
 * Scans all achievement definitions and awards any the user has earned
 * but not yet unlocked. Returns the list of newly awarded achievements.
 */

async function verifyCondition(
  userId: string,
  condition: Record<string, unknown>
): Promise<boolean> {
  const type = condition.type as string
  const threshold = condition.threshold as number | undefined

  switch (type) {
    case 'BUILD_COUNT': {
      const count = await db.build.count({ where: { userId } })
      return count >= (threshold ?? 1)
    }
    case 'PUBLISH_COUNT': {
      const count = await db.template.count({
        where: { creatorId: userId, status: 'PUBLISHED', deletedAt: null },
      })
      return count >= (threshold ?? 1)
    }
    case 'SALE_COUNT': {
      const count = await db.templatePurchase.count({
        where: { template: { creatorId: userId } },
      })
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
      const streak = await db.streak.findUnique({
        where: { userId },
        select: { loginStreak: true },
      })
      return (streak?.loginStreak ?? 0) >= (threshold ?? 1)
    }
    case 'XP_THRESHOLD': {
      const xp = await db.userXP.findUnique({
        where: { userId },
        select: { totalXp: true },
      })
      return (xp?.totalXp ?? 0) >= (threshold ?? 0)
    }
    case 'TOTAL_EARNED_CENTS': {
      const account = await db.creatorAccount.findUnique({
        where: { userId },
        select: { totalEarnedCents: true },
      })
      return (account?.totalEarnedCents ?? 0) >= (threshold ?? 0)
    }
    case 'STRIPE_CONNECTED': {
      const account = await db.creatorAccount.findUnique({
        where: { userId },
        select: { chargesEnabled: true },
      })
      return account?.chargesEnabled === true
    }
    case 'PROFILE_COMPLETE': {
      const u = await db.user.findUnique({
        where: { id: userId },
        select: { username: true, displayName: true, avatarUrl: true },
      })
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
        where: {
          creatorId: userId,
          reviewCount: { gte: minReviews },
          averageRating: 5,
          deletedAt: null,
        },
        select: { id: true },
      })
      return template !== null
    }
    case 'BUILDS_IN_DAY': {
      const builds = await db.build.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1000,
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
      const builds = await db.build.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1000,
      })
      const weekendDays: Record<string, { sat: boolean; sun: boolean }> = {}
      for (const b of builds) {
        const d = b.createdAt
        const day = d.getUTCDay()
        if (day !== 0 && day !== 6) continue
        const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        const week = Math.floor(
          (d.getTime() - startOfYear.getTime()) / 604800000
        )
        const key = `${d.getUTCFullYear()}-${week}`
        if (!weekendDays[key]) weekendDays[key] = { sat: false, sun: false }
        if (day === 6) weekendDays[key].sat = true
        if (day === 0) weekendDays[key].sun = true
        if (weekendDays[key].sat && weekendDays[key].sun) return true
      }
      return false
    }
    case 'ALL_CATEGORIES': {
      const ALL_CATS = [
        'GAME_TEMPLATE',
        'MAP_TEMPLATE',
        'UI_KIT',
        'SCRIPT',
        'ASSET',
        'SOUND',
      ]
      const published = await db.template.findMany({
        where: { creatorId: userId, status: 'PUBLISHED', deletedAt: null },
        select: { category: true },
        distinct: ['category'],
      })
      const publishedCats = new Set(published.map((t) => t.category))
      return ALL_CATS.every((c) => publishedCats.has(c as never))
    }
    default:
      return false
  }
}

export async function POST() {
  let clerkId: string | null = null
  try {
    const session = await auth()
    clerkId = session?.userId ?? null
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        userAchievements: {
          select: { achievement: { select: { slug: true } } },
        },
      },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const alreadyUnlocked = new Set(
      user.userAchievements.map((ua) => ua.achievement.slug)
    )

    const newlyAwarded: Array<{
      slug: string
      name: string
      icon: string
      xpReward: number
      category: string
    }> = []

    // Check each achievement that hasn't been unlocked yet
    for (const def of ACHIEVEMENTS) {
      if (alreadyUnlocked.has(def.slug)) continue

      const met = await verifyCondition(user.id, def.condition)
      if (!met) continue

      // Upsert the Achievement DB record
      const achievement = await db.achievement.upsert({
        where: { slug: def.slug },
        create: {
          slug: def.slug,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          xpReward: def.xpReward,
          condition: def.condition as never,
        },
        update: {},
      })

      // Create UserAchievement (skip if race condition)
      try {
        await db.userAchievement.create({
          data: { userId: user.id, achievementId: achievement.id },
        })
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2002') continue
        throw err
      }

      // Grant XP
      if (achievement.xpReward > 0) {
        await grantXp(
          user.id,
          XPEventType.ACHIEVEMENT,
          { achievementSlug: def.slug },
          achievement.xpReward
        ).catch(() => {})
      }

      // Notify
      notifyAchievementUnlockedClient(user.id, {
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
      }).catch(() => {})

      newlyAwarded.push({
        slug: def.slug,
        name: def.name,
        icon: def.icon,
        xpReward: def.xpReward,
        category: def.category,
      })
    }

    return NextResponse.json({
      checked: ACHIEVEMENTS.length,
      newlyAwarded,
      newCount: newlyAwarded.length,
    })
  } catch {
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    )
  }
}
