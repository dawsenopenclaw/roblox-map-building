/**
 * POST /api/ai/analyze-image
 *
 * Sends an uploaded image to Gemini Vision (gemini-2.0-flash) for structured
 * analysis, then returns a JSON payload describing the Roblox-relevant
 * characteristics found in the image.
 *
 * Body (multipart/form-data OR application/json):
 *   - image (File)   — raw file upload
 *   - base64 (string) — data URI or raw base64
 *   - mimeType (string) — required when sending base64 without data URI prefix
 *   - styleTransfer (boolean) — true = extract style/palette only, skip terrain
 *
 * Returns: ImageAnalysisResult
 */

import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageAnalysisResult {
  /** High-level theme detected, e.g. "medieval castle", "tropical beach", "sci-fi city" */
  theme: string
  /** Art style, e.g. "cartoon", "realistic", "low-poly", "anime" */
  style: string
  /** Primary colour palette — hex strings */
  colors: string[]
  /** Roblox material names inferred from surfaces */
  materials: string[]
  /** Objects / structures visible in the image */
  objects: string[]
  /** Lighting mood, e.g. "warm daylight", "dramatic sunset", "dark dungeon" */
  lighting: string
  /** Relative scale hint for the largest structure visible */
  scale: 'small' | 'medium' | 'large' | 'massive'
  /** Free-form summary Gemini produced */
  summary: string
  /** For style transfer: game/map the image is from, if detectable */
  sourceGame?: string
  /** Confidence 0-1 */
  confidence: number
}

// ---------------------------------------------------------------------------
// Gemini REST call
// ---------------------------------------------------------------------------

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const ANALYSIS_PROMPT = `You are a Roblox game developer analyzing a reference image to replicate its visual style in Roblox Studio.

Analyze the image and return ONLY a valid JSON object with exactly this shape (no markdown, no prose):
{
  "theme": string,         // e.g. "medieval castle", "tropical beach", "sci-fi city", "fantasy forest"
  "style": string,         // e.g. "cartoon", "realistic", "low-poly", "pastel cartoon", "anime"
  "colors": string[],      // 4-8 dominant hex color codes e.g. ["#8B4513", "#D2B48C", "#228B22"]
  "materials": string[],   // Roblox material names: Cobblestone, SmoothPlastic, Wood, WoodPlanks, Grass, Sand, Marble, Glass, Neon, Metal, Concrete, Slate, Ice, Rock, Brick, Foil
  "objects": string[],     // 5-15 objects/structures/features visible: e.g. ["stone towers", "drawbridge", "moat", "battlements", "torches"]
  "lighting": string,      // e.g. "warm golden hour", "cool blue moonlight", "bright cartoon daylight", "dark orange dungeon glow"
  "scale": string,         // one of: "small", "medium", "large", "massive"
  "summary": string,       // 1-2 sentence human-readable description of what to build
  "sourceGame": string,    // if this is a Roblox game screenshot, name the game (Adopt Me, Blox Fruits, etc.) else ""
  "confidence": number     // 0.0 to 1.0
}

Rules:
- colors must be valid hex codes with # prefix
- materials must only be valid Roblox Enum.Material names
- scale: small=under 30 studs, medium=30-100, large=100-300, massive=300+
- If this is a style-transfer screenshot from Adopt Me or similar, focus on color palette and cartoon proportions
- Never return anything outside the JSON object`

async function callGeminiVision(
  base64Data: string,
  mimeType: string
): Promise<ImageAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          { text: ANALYSIS_PROMPT },
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

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message: string }
  }

  if (json.error) throw new Error(`Gemini error: ${json.error.message}`)

  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()

  let parsed: ImageAnalysisResult
  try {
    parsed = JSON.parse(cleaned) as ImageAnalysisResult
  } catch {
    throw new Error(`Gemini returned non-JSON: ${rawText.slice(0, 200)}`)
  }

  // Normalize scale to union type
  const validScales = ['small', 'medium', 'large', 'massive'] as const
  if (!validScales.includes(parsed.scale as never)) {
    parsed.scale = 'medium'
  }

  return parsed
}

// ---------------------------------------------------------------------------
// Demo fallback
// ---------------------------------------------------------------------------

function buildDemoAnalysis(filename: string): ImageAnalysisResult {
  return {
    theme: 'medieval castle',
    style: 'realistic',
    colors: ['#6B6B6B', '#4A4A4A', '#8B7355', '#D4AF37', '#2C4A1E'],
    materials: ['Cobblestone', 'Slate', 'WoodPlanks', 'Stone'],
    objects: ['towers', 'battlements', 'drawbridge', 'moat', 'arrow slits', 'torches', 'courtyard'],
    lighting: 'warm golden hour',
    scale: 'large',
    summary: `Demo analysis for "${filename}". Configure GEMINI_API_KEY to enable real Gemini Vision analysis.`,
    sourceGame: '',
    confidence: 0.5,
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    let base64Data: string
    let mimeType: string

    if (contentType.includes('multipart/form-data')) {
      // File upload via form
      const form = await req.formData()
      const file = form.get('image')

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'image file is required' }, { status: 400 })
      }

      mimeType = file.type || 'image/jpeg'
      const arrayBuffer = await file.arrayBuffer()
      base64Data = Buffer.from(arrayBuffer).toString('base64')
    } else {
      // JSON body with base64 string
      const body = (await req.json()) as {
        base64?: string
        mimeType?: string
      }

      if (!body.base64) {
        return NextResponse.json({ error: 'base64 image data is required' }, { status: 400 })
      }

      // Handle data URI prefix (data:image/png;base64,...)
      if (body.base64.startsWith('data:')) {
        const [header, data] = body.base64.split(',')
        base64Data = data
        mimeType = header.replace('data:', '').replace(';base64', '')
      } else {
        base64Data = body.base64
        mimeType = body.mimeType ?? 'image/jpeg'
      }
    }

    // Validate supported image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${mimeType}. Use JPEG, PNG, WebP, or GIF.` },
        { status: 400 }
      )
    }

    // Cap image size at 4MB (base64 is ~33% larger than raw)
    if (base64Data.length > 5_500_000) {
      return NextResponse.json(
        { error: 'Image too large. Maximum 4MB.' },
        { status: 413 }
      )
    }

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY)

    if (!hasGeminiKey) {
      return NextResponse.json(buildDemoAnalysis('uploaded-image'))
    }

    const analysis = await callGeminiVision(base64Data, mimeType)
    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-image] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
