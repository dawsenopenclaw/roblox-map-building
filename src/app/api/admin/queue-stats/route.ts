import { NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/ai/request-queue'

export async function GET() {
  return NextResponse.json(getQueueStats())
}
