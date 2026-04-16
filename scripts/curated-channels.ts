/**
 * Curated source list for the video → RAG ingest pipeline.
 *
 * Categories MUST match the categories build-planner.ts queries:
 *   pattern | building | service | blender | dev
 *
 * This file is the single source of truth for "what we trust the AI to learn from."
 * Add/remove channels as needed. To bulk-ingest a channel:
 *
 *   npx tsx scripts/ingest-channel.ts "@AlvinBlox" --limit=20
 *
 * Or run the whole curated set with the runner:
 *
 *   npx tsx scripts/ingest-curated.ts [--per-channel=10]
 */

export interface CuratedChannel {
  handle: string         // YouTube @handle (without @) or full URL
  defaultCategory: 'pattern' | 'building' | 'service' | 'blender' | 'dev'
  notes?: string
  // If true, channel is high signal — ingest more videos by default.
  priority?: 'high' | 'medium' | 'low'
}

export const CURATED: CuratedChannel[] = [
  // ── Roblox dev / scripting ────────────────────────────────────────────────
  { handle: 'AlvinBlox',        defaultCategory: 'pattern',  priority: 'high',
    notes: 'Beginner-friendly full game tutorials, scripting basics' },
  { handle: 'TheDevKing',       defaultCategory: 'service',  priority: 'high',
    notes: 'Service-by-service deep dives (DataStore, Tween, Pathfinding, etc.)' },
  { handle: 'GnomeCode',        defaultCategory: 'pattern',  priority: 'high',
    notes: 'Game design walkthroughs, tycoons, simulators' },
  { handle: 'BRiceyplays',      defaultCategory: 'pattern',  priority: 'medium',
    notes: 'Game design discussion, monetization' },
  { handle: 'SuphiKaner',       defaultCategory: 'service',  priority: 'high',
    notes: 'Advanced patterns: OOP, RemoteEvents, ProfileService' },
  { handle: 'Roblox',           defaultCategory: 'service',  priority: 'high',
    notes: 'Official Roblox dev channel — DevHub videos, RDC talks' },
  { handle: 'Stratiz',          defaultCategory: 'service',  priority: 'medium',
    notes: 'Knit framework, advanced architecture' },
  { handle: 'okeanskiy',        defaultCategory: 'service',  priority: 'medium',
    notes: 'OOP, modules, performance' },
  { handle: 'CodingWithAlvin',  defaultCategory: 'building', priority: 'medium',
    notes: 'Building tutorials separated from scripting' },

  // ── Roblox studio / building / lighting ───────────────────────────────────
  { handle: 'BloxianStudios',   defaultCategory: 'building', priority: 'medium',
    notes: 'Lighting, atmosphere, terrain workflows' },

  // ── Blender — modeling, materials, export ────────────────────────────────
  { handle: 'blenderguru',      defaultCategory: 'blender',  priority: 'high',
    notes: 'Donut tutorial + materials, lighting fundamentals' },
  { handle: 'CGCookie',         defaultCategory: 'blender',  priority: 'high',
    notes: 'Hard-surface modeling, retopology, rigging' },
  { handle: 'DefaultCube',      defaultCategory: 'blender',  priority: 'medium',
    notes: 'Modeling philosophy, geometry nodes' },
  { handle: 'GrantAbbitt',      defaultCategory: 'blender',  priority: 'high',
    notes: 'Game-asset focused — low-poly, UV, export to engines' },
  { handle: 'JoeyCarlino',      defaultCategory: 'blender',  priority: 'medium',
    notes: 'Stylized characters, weight painting' },

  // ── General game dev / design ────────────────────────────────────────────
  { handle: 'GameMakersToolkit', defaultCategory: 'dev', priority: 'high',
    notes: 'Game design analysis — Mark Brown' },
  { handle: 'AdamMillard-ArchitectofGames', defaultCategory: 'dev', priority: 'medium',
    notes: 'Mechanics design, player psychology' },
  { handle: 'Brackeys',         defaultCategory: 'dev',      priority: 'medium',
    notes: 'Engine-agnostic patterns (paused channel but archive is gold)' },
]

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  console.table(CURATED.map((c) => ({ handle: c.handle, category: c.defaultCategory, priority: c.priority })))
  console.log(`\nTotal: ${CURATED.length} channels.`)
  console.log(`To ingest a channel: npx tsx scripts/ingest-channel.ts "@${CURATED[0].handle}" --limit=10`)
}
