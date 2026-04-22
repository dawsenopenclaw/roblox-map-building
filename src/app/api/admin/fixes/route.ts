import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/admin/fixes — Return all tracked fixes with completion %
 * PATCH /api/admin/fixes — Update a fix item (status, progress, staffNotes)
 */

const STATE_FILE = join(process.cwd(), 'scripts', '.forje-eli-state.json')
const FIXES_FILE = join(process.cwd(), 'scripts', '.forje-fixes-overrides.json')

interface FixOverride {
  status: string
  progress: number // 0-100
  staffNotes: string
  assignee: string
  fixCommit: string
  updatedAt: string
}

function loadEliState() {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    }
  } catch {}
  return { items: [], contributors: {} }
}

function loadOverrides(): Record<string, FixOverride> {
  try {
    if (existsSync(FIXES_FILE)) {
      return JSON.parse(readFileSync(FIXES_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveOverrides(overrides: Record<string, FixOverride>) {
  writeFileSync(FIXES_FILE, JSON.stringify(overrides, null, 2))
}

export async function GET() {
  const state = loadEliState()
  const overrides = loadOverrides()

  const items = (state.items || []).map((item: Record<string, unknown>) => {
    const override = overrides[item.id as string]
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      author: item.author,
      severity: item.severity,
      priority: item.priority,
      qualityRating: item.qualityRating,
      actionability: item.actionability,
      tags: item.tags,
      timestamp: item.timestamp,
      attachments: item.attachments,
      channelName: item.channelName,
      // Override fields
      status: override?.status || item.status || 'new',
      progress: override?.progress ?? (item.status === 'fixed' ? 100 : 0),
      staffNotes: override?.staffNotes || (item.staffNotes as string) || '',
      assignee: override?.assignee || '',
      fixCommit: override?.fixCommit || '',
    }
  })

  // Sort: critical first, then by progress ascending (least done first)
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, 'N/A': 4 }
  items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const sa = severityOrder[(a.severity as string) || 'LOW'] ?? 4
    const sb = severityOrder[(b.severity as string) || 'LOW'] ?? 4
    if (sa !== sb) return sa - sb
    return ((a.progress as number) || 0) - ((b.progress as number) || 0)
  })

  const contributors = Object.values(state.contributors || {})

  // Compute summary stats
  const total = items.length
  const bugs = items.filter((i: Record<string, unknown>) => i.type === 'bug').length
  const suggestions = items.filter((i: Record<string, unknown>) => i.type === 'suggestion').length
  const fixed = items.filter((i: Record<string, unknown>) => (i.progress as number) === 100).length
  const inProgress = items.filter((i: Record<string, unknown>) => {
    const p = i.progress as number
    return p > 0 && p < 100
  }).length
  const avgProgress = total > 0
    ? Math.round(items.reduce((sum: number, i: Record<string, unknown>) => sum + ((i.progress as number) || 0), 0) / total)
    : 0

  return NextResponse.json({
    items,
    contributors,
    stats: { total, bugs, suggestions, fixed, inProgress, avgProgress },
  })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, progress, staffNotes, assignee, fixCommit } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const overrides = loadOverrides()
  overrides[id] = {
    status: status || overrides[id]?.status || 'new',
    progress: typeof progress === 'number' ? progress : (overrides[id]?.progress ?? 0),
    staffNotes: staffNotes ?? overrides[id]?.staffNotes ?? '',
    assignee: assignee ?? overrides[id]?.assignee ?? '',
    fixCommit: fixCommit ?? overrides[id]?.fixCommit ?? '',
    updatedAt: new Date().toISOString(),
  }
  saveOverrides(overrides)

  return NextResponse.json({ ok: true, override: overrides[id] })
}
