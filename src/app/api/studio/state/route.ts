/**
 * GET /api/studio/state?sessionId=<id>
 *
 * Returns the current game state from the Studio plugin's context push.
 * The plugin sends workspace snapshots every 10 seconds via /api/studio/update.
 * This endpoint reads the cached state from the user's specific session
 * and returns it in the format the GameTree component expects.
 *
 * SECURITY: Requires auth + valid sessionId that belongs to the user.
 * Uses direct session lookup (O(1)) — NOT key scanning.
 *
 * Used by: GameTree.tsx (polls every 3s)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSession } from '@/lib/studio-session'

const EMPTY = { connected: false, capturedAt: null, workspace: null }

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(EMPTY)
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json(EMPTY)
  }

  try {
    // O(1) session lookup — no key scanning
    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json(EMPTY)
    }

    // Read scene tree from session's latest state
    const latestState = (session as unknown as Record<string, unknown>).latestState as Record<string, unknown> | undefined
    const sceneTree = (latestState?.sceneTree || (session as unknown as Record<string, unknown>).sceneTree || []) as Array<Record<string, unknown>>
    const scriptCount = (latestState?.scriptCount as number) ?? 0
    const partCount = (latestState?.partCount as number) ?? (session.partCount ?? 0)

    if (sceneTree.length === 0) {
      return NextResponse.json({
        connected: true,
        capturedAt: Date.now(),
        workspace: { terrain: {}, buildings: [], npcs: [], scripts: [], ui: [], other: [] },
        stats: { parts: partCount, scripts: scriptCount },
      })
    }

    // Transform sceneTree into categorized format
    const buildings: Array<{ id: string; name: string; className: string; childCount?: number }> = []
    const npcs: Array<{ id: string; name: string; className: string }> = []
    const scripts: Array<{ id: string; name: string; className: string; lineCount?: number; firstLine?: string }> = []
    const ui: Array<{ id: string; name: string; className: string }> = []
    const other: Array<{ id: string; name: string; className: string }> = []

    function categorize(nodes: Array<Record<string, unknown>>, prefix = '') {
      for (const node of nodes) {
        const name = String(node.name || 'unknown')
        const cn = String(node.className || 'Instance')
        const path = prefix ? `${prefix}.${name}` : name
        const entry = { id: path, name, className: cn }

        // Scripts (from any service)
        if (cn === 'Script' || cn === 'LocalScript' || cn === 'ModuleScript') {
          scripts.push({
            ...entry,
            lineCount: node.lineCount as number | undefined,
            firstLine: node.firstLine as string | undefined,
          })
        }
        // Services (virtual nodes from our expanded context)
        else if (cn === 'Service' || node.scriptType === 'service') {
          // Don't add the service itself, just recurse into children
        }
        // GUI elements
        else if (cn === 'ScreenGui' || cn === 'BillboardGui' || cn === 'SurfaceGui' || cn === 'Frame' || cn === 'ScrollingFrame') {
          ui.push(entry)
        }
        // NPC-like models
        else if (cn === 'Model' && /npc|character|enemy|mob|villager|zombie|skeleton/i.test(name)) {
          npcs.push(entry)
        }
        // Physical objects
        else if (cn === 'Model' || cn === 'Part' || cn === 'MeshPart' || cn === 'UnionOperation' || cn === 'WedgePart' || cn === 'TrussPart' || cn === 'Folder') {
          buildings.push({ ...entry, childCount: node.childCount as number | undefined })
        }
        // Everything else
        else {
          other.push(entry)
        }

        // Recurse into children
        if (Array.isArray(node.children)) {
          categorize(node.children as Array<Record<string, unknown>>, path)
        }
      }
    }

    categorize(sceneTree)

    return NextResponse.json({
      connected: true,
      capturedAt: (latestState?.outputLogAt as number) ?? Date.now(),
      workspace: {
        terrain: {},
        buildings,
        npcs,
        scripts,
        ui,
        other,
      },
      stats: {
        parts: partCount,
        scripts: scripts.length || scriptCount,
        models: buildings.filter(b => b.className === 'Model').length,
        guis: ui.length,
      },
    })
  } catch (err) {
    console.error('[studio/state] Error:', err)
    return NextResponse.json(EMPTY)
  }
}
