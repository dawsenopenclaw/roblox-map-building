import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { ACHIEVEMENTS } from '@/lib/achievements'
import { notifyAchievementUnlockedClient } from '@/lib/notifications-client'

// GET /api/gamification/achievements — all achievements with user unlock status
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
}

// POST /api/gamification/achievements — unlock an achievement by slug
export async function POST(req: NextRequest) {
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

  // Fire notification (best-effort)
  notifyAchievementUnlockedClient(user.id, {
    name: achievement.name,
    description: achievement.description,
    xpReward: achievement.xpReward,
  }).catch((err) => console.error('Achievement notification failed:', err))

  return NextResponse.json({ unlocked: true, achievement: { slug, name: achievement.name, xpReward: achievement.xpReward } }, { status: 201 })
}
