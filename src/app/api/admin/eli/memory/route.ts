import { NextRequest, NextResponse } from 'next/server'
import {
  getMemories,
  getMemoryStats,
  addMemory,
  updateMemoryConfidence,
  deleteMemory,
} from '@/lib/eli/memory'

export async function GET() {
  const memories = getMemories({ limit: 100 })
  const stats = getMemoryStats()
  return NextResponse.json({ memories, stats })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, ...params } = body

  switch (action) {
    case 'add': {
      const entry = addMemory(
        params.type || 'learning',
        params.content,
        params.tags || [],
        params.confidence || 70,
        params.source || 'manual'
      )
      return NextResponse.json({ ok: true, entry })
    }
    case 'boost': {
      updateMemoryConfidence(params.id, params.delta || 10)
      return NextResponse.json({ ok: true })
    }
    case 'delete': {
      deleteMemory(params.id)
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
