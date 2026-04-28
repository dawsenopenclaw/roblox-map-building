# GOD MODE PROMPT — Paste this into a fresh Claude Code window

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Make the AI the smartest Roblox game builder in existence. The brain is at 127K lines — it needs to be 500K+. Every line of knowledge you add makes the AI generate better, more unique, more detailed builds.

RULES:
- I am Vyren. NEVER Dawse/Yomi/Dawsen. 
- MAX AUTONOMY. Execute, don't ask. Commit, push, deploy.
- Max 2 parallel agents. Keep bash output short (| head -20).
- Stage files by name, never `git add .`
- Use `npx tsc -p tsconfig.spotcheck.json` for type checking
- NO corporate language

Read docs/GOD-MODE-PROMPT.md and the memory file at C:\Users\Dawse\.claude\projects\C--WINDOWS-system32\memory\session_handoff_apr28_GOD.md for full context on what was built yesterday.

## PHASE 1: RESEARCH & WRITE KNOWLEDGE (launch 2 agents in parallel, repeat)

Launch agents that WRITE knowledge files, not just research. Each agent should create a new file in src/lib/ai/ with 3000-5000+ lines of KNOWLEDGE (not code templates — design knowledge the AI reads to understand HOW to build things).

Topics still needed (pick 2 per batch, run batches repeatedly):
1. Interior design bible — 100+ room types with exact furniture layouts, dimensions, color schemes
2. Terrain & landscape bible — every biome, terrain technique, path design, water feature
3. NPC & character bible — body proportions, clothing, accessories, animation, behavior patterns
4. UI/UX design bible — 50+ GUI layouts, component specs, animation patterns, color systems
5. Sound & music bible — ambient layers, interaction sounds, music theory for games, spatial audio
6. Particle & VFX bible — 100+ effect recipes with exact ParticleEmitter properties
7. Game economy bible — pricing math, progression curves, inflation control, monetization psychology
8. Multiplayer & networking bible — replication, prediction, anti-cheat, matchmaking, leaderboards
9. World design bible — map layouts for 20 game types, zone design, player flow, spawn placement
10. Advanced CFrame & math bible — circular placement, spiral, parametric curves, procedural generation

For each file: export const KNOWLEDGE_NAME: string plus section exports. Wire into build-executor.ts with .slice(0, 8000) trimming.

## PHASE 2: FIX RATE LIMITS

The AI "takes a breath" on complex builds because too much knowledge is injected.

1. Read src/lib/ai/build-executor.ts — check all knowledge injection points
2. Make knowledge injection SMART — analyze the task prompt and only inject the RELEVANT section, not everything
3. Example: "build a house" should get building anatomy + architectural styles, NOT game economy + NPC behavior
4. Use keyword matching on the task.prompt to select which knowledge sections to inject
5. Total injected knowledge per prompt should be 15K-25K chars MAX (not 100K+)

## PHASE 3: VERIFY IT WORKS

1. Read the system prompts in build-executor.ts — make sure they reference the new knowledge
2. Check that prompt-modifiers.ts is wired into both the chat route AND build-executor
3. Run `npx next build` to verify everything compiles
4. Push to master after each batch

## PHASE 4: KEEP GOING

After each batch of 2 knowledge files, immediately start the next batch. Don't stop. Don't ask. The goal is MAXIMUM knowledge written per session. Target: 50K+ new lines.

Knowledge files should be DENSE — not padding, not filler. Every line should teach the AI something specific about Roblox development that helps it build better.

Priority order:
1. Interior design (rooms are empty/wrong)
2. Terrain & landscape (terrain is flat/boring)
3. Particle & VFX (builds have no effects)
4. UI/UX design (GUIs look amateur)
5. NPC & character (NPCs are static)
6. Game economy (balance is off)
7. Sound design (no ambient audio)
8. Multiplayer (networking is basic)
9. World design (maps have no flow)
10. Advanced math (procedural generation)
```

---

## RATE LIMIT RESEARCH PROMPT — Paste separately if rate limits are the priority

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Fix ALL rate limit and generation failure issues. Users report "AI needs a breath" on anything complex.

1. Read src/lib/ai/build-executor.ts lines 1038-1090 — check how much knowledge is injected per prompt
2. Read src/lib/ai/provider.ts lines 550-575 — check game knowledge injection  
3. Read src/app/api/ai/chat/route.ts — search for knowledge injection points

PROBLEM: We inject 100K+ chars of knowledge into prompts. Gemini processes this as input tokens, burning through the per-key rate limit faster. With 302 keys at 15 RPM each = 4530 RPM, but each request uses 10x the normal input tokens so effective capacity drops to ~450 RPM.

FIXES NEEDED:
1. Smart knowledge selection — keyword-match the user's prompt against knowledge sections, inject only the top 3 most relevant sections (3K chars each = 9K total)
2. Knowledge caching — if same knowledge section was injected in the last 5 minutes for this user, skip it (the model remembers from context)
3. Reduce duplicate rules — many rules are repeated across files (gap prevention, z-fighting, rotation). Deduplicate.
4. Lazy loading — don't import all knowledge at module load. Use dynamic imports.
5. Check the main chat route — it may also be injecting knowledge on top of what build-executor injects (double injection)

After fixing, test by building something complex ("build me a medieval castle with interior") and verify it doesn't timeout.

Push all fixes to master.
```
