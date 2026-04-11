/**
 * GET /api/templates/list
 *
 * Returns the public catalog of built-in game templates for the marketplace
 * gallery UI. Lightweight (no script source, just metadata).
 *
 * Auth: none — the catalog itself is public so unauthenticated visitors can
 * browse the marketplace before signing in. Actual template installation
 * requires auth and costs credits; see /api/templates/load.
 */

import { NextResponse } from 'next/server'
import { listTemplateCatalog, TEMPLATE_LOAD_COST_CREDITS } from '@/lib/game-templates'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const templates = listTemplateCatalog()
  return NextResponse.json(
    {
      ok: true,
      count: templates.length,
      priceCredits: TEMPLATE_LOAD_COST_CREDITS,
      templates,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    },
  )
}
