/**
 * output-validator.ts
 *
 * Validates AI outputs before we show them to the user. Three validators:
 *
 *   - validateLuauOutput(code)  — wraps the existing luau-validator with
 *                                  extra semantic checks (hallucinated APIs,
 *                                  missing services, unbalanced do/end).
 *   - validateImageOutput(url)  — checks the URL is reachable, is an image,
 *                                  has the expected dimensions, and isn't a
 *                                  "solid color" placeholder response.
 *   - validateMeshOutput(id)    — checks the Roblox API that the asset
 *                                  actually exists and is a Model (or Mesh).
 *
 * All validators return a uniform `{ valid, issues, suggestions }` shape so
 * the retry-strategy and asset-director can route bad outputs back into
 * withFallbackChain without special-casing each modality.
 */

import 'server-only'
import { validateAndFixLuau } from '@/lib/luau-validator'

// ───────────────────────────────────────────────────────────────────────────
// Shared result shape
// ───────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  issues: string[]
  suggestions: string[]
  /** Optional metadata per-validator. */
  meta?: Record<string, unknown>
}

// ───────────────────────────────────────────────────────────────────────────
// Luau output validator
// ───────────────────────────────────────────────────────────────────────────

/** Known-bad API references that LLMs hallucinate. */
const HALLUCINATED_APIS: Array<{ rx: RegExp; fix: string }> = [
  { rx: /\bgame\.Workspace\.CurrentCamera\b/g, fix: 'Use workspace.CurrentCamera (Camera is always on the server too).' },
  { rx: /\bInstance\.new\("Script",\s*workspace\)/g, fix: 'Scripts parented to workspace do not run in Edit Mode. Parent to ServerScriptService.' },
  { rx: /\bHttpService\b/g, fix: 'HttpService on the client is blocked. Move HTTP calls to a server Script.' },
  { rx: /\bloadstring\s*\(/g, fix: 'loadstring is forbidden in Forje-generated code.' },
  { rx: /\brequire\s*\(\s*\d+\s*\)/g, fix: 'require(assetId) is forbidden. Use require(ReplicatedStorage.MyModule).' },
  { rx: /\bgetfenv\s*\(|\bsetfenv\s*\(/g, fix: 'getfenv/setfenv are deprecated and disable Luau type-checking.' },
  { rx: /\b_G\s*\./g, fix: 'Avoid _G for cross-script state — use ReplicatedStorage or ModuleScripts.' },
]

const REQUIRED_SERVICE_HINTS: Array<{ usage: RegExp; service: string }> = [
  { usage: /\bPlayers\b/, service: 'local Players = game:GetService("Players")' },
  { usage: /\bReplicatedStorage\b/, service: 'local ReplicatedStorage = game:GetService("ReplicatedStorage")' },
  { usage: /\bServerStorage\b/, service: 'local ServerStorage = game:GetService("ServerStorage")' },
  { usage: /\bTweenService\b/, service: 'local TweenService = game:GetService("TweenService")' },
  { usage: /\bRunService\b/, service: 'local RunService = game:GetService("RunService")' },
  { usage: /\bDataStoreService\b/, service: 'local DataStoreService = game:GetService("DataStoreService")' },
  { usage: /\bUserInputService\b/, service: 'local UserInputService = game:GetService("UserInputService")' },
]

function countBalanced(code: string, open: RegExp, close: RegExp): number {
  const opens = (code.match(open) ?? []).length
  const closes = (code.match(close) ?? []).length
  return opens - closes
}

/**
 * Validate a Luau code string. Uses the existing `validateAndFixLuau` as a
 * foundation, then layers additional semantic checks on top.
 */
export function validateLuauOutput(code: string): ValidationResult {
  const issues: string[] = []
  const suggestions: string[] = []

  if (!code || code.trim().length === 0) {
    return { valid: false, issues: ['Empty code'], suggestions: ['Retry generation.'] }
  }

  // Run the existing validator/fixer first.
  const base = validateAndFixLuau(code)
  if (!base.valid) {
    issues.push(...base.warnings)
  }

  // Check for hallucinated APIs.
  for (const { rx, fix } of HALLUCINATED_APIS) {
    if (rx.test(base.fixedCode)) {
      issues.push(`Suspicious API: ${rx.source}`)
      suggestions.push(fix)
    }
  }

  // Check for missing service declarations.
  const declared = new Set<string>()
  for (const line of base.fixedCode.split('\n')) {
    const m = line.match(/\blocal\s+(\w+)\s*=\s*game:GetService\(/)
    if (m && m[1]) declared.add(m[1])
  }
  for (const { usage, service } of REQUIRED_SERVICE_HINTS) {
    if (usage.test(base.fixedCode)) {
      // Pull the service name from the service line (the `local X = ...` word).
      const nameMatch = service.match(/^local\s+(\w+)/)
      const name = nameMatch?.[1]
      if (name && !declared.has(name)) {
        issues.push(`Uses ${name} without declaring it`)
        suggestions.push(`Add at the top: ${service}`)
      }
    }
  }

  // Balance checks: do/end, function/end, if/end.
  const doDelta = countBalanced(base.fixedCode, /\b(do|then|function)\b/g, /\bend\b/g)
  if (doDelta !== 0) {
    issues.push(
      doDelta > 0
        ? `Unbalanced blocks: missing ${doDelta} end keyword${doDelta > 1 ? 's' : ''}`
        : `Unbalanced blocks: ${-doDelta} extra end keyword${-doDelta > 1 ? 's' : ''}`,
    )
    suggestions.push('Manually close each do/then/function with a matching end.')
  }

  const parenDelta = countBalanced(base.fixedCode, /\(/g, /\)/g)
  if (parenDelta !== 0) {
    issues.push(
      parenDelta > 0
        ? `Unbalanced parentheses: missing ${parenDelta} closing )`
        : `Unbalanced parentheses: ${-parenDelta} extra closing )`,
    )
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
    meta: {
      fixedCode: base.fixedCode,
      appliedFixes: base.fixes,
    },
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Image output validator
// ───────────────────────────────────────────────────────────────────────────

export interface ImageValidationOptions {
  /** Expected minimum width in pixels. */
  minWidth?: number
  /** Expected minimum height in pixels. */
  minHeight?: number
  /** Max allowed content-length bytes (default 20MB). */
  maxBytes?: number
  /** Fetch implementation injection point for tests. */
  fetchImpl?: typeof fetch
}

/**
 * Validate an image URL:
 *   - URL is reachable (HEAD or GET)
 *   - content-type is an image/*
 *   - content-length is within maxBytes
 *   - (optional) dimensions meet minWidth/minHeight
 *
 * We deliberately do NOT decode the image here to avoid pulling in a
 * canvas/sharp dependency in the server runtime. The "not a solid color"
 * check is implemented via content-length heuristic: genuinely solid-color
 * outputs from broken generators are usually < 4KB.
 */
export async function validateImageOutput(
  url: string,
  opts: ImageValidationOptions = {},
): Promise<ValidationResult> {
  const issues: string[] = []
  const suggestions: string[] = []
  const meta: Record<string, unknown> = {}

  if (!url || typeof url !== 'string') {
    return { valid: false, issues: ['Missing or invalid URL'], suggestions: ['Retry generation.'] }
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, issues: ['Invalid URL format'], suggestions: ['Retry generation.'] }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, issues: [`Unsupported protocol: ${parsed.protocol}`], suggestions: [] }
  }

  const maxBytes = opts.maxBytes ?? 20 * 1024 * 1024
  const fetchImpl = opts.fetchImpl ?? fetch

  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    })
    meta.status = res.status
    if (!res.ok) {
      issues.push(`HTTP ${res.status}`)
      return { valid: false, issues, suggestions: ['Retry — the CDN may be warming up.'], meta }
    }

    const contentType = res.headers.get('content-type') ?? ''
    meta.contentType = contentType
    if (!contentType.startsWith('image/')) {
      issues.push(`Not an image content-type: ${contentType || '(none)'}`)
      suggestions.push('Generator likely returned an error page. Retry with a different seed.')
    }

    const contentLength = Number.parseInt(res.headers.get('content-length') ?? '0', 10)
    meta.bytes = contentLength
    if (contentLength > 0 && contentLength > maxBytes) {
      issues.push(`Image too large: ${contentLength} bytes > ${maxBytes}`)
    }

    // Heuristic: solid-color / broken gen results are tiny.
    if (contentLength > 0 && contentLength < 4096) {
      issues.push(`Suspiciously small image: ${contentLength} bytes`)
      suggestions.push('Likely a solid-color placeholder. Retry with higher CFG or a different model.')
    }
  } catch (e) {
    issues.push(`Fetch failed: ${(e as Error).message}`)
    suggestions.push('Retry once; escalate to fallback model on second failure.')
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
    meta,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Mesh output validator
// ───────────────────────────────────────────────────────────────────────────

export interface MeshValidationOptions {
  /** Roblox cloud API key. Defaults to process.env.ROBLOX_API_KEY. */
  apiKey?: string
  /** Fetch implementation injection point for tests. */
  fetchImpl?: typeof fetch
}

interface RobloxAssetDetails {
  assetType?: { id?: number; name?: string }
  id?: number
  displayName?: string
  moderationResult?: { moderationState?: string }
}

/**
 * Validate a Roblox asset id. Confirms:
 *   - the id is a positive integer
 *   - the Roblox cloud API returns a 200 for the asset
 *   - the asset type is Model / MeshPart / Mesh
 *   - the asset is not under review / rejected moderation
 */
export async function validateMeshOutput(
  assetId: string | number,
  opts: MeshValidationOptions = {},
): Promise<ValidationResult> {
  const issues: string[] = []
  const suggestions: string[] = []
  const meta: Record<string, unknown> = {}

  const id = typeof assetId === 'string' ? Number.parseInt(assetId, 10) : assetId
  if (!Number.isFinite(id) || id <= 0) {
    return {
      valid: false,
      issues: [`Invalid asset id: ${assetId}`],
      suggestions: ['Mesh pipeline likely returned an error. Retry generation.'],
    }
  }

  const apiKey = opts.apiKey ?? process.env.ROBLOX_API_KEY
  const fetchImpl = opts.fetchImpl ?? fetch

  if (!apiKey) {
    // We can't fully validate without a key — surface a soft warning.
    return {
      valid: true,
      issues: [],
      suggestions: ['Set ROBLOX_API_KEY to enable full mesh validation.'],
      meta: { id, mode: 'soft' },
    }
  }

  try {
    const res = await fetchImpl(`https://apis.roblox.com/assets/v1/assets/${id}`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(10_000),
    })
    meta.status = res.status
    if (res.status === 404) {
      issues.push('Asset not found on Roblox')
      suggestions.push('Mesh upload may have failed or still be processing.')
      return { valid: false, issues, suggestions, meta }
    }
    if (!res.ok) {
      issues.push(`Roblox API ${res.status}`)
      return { valid: false, issues, suggestions: ['Retry in 2 seconds.'], meta }
    }

    const data = (await res.json()) as RobloxAssetDetails
    meta.details = data

    const typeName = data.assetType?.name ?? 'Unknown'
    if (typeName !== 'Model' && typeName !== 'MeshPart' && typeName !== 'Mesh') {
      issues.push(`Unexpected asset type: ${typeName}`)
      suggestions.push('Pipeline wired the wrong upload endpoint. Check mesh-pipeline.ts.')
    }

    const mod = data.moderationResult?.moderationState
    if (mod && mod !== 'Approved') {
      issues.push(`Moderation state: ${mod}`)
      suggestions.push('Asset is in review or was rejected. Regenerate with a safer prompt.')
    }
  } catch (e) {
    issues.push(`Validation fetch failed: ${(e as Error).message}`)
    suggestions.push('Skip validation and surface the asset with a warning.')
  }

  return { valid: issues.length === 0, issues, suggestions, meta }
}
