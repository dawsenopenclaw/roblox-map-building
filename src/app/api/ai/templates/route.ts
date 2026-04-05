/**
 * GET  /api/ai/templates        — list templates (filter by ?intent=terrain&limit=10)
 * POST /api/ai/templates        — create template from a successful conversation
 * GET  /api/ai/templates/popular — top 10 across all categories
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseBody } from '@/lib/validations'
import { z } from 'zod'
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
  'animation', 'analytics', 'marketplace', 'team', 'optimization', 'fullgame', 'general',
])

function isValidIntent(s: string): s is Intent {
  return VALID_INTENTS.has(s as Intent)
}

// ---------------------------------------------------------------------------
// Zod schema for POST body
// ---------------------------------------------------------------------------

const createTemplateSchema = z.object({
  name:         z.string().min(3, 'name min 3 chars').max(80).transform((s) => s.trim()),
  description:  z.string().min(10, 'description min 10 chars').max(200).transform((s) => s.trim()),
  prompt:       z.string().min(10, 'prompt min 10 chars').max(2000).transform((s) => s.trim()),
  intent:       z.string().refine((s) => isValidIntent(s), {
    message: `intent must be one of: ${Array.from(VALID_INTENTS).join(', ')}`,
  }).optional(),
  sourcePrompt: z.string().max(500).optional(),
  quality:      z.number().min(0).max(1).optional(),
})

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const parsed = await parseBody(req, createTemplateSchema)
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status })
  }

  const { name, description, prompt, intent: intentParam, sourcePrompt, quality } = parsed.data

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
