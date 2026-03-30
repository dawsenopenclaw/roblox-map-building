import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (clerkId) {
      try {
        const { db } = await import('@/lib/db')

        // Streak data from the Streak model
        const user = await db.user.findUnique({
          where: { clerkId },
          select: { id: true },
        })

        if (user) {
          const streak = await db.streak.findUnique({
            where: { userId: user.id },
            select: { buildStreak: true, totalBuilds: true },
          })

          return NextResponse.json({
            buildsThisWeek: 0, // populated once Build model is added
            activeProjects: 0, // populated once Project model is added
            streakDays: streak?.buildStreak ?? 0,
            buildActivity: [0, 0, 0, 0, 0, 0, 0],
          })
        }
      } catch {
        // DB not connected — fall through
      }
    }

    return NextResponse.json({
      buildsThisWeek: 0,
      activeProjects: 0,
      streakDays: 0,
      buildActivity: [0, 0, 0, 0, 0, 0, 0],
    })
  } catch {
    return NextResponse.json({
      buildsThisWeek: 0,
      activeProjects: 0,
      streakDays: 0,
      buildActivity: [0, 0, 0, 0, 0, 0, 0],
    })
  }
}
