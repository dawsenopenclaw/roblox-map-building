/**
 * VERIFIED curated source list for the video → RAG ingest pipeline.
 *
 * Every handle below has been validated via yt-dlp — dead handles removed.
 * ONLY game dev / Blender 3D / Roblox channels. No general tech, no SaaS
 * business advice, no CrashCourse geology.
 *
 * Categories MUST match the categories build-planner.ts queries:
 *   pattern | building | service | blender | dev
 */

export interface CuratedChannel {
  handle: string
  defaultCategory: 'pattern' | 'building' | 'service' | 'blender' | 'dev'
  notes?: string
  priority?: 'high' | 'medium' | 'low'
}

export const CURATED: CuratedChannel[] = [
  // ── Roblox scripting / development (VERIFIED HANDLES) ─────────────────────
  { handle: 'AlvinBlox',        defaultCategory: 'service',  priority: 'high',
    notes: 'Beginner Roblox scripting, full game tutorials. 493K subs.' },
  { handle: 'TheDevKing',       defaultCategory: 'service',  priority: 'high',
    notes: 'Service deep dives — DataStore, Tween, Pathfinding, RemoteEvents.' },
  { handle: 'GnomeCode',        defaultCategory: 'pattern',  priority: 'high',
    notes: 'Tycoon, simulator, obby game walkthroughs. High signal.' },
  { handle: 'SuphiKaner',       defaultCategory: 'service',  priority: 'high',
    notes: 'Advanced: OOP, ProfileService, Knit-style frameworks.' },
  { handle: 'okeanskiy',        defaultCategory: 'service',  priority: 'medium',
    notes: 'OOP patterns, modules, Roblox performance.' },

  // Discovered + validated Roblox channels
  { handle: 'RoBuilder',        defaultCategory: 'building', priority: 'high',
    notes: 'Roblox building tutorials. 381K subs. Verified via discovery.' },
  { handle: 'RoDev',            defaultCategory: 'service',  priority: 'high',
    notes: 'Roblox dev tutorials. 345K subs. Verified.' },
  { handle: 'SmartyRBX',        defaultCategory: 'service',  priority: 'medium',
    notes: 'Roblox scripting. 151K subs. Verified.' },
  { handle: 'BrawlDev',         defaultCategory: 'service',  priority: 'medium',
    notes: 'Roblox game dev. 183K subs. Verified.' },
  { handle: 'DeHapy',           defaultCategory: 'pattern',  priority: 'medium',
    notes: 'Roblox dev. 153K subs. Verified.' },
  { handle: 'BinzuDev',         defaultCategory: 'service',  priority: 'medium',
    notes: 'Roblox scripting. 46K subs. Verified.' },
  { handle: 'CodeBro29',        defaultCategory: 'service',  priority: 'medium',
    notes: 'Roblox scripting. 118K subs. Verified.' },

  // ── Blender for game assets (VERIFIED HANDLES) ───────────────────────────
  { handle: 'blenderguru',      defaultCategory: 'blender',  priority: 'high',
    notes: 'Donut tutorial, materials, lighting. 3.4M subs. THE Blender channel.' },
  { handle: 'DefaultCube',      defaultCategory: 'blender',  priority: 'medium',
    notes: 'Modeling philosophy, geometry nodes. Verified.' },
  { handle: 'JoeyCarlino',      defaultCategory: 'blender',  priority: 'medium',
    notes: 'Stylized characters, weight painting.' },
  { handle: 'Brackeys',         defaultCategory: 'dev',      priority: 'high',
    notes: 'Engine-agnostic game dev patterns. 1.9M subs. Channel paused but archive is gold.' },
  { handle: 'Imphenzia',        defaultCategory: 'blender',  priority: 'high',
    notes: 'Low-poly game asset modeling. 300K subs. Perfect for Roblox mesh workflow.' },

  // Discovered + validated Blender channels
  { handle: 'GrantAbbitt',      defaultCategory: 'blender',  priority: 'high',
    notes: 'Game-asset focused — low-poly, UV, export. 613K subs. Channel URL: youtube.com/channel/<id>' },
  { handle: 'RyanKingArt',      defaultCategory: 'blender',  priority: 'medium',
    notes: 'Hard surface modeling. 377K subs.' },
  { handle: 'PolygonRunway',    defaultCategory: 'blender',  priority: 'medium',
    notes: 'Blender tutorials. 535K subs.' },

  // ── Game design (VERIFIED) ────────────────────────────────────────────────
  { handle: 'GameMakersToolkit', defaultCategory: 'dev',      priority: 'high',
    notes: 'Mark Brown — game design analysis. 1.7M subs. GMTK.' },
]

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  console.table(CURATED.map((c) => ({ handle: c.handle, category: c.defaultCategory, priority: c.priority })))
  console.log(`\nTotal: ${CURATED.length} channels (all verified).`)
}
