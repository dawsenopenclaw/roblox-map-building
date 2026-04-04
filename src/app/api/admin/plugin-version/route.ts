/**
 * POST /api/admin/plugin-version
 * GET  /api/admin/plugin-version
 *
 * Admin endpoint to read or set the Studio plugin version manifest stored in
 * Redis at key `fj:studio:plugin:version`.
 *
 * The GET /api/studio/version endpoint reads this same key (with a 5-minute
 * in-memory cache) and returns it to Studio plugins during their version check.
 *
 * POST body:
 * {
 *   version:     string,   // e.g. "4.5.0"
 *   minVersion:  string,   // e.g. "4.0.0"  — plugins below this get forceUpdate:true
 *   changelog:   string,   // brief human-readable changelog
 *   downloadUrl?: string,  // defaults to "/api/studio/plugin" if omitted
 *   forceUpdate?: boolean  // override; normally derived from minVersion comparison
 * }
 *
 * GET response: current manifest from Redis, or 404 when none has been set.
 *
 * Protected by requireAdmin() — Clerk session + ADMIN role or ADMIN_EMAILS bypass.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '../_adminGuard'
import { getRedis } from '@/lib/redis'

const REDIS_KEY = 'fj:studio:plugin:version'

// Validate a semver string is plausibly formatted (not a full parser — just a guard)
function isValidSemver(v: unknown): v is string {
  if (typeof v !== 'string') return false
  return /^\d+\.\d+\.\d+$/.test(v.trim())
}

// ── GET — read current manifest ───────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const r = getRedis()
    if (!r) {
      return NextResponse.json({ error: 'Redis unavailable' }, { status: 503 })
    }
    const raw = await r.get(REDIS_KEY)
    if (!raw) {
      return NextResponse.json({ error: 'No version manifest set yet' }, { status: 404 })
    }
    return NextResponse.json(JSON.parse(raw))
  } catch (err) {
    return NextResponse.json({ error: 'internal', message: String(err) }, { status: 500 })
  }
}

// ── POST — write new manifest ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
  }

  const { version, minVersion, changelog, downloadUrl, forceUpdate } = body as Record<string, unknown>

  if (!isValidSemver(version)) {
    return NextResponse.json(
      { error: 'version is required and must be a semver string (e.g. "4.5.0")' },
      { status: 400 },
    )
  }
  if (!isValidSemver(minVersion)) {
    return NextResponse.json(
      { error: 'minVersion is required and must be a semver string (e.g. "4.0.0")' },
      { status: 400 },
    )
  }
  if (typeof changelog !== 'string' || changelog.trim().length === 0) {
    return NextResponse.json({ error: 'changelog is required (non-empty string)' }, { status: 400 })
  }

  const resolvedDownloadUrl =
    typeof downloadUrl === 'string' && downloadUrl.trim().length > 0
      ? downloadUrl.trim()
      : '/api/studio/plugin'

  const resolvedForceUpdate = typeof forceUpdate === 'boolean' ? forceUpdate : false

  const manifest = {
    version:     version.trim(),
    minVersion:  minVersion.trim(),
    changelog:   changelog.trim(),
    downloadUrl: resolvedDownloadUrl,
    forceUpdate: resolvedForceUpdate,
    updatedAt:   new Date().toISOString(),
    updatedBy:   guard.user?.email ?? guard.user?.id ?? 'admin',
  }

  try {
    const r = getRedis()
    if (!r) {
      return NextResponse.json({ error: 'Redis unavailable — cannot persist manifest' }, { status: 503 })
    }
    await r.set(REDIS_KEY, JSON.stringify(manifest))
  } catch (err) {
    return NextResponse.json({ error: 'Redis write failed', message: String(err) }, { status: 500 })
  }

  return NextResponse.json({
    ok:       true,
    manifest,
    message:  `Plugin version set to ${manifest.version} (min: ${manifest.minVersion})`,
  })
}
