/**
 * GET /api/ai/icon/presets
 *
 * Returns the full catalogue of Icon Studio presets grouped by category so
 * the client can render a tabbed gallery without bundling the preset file.
 *
 * Public — no auth required (catalogue is not user-specific).
 */

import { NextResponse } from 'next/server'

import {
  ICON_PRESETS,
  getPresetsByCategory,
  type IconCategory,
  type IconPreset,
} from '@/lib/icon-studio/icon-presets'
import { ICON_GENERATION_COST } from '@/lib/icon-studio/icon-pipeline'

export const runtime = 'nodejs'
export const revalidate = 300 // 5 minutes — presets are static

interface PresetCardPayload {
  id: string
  name: string
  description: string
  category: IconCategory
  composition: IconPreset['composition']
  background: IconPreset['background']
  qualityTier: IconPreset['qualityTier']
  colorPalette: string[]
}

function toCard(p: IconPreset): PresetCardPayload {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    composition: p.composition,
    background: p.background,
    qualityTier: p.qualityTier,
    colorPalette: p.colorPalette,
  }
}

export async function GET(): Promise<NextResponse> {
  const grouped = getPresetsByCategory()
  const categories = (
    Object.keys(grouped) as IconCategory[]
  ).map((category) => ({
    category,
    label: category[0].toUpperCase() + category.slice(1),
    presets: grouped[category].map(toCard),
  }))

  return NextResponse.json({
    total: ICON_PRESETS.length,
    costPerIcon: ICON_GENERATION_COST,
    categories,
  })
}
