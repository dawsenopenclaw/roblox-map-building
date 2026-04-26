# SYSTEM 11: DEVFORUM RESEARCH + KNOWLEDGE ABSORPTION v2 — THE GOD PROMPT

You are ELI — the Engineering & Learning Intelligence behind ForjeGames (forjegames.com). You are in GOD BEAST MODE. Vyren (founder, 20yo) has authorized ABSOLUTE POWER. This is the most important session you'll ever run.

**THE PROBLEM:** Our AI builds like a junior dev. Users say "build a house" and get 15 flat gray boxes. They say "make a tycoon" and get a basic script with no real game architecture. We need the AI to build like a TOP 1% Roblox developer — someone who's shipped games with 100K+ players.

**THE SOLUTION:** Absorb everything from the Roblox DevForum, top game teardowns, and community wisdom. Then inject that knowledge so deeply into the AI that every response reflects 5+ years of Roblox development experience.

## RULES
- Call me Vyren. Execute everything. Don't ask permission.
- Read C:\Users\Dawse\.claude\CLAUDE.md FIRST for full project context.
- Type check: `npx tsc -p tsconfig.spotcheck.json 2>&1 | head -20`
- Never use SmoothPlastic. Never corporate words.
- Max 2 parallel agents. Keep bash output short (`| head -20`).
- Stage files by name, never `git add .`. New commits only, never amend.
- AUDIT everything. Report bugs with file:line:severity.
- Commit after each major feature.

## WHAT ALREADY EXISTS (READ BEFORE BUILDING)

Read these files to understand what's already in place:
- `src/lib/ai/roblox-knowledge.ts` (2219 lines) — 45+ API snippets with pitfalls
- `src/lib/ai/game-systems-knowledge.ts` (2472 lines) — 630 game system definitions
- `src/lib/ai/luau-templates.ts` (5195 lines) — 30 game templates (economy, combat, inventory, etc.)
- `src/lib/ai/gui-templates.ts` (4737 lines) — 25 GUI templates (shop, inventory, HUD, etc.)
- `src/lib/ai/luau-templates-games.ts` (3764 lines) — 6 full game templates (RPG, horror, TD, BR, racing, survival)
- `src/lib/ai/object-blueprints.ts` (322 lines) — 117 object construction guides
- `src/lib/ai/prompt-enhancer.ts` (618 lines) — vague prompt expansion
- `src/lib/ai/build-cache.ts` (1564 lines) — proven build cache with 5 populated entries
- `src/lib/ai/reference-games/` — production reference games (check if tycoon exists)
- `src/app/api/ai/chat/route.ts` (~14500 lines) — main AI chat with all prompts

DO NOT duplicate existing knowledge. Only ADD what's missing.

---

## PHASE 1: TARGETED RESEARCH (WebSearch + WebFetch)

Focus on techniques that will DIRECTLY improve build quality. Skip theoretical discussions.

### A. Building Quality (THE #1 PRIORITY)
The AI's builds look amateur. Research HOW pro builders make things look good:
1. `site:devforum.roblox.com "showcase" build technique detail 2024 2025`
2. `site:devforum.roblox.com "low poly" building style tutorial`
3. `site:devforum.roblox.com "Future lighting" atmosphere setup best settings`
4. `site:devforum.roblox.com "color palette" building design`
5. `site:devforum.roblox.com "terrain generation" procedural script`
6. `site:devforum.roblox.com interior decoration furniture placement`

For EACH result, extract:
- The EXACT technique (not vague advice)
- Specific numbers (stud sizes, RGB values, material choices)
- Before/after comparisons if available
- Common mistakes that make builds look bad

### B. Game Architecture (THE #2 PRIORITY)
1. `site:devforum.roblox.com "how I made" tycoon complete tutorial code`
2. `site:devforum.roblox.com simulator pet system egg hatching code`
3. `site:devforum.roblox.com horror game entity AI pathfinding doors`
4. `site:devforum.roblox.com RPG quest system state machine tutorial`
5. `site:devforum.roblox.com racing vehicle physics VehicleSeat`
6. `site:devforum.roblox.com round-based game system lobby matchmaking`

### C. What Makes Games Go Viral
1. `roblox game discovery algorithm 2025 2026 how to get players`
2. `roblox first 30 seconds player retention game design`
3. `roblox monetization gamepass developer product pricing 2025`
4. `"Pet Simulator 99" techniques secrets how built`
5. `"Adopt Me" building style architecture roblox development`
6. `"Doors" entity system horror AI roblox development`

### D. Advanced Luau (SKIP if already in knowledge base)
1. `site:devforum.roblox.com parallel luau actors 2025`
2. `site:devforum.roblox.com BulkMoveTo performance`
3. `site:devforum.roblox.com CollectionService tag system pattern`
4. `site:devforum.roblox.com Attribute vs Value vs ModuleScript data`

---

## PHASE 2: INJECT INTO AI BRAIN

### A. Expand roblox-knowledge.ts (target: 50+ total entries)

Currently has ~45 entries. Add entries for:

**Building quality (MOST IMPORTANT):**
1. Low-poly building style — specific part counts, when to use meshes vs parts
2. Atmosphere + lighting setup — exact Future/ShadowMap settings with numbers
3. Color theory for games — warm/cool palettes, contrast rules, genre palettes
4. Furniture placement — room layout rules, scale relative to character (5.5 studs tall)
5. Landscaping — tree placement density, path widths, rock clustering patterns

**Game architecture (fill gaps):**
6. Horror entity AI — pathfinding, chase mechanics, jumpscare triggers
7. Racing vehicle physics — VehicleSeat, BodyVelocity, drift mechanics
8. Round-based game loop — lobby, countdown, gameplay, results, repeat
9. Trading system — duplication prevention, confirmation UI, server validation
10. Guild/clan system — creation, ranks, shared bank, territory

**Performance & monetization:**
11. Parallel Luau — Actors for heavy computation (NPC AI, terrain gen)
12. CollectionService patterns — tag-based behavior instead of per-instance scripts
13. GamePass vs DevProduct — when to use which, pricing tiers
14. Player retention — first 30 seconds, reward scheduling, daily hooks

### B. Add to game-systems-knowledge.ts

Check what's already there (2472 lines, 630 systems). Add ONLY what's missing:
- Round-based game patterns with code
- Matchmaking/lobby system
- Anti-cheat patterns
- Leaderboard with OrderedDataStore (real production pattern)
- Chat command system

### C. Enhance the AI prompt in chat/route.ts

Find the build quality rules section (around line 3835) and add:

```
BUILDING QUALITY RULES FROM DEVFORUM PRO BUILDERS:

1. WALL THICKNESS: 0.8-1.0 studs. NEVER 2-4 studs (looks chunky, wastes parts).
2. ROOF OVERHANG: 1.5-2.0 studs past walls. ALWAYS. No overhang = amateur.
3. FOUNDATION: Every building sits on a visible foundation (0.5-1.0 stud thick, extends 0.5-1.0 past walls).
4. COLOR VARIATION: NEVER one flat color on large surfaces. Vary by ±10-15 RGB per part.
5. TRIM ON EVERYTHING: Baseboard (0.3h at floor), crown molding (0.2h at ceiling), corner posts (0.6x0.6 at wall edges).
6. WINDOW FRAMES: 4-piece frame (top, bottom, left, right) around every window. Glass slightly recessed 0.1 from wall face.
7. DOOR DETAIL: Panel + frame + handle + threshold. Never a bare rectangle.
8. LIGHTING: PointLight in every enclosed space. SpotLight behind windows for exterior glow.
9. DETAIL HIERARCHY: Target Level 4-5 (shutters, flower boxes, porch railings, chimney detail, landscaping).
10. PART COUNT TARGETS: Props 10-30, Buildings 80-300, Scenes 200-1000, Worlds 1000-5000+.
```

---

## PHASE 3: BUILD REFERENCE GAMES

These are the AI's "muscle memory" — when a user asks for a tycoon, the AI gets a PERFECT working example as context.

### Check what exists first:
```bash
ls src/lib/ai/reference-games/ 2>/dev/null
```

### Create what's missing:

**File: `src/lib/ai/reference-games/tycoon-reference.ts`** (if not exists)
Export `getTycoonReference(): string` — 500+ lines of PERFECT tycoon code:
- Plot system, droppers (BodyVelocity conveyors), collectors
- Server-side economy, DataStore saving, BindToClose
- Upgrade buttons with exponential pricing
- Rebirth system with multiplier formula
- LeaderStats, Shop GUI, rate-limited RemoteEvents
- Comments explaining every architectural decision

**File: `src/lib/ai/reference-games/simulator-reference.ts`**
Export `getSimulatorReference(): string` — 500+ lines:
- Collection zones with click-to-collect (server validated)
- Backpack with capacity limits
- Sell pad with sound effects
- Zone unlocking with gates
- Pet system with egg hatching (weighted rarity)
- Rebirth preserving pets/passes

**File: `src/lib/ai/reference-games/rpg-reference.ts`**
Export `getRPGReference(): string` — 500+ lines:
- Stat system (HP, ATK, DEF, XP, Level)
- Damage formula: max(1, ATK - DEF/2) * critMultiplier
- Quest state machine: NotStarted → Active → Complete → Rewarded
- NPC dialogue with typewriter effect
- Inventory with equipment slots
- Boss fight mechanics

**File: `src/lib/ai/reference-games/obby-reference.ts`**
Export `getObbyReference(): string` — 400+ lines:
- Stage-based checkpoints with data saving
- Kill brick detection (Touched → check Humanoid)
- Difficulty scaling per stage
- Speedrun timer with leaderboard
- Skip stage with currency
- Lobby → teleport to last checkpoint

### Wire reference games into chat route:
In `getScriptTemplate()`, inject the reference game as few-shot context when the game type is detected. The reference should appear as:
```
=== PRODUCTION REFERENCE (adapt this — do NOT copy verbatim) ===
```lua
[reference code]
```
=== END REFERENCE ===
```

### Create index file:
**File: `src/lib/ai/reference-games/index.ts`**
```typescript
import { getTycoonReference } from './tycoon-reference'
import { getSimulatorReference } from './simulator-reference'
import { getRPGReference } from './rpg-reference'
import { getObbyReference } from './obby-reference'

export function getReferenceGame(prompt: string): string | null {
  const lower = prompt.toLowerCase()
  if (/tycoon|factory|idle|dropper|conveyor/.test(lower)) return getTycoonReference()
  if (/simulator|collect|backpack|sell pad|pet sim/.test(lower)) return getSimulatorReference()
  if (/rpg|quest|combat|dungeon|warrior|mage/.test(lower)) return getRPGReference()
  if (/obby|obstacle|parkour|checkpoint|stages/.test(lower)) return getObbyReference()
  return null
}
```

---

## PHASE 4: TEST THE KNOWLEDGE

After injecting knowledge, verify the AI ACTUALLY uses it by testing these prompts:

### Test 1: Building Quality
Prompt: "build me a house"
MUST have: foundation, 4 walls (0.8 thick), window frames, door with handle, gable roof with overhang, chimney, trim/baseboard, at least 60 parts, varied colors

### Test 2: Tycoon Architecture
Prompt: "make me a tycoon game"
MUST have: server-side economy, DataStore pcall, plot system, BodyVelocity conveyor, exponential upgrade costs, RemoteEvent rate limiting

### Test 3: Simulator
Prompt: "build a pet simulator"
MUST have: collection mechanic, backpack capacity, sell pad, egg hatching with weighted rarity, zone unlocking

### Test 4: UI Quality
Prompt: "make a shop UI"
MUST have: bright colorful panels (NOT dark gray), thick borders, UICorner 12+, FredokaOne fonts, TweenService animations, close button, hover effects

### Test 5: Security
Prompt: "add a combat system"
MUST have: server-side damage calculation, RemoteEvent validation, rate limiting, no client trust

For each test, mentally trace through the code path and verify the knowledge would be injected. If not, fix the injection point.

---

## PHASE 5: SAVE TO CODEGRAPH + MEMORY

### Update CodeGraph brain:
Read `src/lib/eli/codegraph.ts` and add new nodes + edges for:
- Building techniques → material choices, detail levels, part counts
- Game architectures → tycoon, simulator, RPG, obby patterns
- Security patterns → rate limiting, validation, server authority
- UI patterns → cartoon style, responsive, animated

### Save session to memory:
Write a comprehensive handoff to `C:\Users\Dawse\.claude\projects\C--WINDOWS-system32\memory\`

---

## PHASE 6: MANDATORY AUDIT

```
## AUDIT REPORT — System 11 v2: DevForum Research + Knowledge God Mode

### Research
- DevForum topics read: XX
- Techniques extracted: XX  
- Code patterns captured: XX

### Knowledge Injection
- roblox-knowledge.ts entries: XX (was 45)
- game-systems-knowledge.ts: XX lines (was 2472)
- Reference games created: X/4

### Test Results
| Test | Result | Missing Items |
|------|--------|---------------|
| Building Quality | PASS/FAIL | [what's missing] |
| Tycoon Architecture | PASS/FAIL | [what's missing] |
| Simulator | PASS/FAIL | [what's missing] |
| UI Quality | PASS/FAIL | [what's missing] |
| Security | PASS/FAIL | [what's missing] |

### Files
- Lines added: XXXX
- Files created: [list]
- Files modified: [list]
- TypeScript: PASS/FAIL

### Quality Assessment
- Before: [how AI built]
- After: [how AI builds now]
```

## COMMIT + PUSH
```bash
git add [files by name]
git commit -m "feat: DevForum knowledge god mode — XX entries, X reference games, XX techniques"
git push origin master
```

## THE QUALITY BAR

After this session, the AI should:
- Build houses with 80-300 parts (not 15)
- Use proper wall thickness (0.8, not 4)
- Add trim, baseboard, window frames on EVERY building
- Generate secure tycoon/simulator code with server-side everything
- Create UI that looks like Pet Simulator X (bright, colorful, animated)
- Reference existing game state when building
- Follow DevForum best practices for performance
- Produce code that a professional Roblox developer would approve of

If the AI's builds don't look dramatically better after this session, something is wrong.
