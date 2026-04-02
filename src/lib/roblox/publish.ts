/**
 * One-click Roblox place publish via Open Cloud Place Publishing API.
 *
 * Docs: https://create.roblox.com/docs/reference/cloud/place-publishing/v1
 *
 * Required API key scope: universe-places:write
 *
 * The user's Roblox API key is stored encrypted server-side (never in the DB
 * in plaintext — the caller is responsible for decryption before passing here).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublishPlaceParams {
  /** Roblox place ID (numeric string) */
  placeId:     string
  /** Universe ID the place belongs to (required by Open Cloud v2) */
  universeId:  string
  /** User's own Roblox API key with universe-places:write scope */
  apiKey:      string
  /** "Published" makes the place live; "Saved" saves without publishing */
  versionType: 'Published' | 'Saved'
}

export interface PublishResult {
  versionNumber: number
}

export interface PlaceInfoResult {
  placeId:    string
  universeId: string
  name:       string
  description: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const OPEN_CLOUD_PLACES_BASE = 'https://apis.roblox.com/universes/v1'
const PLACE_PUBLISH_BASE     = 'https://apis.roblox.com/place-publishing/v1'

// ── publishPlace ──────────────────────────────────────────────────────────────

/**
 * Publishes (or saves) a Roblox place via the Open Cloud Place Publishing API.
 *
 * Returns the new version number on success.
 * Throws a descriptive error on failure.
 */
export async function publishPlace(params: PublishPlaceParams): Promise<PublishResult> {
  const { placeId, universeId, apiKey, versionType } = params

  const url = `${PLACE_PUBLISH_BASE}/universes/${universeId}/places/${placeId}/versions?versionType=${versionType}`

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'x-api-key':    apiKey,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)')
    throw new Error(`Roblox Place Publishing API returned ${res.status}: ${body}`)
  }

  const data = await res.json() as { versionNumber?: number }

  if (typeof data.versionNumber !== 'number') {
    throw new Error('Unexpected response from Roblox Place Publishing API: missing versionNumber')
  }

  return { versionNumber: data.versionNumber }
}

// ── getPlaceInfo ──────────────────────────────────────────────────────────────

/**
 * Fetches basic info about a Roblox place (name, universeId) to validate before publishing.
 * Uses the public Roblox Games API — no auth required.
 */
export async function getPlaceInfo(placeId: string): Promise<PlaceInfoResult> {
  // Resolve universeId
  const universeRes = await fetch(
    `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`,
    { signal: AbortSignal.timeout(10_000) },
  )

  if (!universeRes.ok) {
    throw new Error(`Could not fetch place info for placeId ${placeId}: HTTP ${universeRes.status}`)
  }

  const places = await universeRes.json() as Array<{
    placeId:     number
    universeId:  number
    name:        string
    description: string
  }>

  const place = places.find((p) => String(p.placeId) === placeId)
  if (!place) throw new Error(`PlaceId ${placeId} not found in Roblox response`)

  return {
    placeId:     String(place.placeId),
    universeId:  String(place.universeId),
    name:        place.name,
    description: place.description,
  }
}

// ── buildPlaceUrl ─────────────────────────────────────────────────────────────

export function buildPlaceUrl(placeId: string, gameName: string): string {
  const slug = gameName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'game'
  return `https://www.roblox.com/games/${placeId}/${slug}`
}
