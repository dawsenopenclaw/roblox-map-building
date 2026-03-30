import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        email: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        dateOfBirth: true,
        isUnder13: true,
        createdAt: true,
        updatedAt: true,

        subscription: {
          select: {
            tier: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            trialEnd: true,
            createdAt: true,
          },
        },

        tokenBalance: {
          select: {
            balance: true,
            lifetimeEarned: true,
            lifetimeSpent: true,
            rolloverTokens: true,
            transactions: {
              select: {
                type: true,
                amount: true,
                description: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 500,
            },
          },
        },

        userXp: {
          select: {
            totalXp: true,
            tier: true,
            dailyXpToday: true,
            createdAt: true,
          },
        },

        userAchievements: {
          select: {
            unlockedAt: true,
            achievement: {
              select: {
                name: true,
                slug: true,
                description: true,
                category: true,
                xpReward: true,
              },
            },
          },
          orderBy: { unlockedAt: 'desc' },
        },

        streak: {
          select: {
            loginStreak: true,
            buildStreak: true,
            longestLoginStreak: true,
            longestBuildStreak: true,
            totalLogins: true,
            totalBuilds: true,
          },
        },

        boughtTemplates: {
          select: {
            id: true,
            amountCents: true,
            createdAt: true,
            template: {
              select: {
                title: true,
                slug: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },

        gameScans: {
          select: {
            id: true,
            robloxUrl: true,
            gameName: true,
            status: true,
            createdAt: true,
            genome: {
              select: {
                gameType: true,
                targetAge: true,
                sessionLength: true,
                monetizationModel: true,
                progressionPace: true,
                artStyle: true,
                retentionDriver: true,
                estimatedDau: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        },

        apiUsage: {
          where: {
            createdAt: { gte: ninetyDaysAgo },
          },
          select: {
            provider: true,
            operation: true,
            httpMethod: true,
            httpPath: true,
            statusCode: true,
            tokensUsed: true,
            costUsdMicro: true,
            durationMs: true,
            success: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const payload = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      profile: {
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
        isUnder13: user.isUnder13,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      subscription: user.subscription,
      tokens: user.tokenBalance
        ? {
            balance: user.tokenBalance.balance,
            lifetimeEarned: user.tokenBalance.lifetimeEarned,
            lifetimeSpent: user.tokenBalance.lifetimeSpent,
            rolloverTokens: user.tokenBalance.rolloverTokens,
            transactions: user.tokenBalance.transactions,
          }
        : null,
      xp: user.userXp,
      achievements: user.userAchievements,
      streak: user.streak,
      purchases: user.boughtTemplates,
      gameScans: user.gameScans,
      apiUsageRecords: user.apiUsage,
    }

    return NextResponse.json(payload, {
      headers: {
        'Content-Disposition': 'attachment; filename="forjegames-data-export.json"',
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
