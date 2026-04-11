/**
 * Referral link generation + parsing.
 *
 * We use a simple, URL-safe token format: `<userKey>.<channel>.<campaign>`
 * - userKey is an opaque short id of the referring user (not their email/id)
 * - channel describes where it was shared (twitter, discord, etc.)
 * - campaign is optional — used for named drops and A/B tests
 *
 * No randomness in the token itself: different users share their own token.
 * Impressions + conversions are tracked server-side against the token.
 */

export type ReferralChannel =
  | 'twitter'
  | 'x'
  | 'tiktok'
  | 'discord'
  | 'reddit'
  | 'youtube'
  | 'email'
  | 'direct'
  | 'other'

export interface ReferralToken {
  userKey: string
  channel: ReferralChannel
  campaign?: string
}

const REF_PARAM = 'ref'
const SEP = '.'

/** Token-safe characters only. */
const SAFE_RE = /^[a-zA-Z0-9_-]+$/

/**
 * Build a referral token string from components.
 * Throws if any component contains unsafe characters.
 */
export function buildReferralToken(token: ReferralToken): string {
  if (!SAFE_RE.test(token.userKey)) {
    throw new Error(`Invalid userKey: must match ${SAFE_RE}`)
  }
  if (!SAFE_RE.test(token.channel)) {
    throw new Error(`Invalid channel: must match ${SAFE_RE}`)
  }
  if (token.campaign != null && !SAFE_RE.test(token.campaign)) {
    throw new Error(`Invalid campaign: must match ${SAFE_RE}`)
  }
  return token.campaign
    ? `${token.userKey}${SEP}${token.channel}${SEP}${token.campaign}`
    : `${token.userKey}${SEP}${token.channel}`
}

/** Parse a token string. Returns null on malformed input. */
export function parseReferralToken(raw: string): ReferralToken | null {
  if (!raw || typeof raw !== 'string') return null
  const parts = raw.split(SEP)
  if (parts.length < 2 || parts.length > 3) return null
  const [userKey, channel, campaign] = parts
  if (!SAFE_RE.test(userKey) || !SAFE_RE.test(channel)) return null
  if (campaign != null && !SAFE_RE.test(campaign)) return null
  return {
    userKey,
    channel: normalizeChannel(channel),
    campaign,
  }
}

function normalizeChannel(c: string): ReferralChannel {
  const known: ReferralChannel[] = [
    'twitter',
    'x',
    'tiktok',
    'discord',
    'reddit',
    'youtube',
    'email',
    'direct',
    'other',
  ]
  return (known as string[]).includes(c) ? (c as ReferralChannel) : 'other'
}

/** Build a full referral URL. */
export function buildReferralUrl(
  baseUrl: string,
  token: ReferralToken,
  extraParams?: Record<string, string>,
): string {
  const url = new URL(baseUrl)
  url.searchParams.set(REF_PARAM, buildReferralToken(token))
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v != null) url.searchParams.set(k, v)
    }
  }
  return url.toString()
}

/**
 * Extract a referral token from a URL string, a Request, or a URLSearchParams.
 */
export function extractReferralFromUrl(input: string | URL | URLSearchParams): ReferralToken | null {
  let params: URLSearchParams
  if (input instanceof URLSearchParams) {
    params = input
  } else {
    try {
      const url = typeof input === 'string' ? new URL(input) : input
      params = url.searchParams
    } catch {
      return null
    }
  }
  const raw = params.get(REF_PARAM)
  return raw ? parseReferralToken(raw) : null
}

/**
 * Extract a referral from a Request's URL. Safe to call in edge/runtime.
 */
export function extractReferralFromRequest(req: Request): ReferralToken | null {
  try {
    return extractReferralFromUrl(new URL(req.url))
  } catch {
    return null
  }
}

/**
 * Generate a short, URL-safe user key from any stable identifier.
 * Deterministic — same input always produces the same output.
 * Uses a simple hash + base36 encoding (no collisions at forjegames's scale).
 */
export function generateUserKey(stableId: string): string {
  // FNV-1a 32-bit hash — good enough, collision-resistant at <10M users
  let hash = 0x811c9dc5
  for (let i = 0; i < stableId.length; i++) {
    hash ^= stableId.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  // Also mix a secondary hash for extra entropy
  let h2 = 0x1b873593
  for (let i = 0; i < stableId.length; i++) {
    h2 = Math.imul(h2 ^ stableId.charCodeAt(i), 0xcc9e2d51)
  }
  const a = (hash >>> 0).toString(36)
  const b = (h2 >>> 0).toString(36)
  return `${a}${b}`.slice(0, 10)
}

export const REFERRAL_QUERY_PARAM = REF_PARAM
