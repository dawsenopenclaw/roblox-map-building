# TRACK 2: KNOWLEDGE CRAWL BEAST MODE — Paste into a fresh Claude Code window

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

I am Vyren. MAX AUTONOMY. Execute, commit, push. Never ask.

YOU ARE THE KNOWLEDGE CRAWLER. Your mission: systematically crawl, distill, and wire
the ENTIRE Roblox development knowledge base into ForjeGames' AI pipeline. When done,
our AI will know MORE about Roblox development than any competitor.

The goal: when a user says "build me a tycoon game", our AI should have access to
EVERY pattern, API, trick, and technique that top Roblox developers use — distilled
into compact knowledge files the AI can reference.

═══════════════════════════════════════════════════════════════════
PHASE 1: ROBLOX CREATOR HUB — Official API Documentation
═══════════════════════════════════════════════════════════════════

Use the Firecrawl MCP tools (firecrawl_scrape, firecrawl_crawl, firecrawl_map) to
systematically crawl create.roblox.com. This is the AUTHORITATIVE source.

CRAWL TARGETS (in priority order):

1. ENGINE API REFERENCE — Every Roblox class, property, method, event
   URL: https://create.roblox.com/docs/reference/engine
   What to extract: Class names, properties with types, methods with signatures,
   events, common usage patterns. Focus on classes the AI uses most:
   - Instance, BasePart, Part, MeshPart, Model, Folder
   - Workspace, Lighting, ReplicatedStorage, ServerScriptService, StarterGui
   - Players, Player, Character, Humanoid, HumanoidDescription
   - DataStoreService, DataStore, OrderedDataStore
   - TweenService, TweenInfo, Tween
   - PathfindingService, PathfindingModifier
   - UserInputService, ContextActionService
   - SoundService, Sound, SoundGroup
   - MarketplaceService, GamePassService
   - RemoteEvent, RemoteFunction, BindableEvent
   - PointLight, SpotLight, SurfaceLight, Atmosphere, Bloom
   - ParticleEmitter, Beam, Trail, Fire, Smoke
   - CollectionService, RunService, Debris
   - ProximityPrompt, ClickDetector, TouchDetector
   - VehicleSeat, Seat, BodyVelocity, LinearVelocity, AlignPosition
   - UICorner, UIStroke, UIGradient, UIListLayout, UIPadding, UIScale

2. SCRIPTING FUNDAMENTALS
   URL: https://create.roblox.com/docs/scripting
   Extract: Luau syntax, type system, coroutines, metatables, string manipulation,
   table operations, math library, task library, pcall/xpcall patterns

3. BUILDING & MODELING
   URL: https://create.roblox.com/docs/parts
   URL: https://create.roblox.com/docs/workspace
   Extract: Part manipulation, CFrame math, welding, constraints, unions,
   mesh importing, terrain API, material properties

4. UI DESIGN
   URL: https://create.roblox.com/docs/ui
   Extract: ScreenGui hierarchy, Frame/TextLabel/ImageLabel sizing,
   UDim2/UDim, auto-layout, responsive design, input handling

5. PHYSICS & CONSTRAINTS
   URL: https://create.roblox.com/docs/physics
   Extract: BodyMovers, constraints, ragdoll, vehicle physics, projectiles

6. NETWORKING & SECURITY
   URL: https://create.roblox.com/docs/scripting/networking
   Extract: RemoteEvent/RemoteFunction patterns, rate limiting,
   server authority, exploit prevention, replication

7. DATA PERSISTENCE
   URL: https://create.roblox.com/docs/cloud-services/data-stores
   Extract: DataStore patterns, session locking, ordered data stores,
   memory stores, budget management, serialization

8. AUDIO & EFFECTS
   URL: https://create.roblox.com/docs/sound
   URL: https://create.roblox.com/docs/effects
   Extract: Sound properties, spatial audio, particle systems,
   lighting effects, post-processing

PROCESSING RULES:
- Scrape each URL section
- Distill into a knowledge file at src/lib/ai/crawled-knowledge/
- Format: exported const strings with section headers
- Keep each file under 50KB (trim examples, keep API signatures + patterns)
- Wire into knowledge-selector.ts with appropriate keywords

═══════════════════════════════════════════════════════════════════
PHASE 2: DEVFORUM TOP POSTS — Community Wisdom
═══════════════════════════════════════════════════════════════════

Crawl devforum.roblox.com for the highest-value posts. Focus on:

1. RESOURCES CATEGORY (tutorials with code)
   URL: https://devforum.roblox.com/c/resources/community-resources/73
   Filter: Posts with 50+ likes, tagged as tutorials
   Extract: Complete code examples, patterns, techniques

2. SCRIPTING SUPPORT — SOLVED
   URL: https://devforum.roblox.com/c/help-and-feedback/scripting-support/54
   Filter: Posts marked as Solution with 20+ likes
   Extract: Common problems + solutions, anti-patterns, best practices

3. BUILDING SUPPORT
   URL: https://devforum.roblox.com/c/help-and-feedback/building-support/55
   Filter: Posts with solutions
   Extract: Building techniques, material tips, optimization

4. COOL CREATIONS (what top builders make)
   URL: https://devforum.roblox.com/c/resources/community-tutorials/46
   Extract: Advanced techniques, showcase patterns

PROCESSING RULES:
- For each high-value post, extract the code blocks and key insights
- Group by topic (combat systems, inventory, UI, building, etc.)
- Create knowledge files like: devforum-combat-patterns.ts, devforum-ui-patterns.ts
- Each file: exported const with distilled patterns (not raw forum posts)
- Wire into knowledge-selector.ts

═══════════════════════════════════════════════════════════════════
PHASE 3: GITHUB OPEN-SOURCE ROBLOX GAMES
═══════════════════════════════════════════════════════════════════

Search GitHub for open-source Roblox game code:

Search queries:
- "roblox game" language:lua stars:>50
- "roblox tycoon" language:lua
- "roblox obby" language:lua
- "roblox combat system" language:lua
- "roblox datastore" language:lua

For each quality repo:
- Read the main game scripts
- Extract reusable patterns (not full games)
- Distill into pattern files

═══════════════════════════════════════════════════════════════════
PHASE 4: WIRE EVERYTHING
═══════════════════════════════════════════════════════════════════

After each crawl batch:
1. Create knowledge file in src/lib/ai/crawled-knowledge/
2. Add to knowledge-selector.ts SECTIONS array with keywords
3. Type-check: npx tsc -p tsconfig.spotcheck.json
4. Commit and push
5. Verify: curl -s -o /dev/null -w "%{http_code}" https://forjegames.com/

═══════════════════════════════════════════════════════════════════
EXECUTION STRATEGY
═══════════════════════════════════════════════════════════════════

Launch in batches of 2 background agents (crash prevention):

BATCH 1: Engine API (Classes A-L) + Engine API (Classes M-Z)
BATCH 2: Scripting Fundamentals + UI Design
BATCH 3: Physics/Constraints + Networking/Security
BATCH 4: Data Persistence + Audio/Effects
BATCH 5: DevForum Resources + DevForum Scripting Support
BATCH 6: GitHub patterns + Wire everything

Each agent:
1. Use firecrawl_scrape or web_fetch to get the page content
2. Extract the valuable parts (API signatures, code examples, patterns)
3. Write a knowledge file
4. Wire into knowledge-selector.ts

IMPORTANT:
- Use firecrawl_scrape for structured extraction from docs sites
- Use web_fetch for individual forum posts
- Use tavily_search or web_search to find the best DevForum posts
- Keep each knowledge file COMPACT — distilled patterns, not raw HTML
- Max 2 background agents at once
- Save session handoff every 30 min

YOU ARE THE KNOWLEDGE CRAWLER. Make our AI know EVERYTHING about Roblox.
By the end, "build me a tycoon" should produce code that uses EVERY best practice
from the official docs, DevForum solutions, and open-source games. GO.
```
