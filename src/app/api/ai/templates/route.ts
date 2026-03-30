/**
 * GET  /api/ai/templates        — list templates (filter by ?intent=terrain&limit=10)
 * POST /api/ai/templates        — create template from a successful conversation
 * GET  /api/ai/templates/popular — top 10 across all categories
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  suggestTemplates,
  getTemplatesByCategory,
  getPopularTemplates,
  createTemplateFromConversation,
  exportTemplates,
  type Template,
} from '@/lib/ai/template-generator'
import { classifyIntent, type Intent } from '@/lib/ai/intent-classifier'

// ---------------------------------------------------------------------------
// Valid intents guard
// ---------------------------------------------------------------------------

const VALID_INTENTS = new Set<Intent>([
  'terrain', 'building', 'npc', 'script', 'ui', 'audio', 'lighting',
  'economy', 'quest', 'combat', 'vehicle', 'particle', 'mesh', 'texture',
  'animation', 'analytics', 'marketplace', 'team', 'optimization', 'general',
])

function isValidIntent(s: string): s is Intent {
  return VALID_INTENTS.has(s as Intent)
}

// ---------------------------------------------------------------------------
// GET /api/ai/templates
// Query params:
//   intent=terrain    — filter by intent
//   mode=suggest      — suggest based on intent (ranked by relevance)
//   mode=category     — all templates in category, sorted by rating
//   mode=popular      — top 10 globally
//   limit=5           — max results (default 5, max 20)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const intentParam = searchParams.get('intent') ?? ''
  const mode = searchParams.get('mode') ?? 'suggest'
  const limitParam = parseInt(searchParams.get('limit') ?? '5', 10)
  const limit = Math.min(20, Math.max(1, isNaN(limitParam) ? 5 : limitParam))

  let templates: Template[]

  if (mode === 'popular') {
    templates = getPopularTemplates(limit)
  } else if (mode === 'all') {
    templates = exportTemplates().slice(0, limit)
  } else if (intentParam && isValidIntent(intentParam)) {
    templates = mode === 'category'
      ? getTemplatesByCategory(intentParam).slice(0, limit)
      : suggestTemplates(intentParam, limit)
  } else {
    // No intent specified — return popular
    templates = getPopularTemplates(limit)
  }

  return NextResponse.json({
    templates: templates.map(sanitizeTemplate),
    count: templates.length,
    intent: intentParam || null,
    mode,
  })
}

// ---------------------------------------------------------------------------
// POST /api/ai/templates
// Body: { name, description, prompt, intent?, sourcePrompt?, quality? }
//
// If intent is not provided, it is auto-classified from sourcePrompt or prompt.
// ---------------------------------------------------------------------------

interface CreateTemplateBody {
  name: string
  description: string
  prompt: string
  intent?: string
  sourcePrompt?: string
  quality?: number
}

function validateCreateBody(body: unknown): { valid: true; data: CreateTemplateBody } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Body must be a JSON object' }
  }
  const b = body as Record<string, unknown>

  if (typeof b.name !== 'string' || b.name.trim().length < 3) {
    return { valid: false, error: 'name is required (min 3 chars)' }
  }
  if (typeof b.description !== 'string' || b.description.trim().length < 10) {
    return { valid: false, error: 'description is required (min 10 chars)' }
  }
  if (typeof b.prompt !== 'string' || b.prompt.trim().length < 10) {
    return { valid: false, error: 'prompt is required (min 10 chars)' }
  }
  if (b.intent !== undefined && !isValidIntent(b.intent as string)) {
    return { valid: false, error: `intent must be one of: ${Array.from(VALID_INTENTS).join(', ')}` }
  }
  if (b.quality !== undefined) {
    const q = Number(b.quality)
    if (isNaN(q) || q < 0 || q > 1) {
      return { valid: false, error: 'quality must be a number between 0 and 1' }
    }
  }

  return {
    valid: true,
    data: {
      name: (b.name as string).trim().slice(0, 80),
      description: (b.description as string).trim().slice(0, 200),
      prompt: (b.prompt as string).trim().slice(0, 2000),
      intent: b.intent as string | undefined,
      sourcePrompt: typeof b.sourcePrompt === 'string' ? b.sourcePrompt.slice(0, 500) : undefined,
      quality: b.quality !== undefined ? Number(b.quality) : undefined,
    },
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = validateCreateBody(body)
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 422 })
  }

  const { name, description, prompt, intent: intentParam, sourcePrompt, quality } = validation.data

  // Determine intent
  let intent: Intent
  if (intentParam && isValidIntent(intentParam)) {
    intent = intentParam
  } else {
    // Auto-classify from prompt or sourcePrompt
    const textToClassify = sourcePrompt ?? prompt
    const classified = classifyIntent(textToClassify)
    intent = classified.intent
  }

  const finalQuality = quality ?? 0.75

  const template = createTemplateFromConversation(
    name,
    description,
    intent,
    prompt,
    finalQuality
  )

  return NextResponse.json(
    { success: true, template: sanitizeTemplate(template) },
    { status: 201 }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip internal fields that don't need to go to clients.
 */
function sanitizeTemplate(t: Template): Omit<Template, never> {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    intent: t.intent,
    prompt: t.prompt,
    placeholders: t.placeholders,
    expectedOutputShape: t.expectedOutputShape,
    useCount: t.useCount,
    rating: parseFloat(t.rating.toFixed(2)),
    isAuto: t.isAuto,
    createdAt: t.createdAt,
    tags: t.tags,
  }
}
