import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Returns recent AI build activity for the authenticated user.
// Uses token SPEND transactions as a proxy until a dedicated Build model
// is added. This surfaces real activity on the dashboard.
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ builds: [] })
    }

    try {
      const { db } = await import('@/lib/db')

      const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true },
      })

      if (!user) {
        return NextResponse.json({ builds: [] })
      }

      // Get the user's token balance record
      const tokenBalance = await db.tokenBalance.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!tokenBalance) {
        return NextResponse.json({ builds: [] })
      }

      // Fetch recent SPEND transactions as build proxies
      const transactions = await db.tokenTransaction.findMany({
        where: {
          balanceId: tokenBalance.id,
          type: 'SPEND',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          description: true,
          createdAt: true,
          metadata: true,
        },
      })

      const builds = transactions.map((tx) => {
        // Infer build type from description
        const desc = (tx.description ?? '').toLowerCase()
        let typeIcon = '⚡'
        let typeLabel = 'Build'

        if (desc.includes('mesh') || desc.includes('3d')) {
          typeIcon = '🧊'
          typeLabel = '3D Asset'
        } else if (desc.includes('terrain') || desc.includes('map')) {
          typeIcon = '🗺️'
          typeLabel = 'Terrain'
        } else if (desc.includes('script') || desc.includes('luau')) {
          typeIcon = '📜'
          typeLabel = 'Script'
        } else if (desc.includes('ui') || desc.includes('gui')) {
          typeIcon = '🖼️'
          typeLabel = 'UI'
        } else if (desc.includes('voice')) {
          typeIcon = '🎙️'
          typeLabel = 'Voice'
        } else if (desc.includes('image')) {
          typeIcon = '🖼️'
          typeLabel = 'Image'
        }

        return {
          id: tx.id,
          typeIcon,
          typeLabel,
          description: tx.description ?? 'AI generation',
          ts: tx.createdAt.getTime(),
          tokens: Math.abs(tx.amount),
        }
      })

      return NextResponse.json({ builds })
    } catch {
      // DB not connected
      return NextResponse.json({ builds: [] })
    }
  } catch {
    return NextResponse.json({ builds: [] })
  }
}
