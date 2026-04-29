# ROADMAP: Make ForjeGames Work For Every Person On Earth

## Philosophy
- ZERO templates served to users. Every build is unique AI-generated output.
- Templates/examples exist INTERNALLY only — as training data the AI learns from.
- Quality comes from better prompting, deeper knowledge, smarter post-processing.
- The AI must handle ANY prompt from ANY person in ANY language and produce something good.

---

## PILLAR 1: NEVER FAIL (API Reliability)
**Current:** Single Groq key + 302 Gemini keys not confirmed in Vercel
**Target:** Always responds, never "catching its breath"

### Tasks:
- [ ] Verify GEMINI_API_KEYS is in Vercel production env (Vyren doing this)
- [ ] Add OPENROUTER_API_KEY as third fallback provider
- [ ] Implement exponential backoff on rate limits (not just key rotation)
- [ ] Add Anthropic Claude as paid fallback for when free tiers exhaust
- [ ] Build a "degraded mode" — if ALL APIs fail:
  - Tell user honestly: "Heavy traffic right now, your build is queued"
  - Queue the request and process when capacity returns
  - Never show a dead end
- [ ] Monitor key health dashboard (which keys are dead/rate-limited/working)
- [ ] Auto-generate new Gemini keys when pool gets low

---

## PILLAR 2: UNDERSTAND ANYTHING (Natural Language Understanding)
**Current:** Regex keyword matching — misses slang, context, multi-language
**Target:** Understands "yo build me a crib" = house, "make it fire" = make it look good

### Tasks:
- [ ] Build a slang/casual language dictionary:
  - "crib" = house, "whip" = car, "drip" = cool outfit/style
  - "fire" / "heat" / "goes hard" = high quality, impressive
  - "mid" = mediocre, needs improvement
  - "bet" = yes/confirmed, "nah" = no/reject
  - "lowkey" = subtle, "highkey" = obvious/bold
  - "vibe" = aesthetic/mood, "aesthetic" = visual style
- [ ] Expand intent detection beyond regex:
  - Use Gemini to classify ambiguous intents (already partially exists)
  - Build a fuzzy matcher for typos ("bild me a hose" = "build me a house")
  - Handle compound requests: "build me a house and add a car in the driveway"
- [ ] Multi-language support:
  - Auto-detect language from user message
  - Respond in same language
  - Translate build keywords internally (casa = house, arbre = tree)
  - Support: English, Spanish, Portuguese, French, Japanese, Korean, Chinese, Arabic
- [ ] Context awareness:
  - Remember what the user built before in this session
  - "make it bigger" = modify last build, not new build
  - "add a door" = add to existing, not start fresh
  - "I don't like it" = regenerate with different approach
  - "more detail" = amplify the current build

---

## PILLAR 3: LEARN FROM EVERY BUILD (Build Intelligence)
**Current:** Experience memory exists but barely influences generation
**Target:** Every Worked/Broke click makes the AI smarter

### Tasks:
- [ ] Fix the Worked/Broke feedback loop:
  - When user clicks "Worked": save the prompt → code → score as a positive example
  - When user clicks "Broke": save what went wrong, add to anti-patterns
  - Weight recent feedback higher than old feedback
- [ ] Build aggregate intelligence:
  - "Houses that score > 80 all use WedgePart roofs and window frames"
  - "Tycoons that work all have server-side economy validation"
  - "Users who say 'massive' want 100+ parts, not 30"
  - Feed these patterns back into the system prompt dynamically
- [ ] Popular request tracking:
  - Track what people ask for most (house, car, tycoon, obby, tree, castle...)
  - For top 50 requests, ensure the AI produces excellent output every time
  - Quality-test the top 50 regularly via automated agents
- [ ] A/B test different prompting strategies:
  - Try different system prompt phrasings
  - Measure which produces higher Worked/Broke ratios
  - Auto-adopt winning strategies
- [ ] Error pattern learning:
  - Track which Luau code patterns cause Studio errors
  - Auto-ban patterns that fail > 50% of the time
  - Surface working alternatives

---

## PILLAR 4: SMART BREAKDOWN (Multi-Step Building)
**Current:** One API call tries to build everything at once → often fails
**Target:** Complex requests broken into focused steps, each high quality

### Tasks:
- [ ] Implement conversational build flow:
  1. User: "Make me an RPG game"
  2. AI: "Let's plan this out. What's the theme? Medieval, sci-fi, or something else?"
  3. User: "Medieval with dragons"
  4. AI: "Here's the plan: Phase 1 - Castle + village map, Phase 2 - Dragon enemy + combat, Phase 3 - Quest system + NPC shops, Phase 4 - UI/HUD. Starting Phase 1..."
  5. AI builds Phase 1, shows result
  6. User: "Looks good, do Phase 2"
  7. AI builds Phase 2 ON TOP OF Phase 1 (additive, not replacing)
- [ ] Build the Phase Engine:
  - Decompose any complex request into 3-8 phases
  - Each phase = one focused AI call (map OR scripts OR UI, never everything)
  - Track what's been built so far (game state persistence)
  - Each new phase builds ON the existing game state
- [ ] Implement additive building:
  - "Add a shop to my town" → AI finds existing build, adds shop nearby
  - "Make the castle bigger" → AI reads existing code, extends it
  - "Add a leaderboard" → AI creates script that references existing game
  - This requires the build context system to actually work reliably
- [ ] Smart complexity estimation:
  - "Build me a tree" → 1 phase, 1 API call, 5 seconds
  - "Build me a house with interior" → 2 phases (exterior, interior), 15 seconds
  - "Make me a full RPG" → 6-8 phases, conversational planning first
  - Route to the right path based on complexity

---

## PILLAR 5: QUALITY FLOOR (Nothing Bad Reaches Users)
**Current:** 10-part "massive hotels" pass through, generic grey builds ship
**Target:** Every build meets a minimum quality bar. Bad builds get retried automatically.

### Tasks:
- [ ] Implement hard quality gates (already started):
  - Part count minimum based on scale detection
  - Material check: no default grey, no SmoothPlastic on non-cartoon builds
  - Color check: minimum 3 distinct colors for buildings
  - Structure check: buildings need roofs, interiors need lighting
  - If ANY gate fails → auto-retry with specific fix instructions
- [ ] Quality scoring on EVERY build:
  - Score 0-100 based on: part count, color variety, material quality, structural completeness
  - Builds scoring < 40 → auto-retry (already partially exists)
  - Builds scoring < 25 → reject entirely, tell user "let me try a different approach"
  - Builds scoring > 70 → great, ship it
- [ ] Style consistency enforcement:
  - Once a user builds in a style, maintain it across all subsequent builds
  - "Build me a medieval town" → all future buildings default to medieval palette
  - User can override: "now make it futuristic"
- [ ] Post-processing pipeline (already built, needs tuning):
  - Amplify: add lighting, terrain, trim, landscaping
  - Enforce style: fix wrong materials/colors for detected theme
  - Anti-ugly: fix floating parts, gaps, missing detail
  - All of this runs AUTOMATICALLY on every build

---

## PILLAR 6: SPEED
**Current:** 5-30 seconds per build
**Target:** < 10 seconds for simple builds, < 20 seconds for complex

### Tasks:
- [ ] Optimize the system prompt — it's 40K+ chars, trim to 15K
  - The AI only reads the first ~8K chars carefully
  - Move detailed knowledge to on-demand injection (already started)
  - Keep only the style bible + core rules + helpers in the main prompt
- [ ] Parallel generation for multi-part builds:
  - "Build a town" → spawn 3 parallel API calls (buildings, roads, decorations)
  - Merge results into one model
- [ ] Streaming response to show progress:
  - Show the user "Building exterior..." → "Adding interior..." → "Placing landscaping..."
  - Even if the total time is 15s, it FEELS fast because they see progress
- [ ] Smart caching (NOT template caching):
  - Cache the knowledge injection (don't re-compute for similar requests)
  - Cache API key health checks (don't ping every key every request)
  - Cache user preferences (don't re-load from DB every message)

---

## PILLAR 7: GLOBAL READY
**Current:** English only, US-centric examples
**Target:** Works for everyone worldwide

### Tasks:
- [ ] Auto-detect language and respond in it
- [ ] Translate slang/casual terms across languages
- [ ] Cultural awareness in builds (Japanese shrine vs American house vs Brazilian favela)
- [ ] RTL language support in chat UI
- [ ] Localize error messages and suggestions

---

## EXECUTION ORDER (what to do first)

### This Week (Critical Path):
1. Get Gemini keys working in Vercel (Vyren)
2. Remove instant templates from user-facing path (every build = AI generated)
3. Trim system prompt from 40K to 15K chars
4. Implement the smart breakdown (Phase Engine) for complex requests
5. Fix the quality floor gates

### Next Week:
6. Slang/casual language dictionary
7. Conversational build flow (plan → approve → build phase by phase)
8. Feedback loop (Worked/Broke actually teaching the AI)
9. Track 2 knowledge crawl (Roblox docs + DevForum)

### Month 2:
10. Multi-language support
11. A/B testing different prompt strategies
12. Popular request quality monitoring
13. Speed optimizations (parallel generation, streaming)

### Month 3:
14. Build intelligence dashboard (what's working, what's failing)
15. Auto-scaling API management
16. Community-driven quality improvement (users vote on best builds)
