import { NextResponse } from 'next/server'
import { getAILevelBadge } from '@/lib/ai/ai-xp'

export const dynamic = 'force-dynamic'

/**
 * Public endpoint — returns the AI's current level and title.
 * Lightweight — just reads one Redis key.
 */
export async function GET() {
  try {
    const badge = await getAILevelBadge()
    return NextResponse.json(badge)
  } catch {
    return NextResponse.json({ level: 0, title: 'Offline' })
  }
}
