/**
 * POST /api/roblox/publish — one-click publish a Roblox place
 *
 * Body:
 *   {
 *     placeId:     string   — Roblox place ID
 *     apiKey:      string   — user's Roblox Open Cloud API key (universe-places:write scope)
 *     versionType: "Published" | "Saved"  (default: "Published")
 *   }
 *
 * Returns:
 *   { published: true, placeUrl: string, universeId: string, versionNumber: number }
 *
 * Security note:
 *   The apiKey is NEVER stored by ForjeGames. It passes through server-side
 *   only for this request and is used directly against the Roblox API.
 *   Log redaction via the metadata field strips the key before any persistence.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { parseBody } from '@/lib/validations'
import { requireTier } from '@/lib/tier-guard'
import { publishPlace, getPlaceInfo, buildPlaceUrl } from '@/lib/roblox/publish'

// ── Schema ────────────────────────────────────────────────────────────────────

const publishSchema = z.object({
  placeId:     z.string().regex(/^\d+$/, 'placeId must be a numeric string'),
  apiKey:      z.string().min(20, 'apiKey is required'),
  versionType: z.enum(['Published', 'Saved']).default('Published'),
})

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Publishing requires HOBBY tier or above
  const tierDenied = await requireTier(userId, 'HOBBY')
  if (tierDenied) return tierDenied

  const parsed = await parseBody(req, publishSchema)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

  const { placeId, apiKey, versionType } = parsed.data

  // Step 1: Fetch place metadata (validates placeId + resolves universeId)
  let placeInfo: Awaited<ReturnType<typeof getPlaceInfo>>
  try {
    placeInfo = await getPlaceInfo(placeId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Could not resolve place info', detail: message },
      { status: 404 },
    )
  }

  // Step 2: Publish via Open Cloud
  let result: Awaited<ReturnType<typeof publishPlace>>
  try {
    result = await publishPlace({
      placeId,
      universeId:  placeInfo.universeId,
      apiKey,
      versionType,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    // Surface common errors clearly
    if (message.includes('401') || message.includes('403')) {
      return NextResponse.json(
        {
          error:  'Roblox API key rejected',
          detail: 'Ensure your API key has the universe-places:write scope and is not expired.',
        },
        { status: 403 },
      )
    }

    return NextResponse.json(
      { error: 'Publish failed', detail: message },
      { status: 502 },
    )
  }

  const placeUrl = buildPlaceUrl(placeId, placeInfo.name)

  return NextResponse.json({
    published:     true,
    placeUrl,
    universeId:    placeInfo.universeId,
    placeId,
    gameName:      placeInfo.name,
    versionNumber: result.versionNumber,
    versionType,
  })
}
