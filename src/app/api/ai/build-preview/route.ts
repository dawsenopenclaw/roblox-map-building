/**
 * POST /api/ai/build-preview
 *
 * Generates 3 quick build concept options for the user to choose from
 * before full code generation. Uses a fast model (Groq) for speed.
 *
 * Body: { prompt: string }
 * Returns: { options: BuildPreviewOption[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { callAI, type AIMessage } from '@/lib/ai/provider'

export const maxDuration = 30

interface BuildPreviewOption {
  name: string
  description: string
  features: string[]
  materials: string[]
  estimatedParts: number
  style: string
}

const CONCEPT_PROMPT = `You are a Roblox game environment designer. Given the user's build request, generate exactly 3 different concept options. Each should be a distinct interpretation or style variation.

Return ONLY a valid JSON array with exactly 3 objects. No markdown, no explanation, just the JSON array.

Each object must have these fields:
- "name": string (short creative name, 3-5 words)
- "description": string (2-3 sentences describing the build, what makes it unique)
- "features": string[] (5-8 key elements/objects that will be built)
- "materials": string[] (4-6 Roblox materials that fit the theme — NEVER use SmoothPlastic)
- "estimatedParts": number (realistic estimate of Roblox parts needed, minimum 30 for builds, 0 for scripts)
- "style": string (one of: "detailed", "low-poly", "realistic", "stylized", "cozy", "epic", "minimal", "complex")

Make each option genuinely different:
- Option 1: The faithful interpretation — exactly what the user probably imagined
- Option 2: A creative twist — same theme but with an unexpected angle or extra feature
- Option 3: The ambitious version — larger scale, more detail, more atmosphere

This works for ALL types of Roblox content:
- BUILDS/MAPS: Use real materials (Concrete, Wood, WoodPlanks, Brick, Slate, Granite, Metal, Glass, Grass, LeafyGrass, Sand, Fabric, Cobblestone, Marble, Asphalt, DiamondPlate, Rock, Ice, Snow, Sandstone, Limestone, Pavement, Pebble, Mud, CorrodedMetal, Neon only for glowing, CrackedLava). Features = physical objects.
- SCRIPTS: Features = game mechanics, systems, interactions. Materials field = relevant services (DataStoreService, Players, ReplicatedStorage, etc.). estimatedParts = 0.
- TERRAIN: Features = biomes, elevation, water features. Materials = terrain materials (Grass, Sand, Rock, Snow, Mud, etc.). estimatedParts = terrain resolution.
- FULL GAMES: Features = core gameplay loops, UI, progression. Mix of build + script features.`

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { prompt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 422 })
  }

  const messages: AIMessage[] = [
    { role: 'user', content: `Generate 3 build concepts for: "${prompt}"` },
  ]

  try {
    const raw = await callAI(CONCEPT_PROMPT, messages, {
      maxTokens: 2048,
      codeMode: false,
    })

    // Extract JSON array from the response
    let options: BuildPreviewOption[] = []
    try {
      // Try to find a JSON array in the response
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        options = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If parsing fails, return a structured error
      return NextResponse.json({ error: 'Failed to parse concept options', raw: raw.slice(0, 500) }, { status: 500 })
    }

    // Validate and sanitize
    options = options.slice(0, 3).map((opt, i) => ({
      name: String(opt.name || `Option ${i + 1}`).slice(0, 100),
      description: String(opt.description || '').slice(0, 500),
      features: Array.isArray(opt.features) ? opt.features.slice(0, 8).map(String) : [],
      materials: Array.isArray(opt.materials) ? opt.materials.slice(0, 6).map(String).filter(m => m !== 'SmoothPlastic') : [],
      estimatedParts: Math.max(30, Number(opt.estimatedParts) || 40),
      style: ['detailed', 'low-poly', 'realistic', 'stylized', 'cozy', 'epic'].includes(opt.style) ? opt.style : 'detailed',
    }))

    // Ensure we always have 3 options
    while (options.length < 3) {
      options.push({
        name: `Variation ${options.length + 1}`,
        description: `A ${options.length === 1 ? 'creative' : 'ambitious'} take on "${prompt}"`,
        features: ['Detailed structure', 'Custom lighting', 'Terrain integration'],
        materials: ['Concrete', 'Wood', 'Brick', 'Glass'],
        estimatedParts: 40 + options.length * 20,
        style: 'detailed',
      })
    }

    return NextResponse.json({ options })
  } catch (err) {
    console.error('[BuildPreview] Generation failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate concepts' },
      { status: 500 },
    )
  }
}
