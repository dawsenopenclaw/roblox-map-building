/**
 * Playtest semantic analysis — two paths, both fail-soft.
 *
 * 1. `analyzePlaytestScreenshot(url, prompt)` — Gemini Vision, pixel input.
 *    This is the ideal path but is currently dead weight in production
 *    because Roblox Studio plugins have no stable API to capture the
 *    viewport to pixels. The plugin's screenshot hook at
 *    ForjeGamesPlugin.lua:910 explicitly sends `screenshotData = nil`,
 *    so `session.latestScreenshot` is always null and this function is
 *    never actually called from the agentic loop in practice. Kept for
 *    the day Roblox exposes `StudioService:CaptureScreenshot()` — at
 *    that point flipping the switch is a one-line plugin change.
 *
 * 2. `analyzePlaytestScene(worldSnapshot, prompt)` — text Gemini/Groq,
 *    structured scene input. This is what runs in production today. The
 *    plugin's `scan_workspace` command already returns a full hierarchy
 *    of BaseParts with positions, sizes, materials, colors, and names
 *    (ForjeGamesPlugin.lua:643 `cmdScanWorkspace`). We flatten that into
 *    a compact text manifest and ask the LLM "does this match the user's
 *    prompt?" This catches the bugs the audit cared about (empty
 *    scenes, parts below ground, missing features from the prompt)
 *    without needing pixels.
 *
 * Both paths are fail-soft:
 *   - Missing API key / model outage / parse error → `{ ok: true, issues: [] }`
 *     with a `skippedReason` so the loop behaves exactly as before.
 *   - A vision/scene outage must never block the agentic loop, only
 *     remove its extra safety net.
 */

import { callAI, type AIMessage } from './provider'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/** Shape returned to callers. */
export interface PlaytestVisionResult {
  /** true = build looks correct for the prompt; false = visible issues detected. */
  ok: boolean
  /** Short human-readable issue descriptions — fed back into the AI fix step. */
  issues: string[]
  /** Confidence 0-1 from the vision model; undefined when the check was skipped. */
  confidence?: number
  /** Reason the check was skipped, if it was. */
  skippedReason?: 'no_api_key' | 'no_screenshot' | 'fetch_failed' | 'parse_failed' | 'api_error'
}

// ---------------------------------------------------------------------------
// Visual quality analysis — post-playtest screenshot AI evaluation
// ---------------------------------------------------------------------------

/** Categories of visual issues the AI checks for. */
export type VisualIssueCategory =
  | 'rendering_glitch'
  | 'ui_broken'
  | 'lighting_issue'
  | 'missing_content'
  | 'scale_problem'
  | 'collision_issue'
  | 'z_fighting'
  | 'empty_scene'
  | 'other'

export interface VisualQualityIssue {
  category: VisualIssueCategory
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface VisualQualityResult {
  /** Overall quality score 0-100. 80+ is considered passing. */
  score: number
  /** Whether the scene passes visual QA (score >= 80 and no high-severity issues). */
  passed: boolean
  /** List of visual issues found. */
  issues: VisualQualityIssue[]
  /** Summary string suitable for feeding back to the AI fix step. */
  summary: string
  /** Reason the check was skipped, if it was. */
  skippedReason?: PlaytestVisionResult['skippedReason']
}

const VISUAL_QUALITY_PROMPT = (userPrompt: string, context?: string) => `You are a Roblox QA visual inspector. Analyze this screenshot from an automated playtest and evaluate visual quality.

The user asked the AI to build:
"""
${userPrompt.slice(0, 800)}
"""
${context ? `\nAdditional context from the test run:\n${context}\n` : ''}
Evaluate the screenshot for these categories:
1. rendering_glitch — Z-fighting, flickering textures, parts clipping through each other
2. ui_broken — UI elements overlapping, text cut off, missing HUD elements, buttons out of bounds
3. lighting_issue — Scene too dark to see, blown-out white, missing shadows where expected
4. missing_content — Key objects from the prompt are absent, placeholder grey cubes
5. scale_problem — Objects wildly wrong size (player inside a wall, building fits in your hand)
6. collision_issue — Objects overlapping, parts sunk into the floor, floating in air unexpectedly
7. z_fighting — Surfaces at exactly the same position causing visual flickering
8. empty_scene — Nothing was built when objects were expected
9. other — Anything else visually wrong

Return ONLY a JSON object, no markdown:
{
  "score": number,
  "issues": [
    { "category": string, "description": string, "severity": "low"|"medium"|"high" }
  ],
  "summary": string
}

Where:
- score = 0-100 visual quality rating (100 = perfect, 80+ = acceptable, <50 = clearly broken)
- issues = array of found issues (empty if scene looks good)
- summary = 1-2 sentence overall assessment`

/**
 * Perform AI-powered visual quality analysis on a playtest screenshot.
 *
 * Uses Gemini Vision to evaluate the screenshot against the user's prompt
 * and return a structured quality report with scores and categorized issues.
 *
 * Fail-soft: any error returns a passing result with skippedReason.
 */
export async function analyzeVisualQuality(
  screenshotUrl: string | undefined | null,
  userPrompt: string,
  context?: string,
): Promise<VisualQualityResult> {
  if (!screenshotUrl) {
    return { score: 100, passed: true, issues: [], summary: 'No screenshot available for analysis.', skippedReason: 'no_screenshot' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { score: 100, passed: true, issues: [], summary: 'No Gemini API key — visual analysis skipped.', skippedReason: 'no_api_key' }
  }

  const loaded = await loadScreenshotAsBase64(screenshotUrl)
  if (!loaded) {
    return { score: 100, passed: true, issues: [], summary: 'Failed to load screenshot.', skippedReason: 'fetch_failed' }
  }

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: loaded.mimeType,
              data: loaded.base64,
            },
          },
          { text: VISUAL_QUALITY_PROMPT(userPrompt, context) },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 1024,
    },
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      console.warn('[playtest-vision] Visual quality analysis Gemini API error', res.status)
      return { score: 100, passed: true, issues: [], summary: 'Gemini API error during visual analysis.', skippedReason: 'api_error' }
    }

    const json = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
      error?: { message: string }
    }

    if (!json || json.error) {
      return { score: 100, passed: true, issues: [], summary: 'Gemini returned error.', skippedReason: 'api_error' }
    }

    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim()

    const parsed = JSON.parse(cleaned) as {
      score?: number
      issues?: Array<{ category?: string; description?: string; severity?: string }>
      summary?: string
    }

    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 80
    const issues: VisualQualityIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues
          .filter((i) => i && typeof i.description === 'string')
          .map((i) => ({
            category: (i.category as VisualIssueCategory) || 'other',
            description: i.description!,
            severity: (['low', 'medium', 'high'].includes(i.severity || '') ? i.severity : 'medium') as 'low' | 'medium' | 'high',
          }))
          .slice(0, 10)
      : []
    const hasHighSeverity = issues.some((i) => i.severity === 'high')
    const passed = score >= 80 && !hasHighSeverity
    const summary = typeof parsed.summary === 'string' ? parsed.summary : `Visual quality score: ${score}/100`

    return { score, passed, issues, summary }
  } catch (err) {
    console.warn('[playtest-vision] Visual quality analysis failed', err)
    return { score: 100, passed: true, issues: [], summary: 'Visual analysis error.', skippedReason: 'api_error' }
  }
}

const VISION_PROMPT_TEMPLATE = (userPrompt: string) => `You are a Roblox QA agent looking at a screenshot of a game the user asked the AI to build.

The user's original prompt was:
"""
${userPrompt.slice(0, 800)}
"""

Your job: decide whether the screenshot visually matches that prompt. Look for obvious build failures only, NOT subjective art direction. Specifically check for:
  - Parts that have fallen through the floor or are floating in space
  - Missing assets / placeholder grey cubes where real objects should be
  - Broken lighting (pitch black scene, blown-out white)
  - Obvious scale problems (characters inside walls, buildings the wrong size)
  - Broken UI (text clipping, overlapping elements, missing HUD)
  - Empty scenes when the prompt asked for objects

Do NOT flag stylistic choices, colour preferences, or minor polish items.

Return ONLY a JSON object with exactly this shape, no markdown:
{
  "ok": boolean,
  "issues": string[],
  "confidence": number
}

Where:
  - ok = true if the build is usable, false if there is at least one clear build failure
  - issues = empty when ok=true, otherwise 1-5 short bullet strings naming each problem
  - confidence = 0.0 to 1.0 — how sure you are about the verdict`

/**
 * Fetch a screenshot URL and return its base64 body + mime type.
 * Supports both remote URLs and data URIs.
 */
async function loadScreenshotAsBase64(
  screenshotUrl: string,
): Promise<{ base64: string; mimeType: string } | null> {
  // Data URI — parse directly
  if (screenshotUrl.startsWith('data:')) {
    const match = screenshotUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return null
    return { mimeType: match[1], base64: match[2] }
  }

  // Remote URL — fetch bytes
  try {
    const res = await fetch(screenshotUrl, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Magic byte detection for the formats the playtest bridge can produce
    let mimeType = 'image/png'
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) mimeType = 'image/jpeg'
    else if (bytes[0] === 0x89 && bytes[1] === 0x50) mimeType = 'image/png'
    else if (bytes[0] === 0x52 && bytes[1] === 0x49) mimeType = 'image/webp'
    const base64 = Buffer.from(buffer).toString('base64')
    return { base64, mimeType }
  } catch {
    return null
  }
}

/**
 * Ask Gemini Vision whether a playtest screenshot shows a working build
 * for the given user prompt.
 *
 * Fails soft — any error returns `{ ok: true, issues: [], skippedReason }`
 * so the caller's agentic loop is never blocked by a vision outage.
 */
export async function analyzePlaytestScreenshot(
  screenshotUrl: string | undefined | null,
  userPrompt: string,
): Promise<PlaytestVisionResult> {
  if (!screenshotUrl) {
    return { ok: true, issues: [], skippedReason: 'no_screenshot' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: true, issues: [], skippedReason: 'no_api_key' }
  }

  const loaded = await loadScreenshotAsBase64(screenshotUrl)
  if (!loaded) {
    return { ok: true, issues: [], skippedReason: 'fetch_failed' }
  }

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: loaded.mimeType,
              data: loaded.base64,
            },
          },
          { text: VISION_PROMPT_TEMPLATE(userPrompt) },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 512,
    },
  }

  let json:
    | {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
        error?: { message: string }
      }
    | null = null

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      console.warn('[playtest-vision] Gemini API error', res.status)
      return { ok: true, issues: [], skippedReason: 'api_error' }
    }
    json = await res.json()
  } catch (err) {
    console.warn('[playtest-vision] Gemini fetch failed', err)
    return { ok: true, issues: [], skippedReason: 'api_error' }
  }

  if (!json || json.error) {
    return { ok: true, issues: [], skippedReason: 'api_error' }
  }

  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as Partial<PlaytestVisionResult>
    const ok = parsed.ok !== false // default to ok=true if model omits the field
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((s): s is string => typeof s === 'string').slice(0, 5)
      : []
    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : undefined
    return { ok: ok && issues.length === 0, issues, confidence }
  } catch {
    console.warn('[playtest-vision] Gemini returned non-JSON:', rawText.slice(0, 200))
    return { ok: true, issues: [], skippedReason: 'parse_failed' }
  }
}

// ---------------------------------------------------------------------------
// Scene-manifest analysis (the path that actually runs in production)
// ---------------------------------------------------------------------------

/** A single node from the plugin's scan_workspace tree. */
interface SceneNode {
  name: string
  className: string
  position?: { X: number; Y: number; Z: number }
  size?: { X: number; Y: number; Z: number }
  material?: string
  color?: { R: number; G: number; B: number }
  children?: SceneNode[]
}

/**
 * Flatten a scene tree into a compact textual manifest the LLM can reason
 * about. Deliberately short — we're paying per token and the model only
 * needs enough detail to answer "does this match the prompt" not to rebuild
 * the scene.
 *
 * Format:
 *   Workspace
 *   ├ BasePart "Floor" size=(100,1,100) pos=(0,0,0) material=Grass color=(102,153,51)
 *   ├ Model "House"
 *   │   ├ BasePart "Wall_1" size=(10,8,1) pos=(5,4,0) material=Wood color=(139,90,43)
 *   │   ╰ BasePart "Roof" size=(12,1,12) pos=(5,8.5,0) material=Slate color=(85,85,85)
 *   ╰ Light "Sun"
 */
function flattenScene(nodes: SceneNode[] | undefined, maxLines: number = 120): {
  manifest: string
  partCount: number
  modelCount: number
  lightCount: number
  minY: number
  maxY: number
  truncated: boolean
} {
  if (!nodes || nodes.length === 0) {
    return { manifest: '(empty workspace)', partCount: 0, modelCount: 0, lightCount: 0, minY: 0, maxY: 0, truncated: false }
  }

  const lines: string[] = ['Workspace']
  let partCount = 0
  let modelCount = 0
  let lightCount = 0
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let truncated = false

  function fmt(n: number): string {
    return n.toFixed(1).replace(/\.0$/, '')
  }

  function walk(node: SceneNode, prefix: string, isLast: boolean): void {
    if (lines.length >= maxLines) {
      truncated = true
      return
    }

    const branch = isLast ? '╰' : '├'
    let line = `${prefix}${branch} ${node.className} "${node.name}"`

    if (node.className === 'Model') modelCount += 1
    else if (node.className === 'Light' || node.className.endsWith('Light')) lightCount += 1

    if (node.size) {
      line += ` size=(${fmt(node.size.X)},${fmt(node.size.Y)},${fmt(node.size.Z)})`
    }
    if (node.position) {
      line += ` pos=(${fmt(node.position.X)},${fmt(node.position.Y)},${fmt(node.position.Z)})`
      if (node.position.Y < minY) minY = node.position.Y
      if (node.position.Y > maxY) maxY = node.position.Y
      partCount += 1
    }
    if (node.material && node.material !== 'Plastic') {
      line += ` mat=${node.material.replace(/^Enum\.Material\./, '')}`
    }
    if (node.color) {
      const r = Math.round(node.color.R * 255)
      const g = Math.round(node.color.G * 255)
      const b = Math.round(node.color.B * 255)
      line += ` rgb=(${r},${g},${b})`
    }

    lines.push(line)

    if (node.children && node.children.length > 0) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ')
      node.children.forEach((child, idx) => {
        walk(child, childPrefix, idx === node.children!.length - 1)
      })
    }
  }

  nodes.forEach((root, idx) => {
    walk(root, '', idx === nodes.length - 1)
  })

  if (!isFinite(minY)) minY = 0
  if (!isFinite(maxY)) maxY = 0

  return {
    manifest: lines.join('\n'),
    partCount,
    modelCount,
    lightCount,
    minY,
    maxY,
    truncated,
  }
}

const SCENE_SYSTEM_PROMPT = `You are a Roblox QA agent. Given a structured scene manifest produced by a plugin that scanned the workspace after an AI-generated build, decide whether the build matches what the user asked for.

Rules:
- Flag only clear build failures, not style or polish.
- Flag: empty workspace when the prompt asked for objects, parts floating far above ground, parts below the floor (very negative Y), missing major features from the prompt, wrong scale by 10x or more, broken hierarchy (expected models missing).
- DO NOT flag: colour/material preferences, exact positioning, minor decorations, lighting choices, or anything the prompt didn't specify.

Return ONLY a JSON object, no markdown:
{"ok": boolean, "issues": string[], "confidence": number}

- ok=true means the build is usable
- issues: empty when ok=true, otherwise 1-5 short strings
- confidence: 0.0 to 1.0`

export interface PlaytestSceneResult extends PlaytestVisionResult {
  /** Parts/models/lights seen in the manifest — useful for empty-scene detection. */
  partCount?: number
  modelCount?: number
  lightCount?: number
}

/**
 * Analyse the semantic content of a workspace snapshot against the user's
 * prompt. This is the path the agentic loop uses in production — pixel
 * screenshots are unavailable from plugin context.
 *
 * Fail-soft: any provider error returns `{ ok: true, issues: [] }`.
 */
export async function analyzePlaytestScene(
  worldSnapshot: unknown,
  userPrompt: string,
): Promise<PlaytestSceneResult> {
  // Empty snapshot → nothing to analyse, don't fail the loop
  if (!worldSnapshot) {
    return { ok: true, issues: [], skippedReason: 'no_screenshot' }
  }

  const nodes = Array.isArray(worldSnapshot)
    ? (worldSnapshot as SceneNode[])
    : undefined
  if (!nodes) {
    return { ok: true, issues: [], skippedReason: 'parse_failed' }
  }

  const flat = flattenScene(nodes)

  // Empty-scene guard — if the prompt asked for objects and the workspace
  // has zero positioned parts, that's a deterministic failure we can flag
  // without even calling the LLM. Cheap + fast + always correct.
  const emptyLikely = flat.partCount === 0 && /\b(build|make|create|add|spawn|generate)\b/i.test(userPrompt)
  if (emptyLikely) {
    return {
      ok: false,
      issues: ['Workspace is empty — the generated code did not create any parts. The build did not run or errored silently.'],
      confidence: 0.95,
      partCount: 0,
      modelCount: 0,
      lightCount: 0,
    }
  }

  // Need at least one provider key to call the LLM; if absent, fail-soft
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return { ok: true, issues: [], skippedReason: 'no_api_key', partCount: flat.partCount, modelCount: flat.modelCount, lightCount: flat.lightCount }
  }

  const userMessage = `USER PROMPT:
"""
${userPrompt.slice(0, 800)}
"""

SCENE MANIFEST (${flat.partCount} parts, ${flat.modelCount} models, ${flat.lightCount} lights, Y range ${flat.minY.toFixed(1)} to ${flat.maxY.toFixed(1)}${flat.truncated ? ', truncated' : ''}):
${flat.manifest}

Does this scene match the user prompt? Return JSON only.`

  const messages: AIMessage[] = [{ role: 'user', content: userMessage }]

  let raw: string
  try {
    raw = await callAI(SCENE_SYSTEM_PROMPT, messages, {
      jsonMode: true,
      maxTokens: 400,
      temperature: 0.1,
    })
  } catch (err) {
    console.warn('[playtest-vision] scene analysis callAI failed', err)
    return { ok: true, issues: [], skippedReason: 'api_error', partCount: flat.partCount, modelCount: flat.modelCount, lightCount: flat.lightCount }
  }

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as Partial<PlaytestVisionResult>
    const ok = parsed.ok !== false
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((s): s is string => typeof s === 'string').slice(0, 5)
      : []
    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : undefined
    return {
      ok: ok && issues.length === 0,
      issues,
      confidence,
      partCount: flat.partCount,
      modelCount: flat.modelCount,
      lightCount: flat.lightCount,
    }
  } catch {
    console.warn('[playtest-vision] scene analysis non-JSON:', raw.slice(0, 200))
    return { ok: true, issues: [], skippedReason: 'parse_failed', partCount: flat.partCount, modelCount: flat.modelCount, lightCount: flat.lightCount }
  }
}
