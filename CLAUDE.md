<!-- GSD:project-start source:PROJECT.md -->
## Project

**ForjeGames**

ForjeGames is an AI-powered game development platform that lets anyone build Roblox games using voice commands, image references, and autonomous AI agents. It's the all-in-one toolkit for Roblox creators — from a 13-year-old building their first game to professional studios shipping hits. Built by Dawsen Porter. 10% of all revenue donated to charity.

**Core Value:** **Simple input → professional output.** A user speaks "build me a medieval castle with a moat" and gets a playable Roblox game element in seconds. Everything else (marketplace, teams, analytics) amplifies this core magic.

### Constraints

- **Timeline**: MVP usable by Dawsen before April 8, 2026 (subscription renewal)
- **Budget**: Solo dev, minimize external costs, leverage existing LLC + Stripe
- **COPPA**: All ages including under-13 — parental consent flow non-negotiable
- **Roblox ToS**: Must comply with Roblox third-party tool guidelines
- **API costs**: Must maintain 60%+ margin on AI operations
- **Performance**: Mobile-ready, <20K Roblox instances per build
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

**Runtime:** Next.js 15 (App Router) + React 19 + TypeScript (strict). Node on Vercel lambdas.
**Auth:** Clerk (production keys live). Webhook signatures via Svix.
**DB:** Postgres via Prisma. Hosted on Neon (pooled + direct URL).
**Cache + queue:** Upstash Redis (REDIS_URL). L1 in-memory with L2 Redis fallback across lambdas.
**Payments:** Stripe (subscriptions + one-time token packs) — all 6 tier prices + 3 token pack IDs set in Vercel env. Robux payments via GamePass/DevProduct (webhook secret set; GamePass IDs not).
**AI providers:** Gemini (primary, jsonMode supported), Groq (fallback, llama-3.3-70b), Anthropic Claude (opt-in custom-key path), OpenAI (for specific models). Provider chain in `src/lib/ai/provider.ts` → `callAI()`.
**Image/3D:** FAL (Stable Diffusion, 13 styles, see `src/lib/image-styles.ts`), Meshy (text-to-3D), Roblox Open Cloud (asset auto-upload — key NOT set yet so this is demo mode).
**Email:** Resend. Push: VAPID web push. SMS: Twilio (not configured).
**Observability:** Sentry (client DSN set, server token not), PostHog (COPPA-gated via `src/lib/posthog-safe.ts`).
**Studio integration:** Custom plugin `packages/studio-plugin/*.lua` → `.rbxmx` built via `packages/studio-plugin/build-plugin.js` → served from `/api/studio/plugin` route (reads from `public/plugin/ForjeGames.rbxmx`).
**MCP servers:** `packages/mcp/studio-bridge` (cloud relay) + `packages/mcp/studio-controller` (direct local, port 3006). Plus 3 Python agent servers (asset-alchemist, city-architect, terrain-forge).
**Monorepo layout:** `src/app/` (App Router), `src/components/`, `src/lib/`, `src/hooks/`, `packages/mcp/*`, `packages/studio-plugin/`, `prisma/schema.prisma`. No Turbo/Nx — just manual workspaces in root package.json.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### Execution style (IMPORTANT — session-level guidance)

Dawsen's default mode is **execute, don't ask**. He authorizes editing, committing, pushing, and running builds in advance. Only escalate when a task **physically** requires a human at a dashboard UI:
- Clicking in Roblox Studio (plugin install, Play button)
- Adding env vars via Vercel UI (though `vercel env add` CLI works — use it)
- Upstash dashboard quota checks
- Real-money irreversible actions (refunds, deletions)

For everything else: just do it, commit as a new commit (never amend), push when it's ready, report after the fact. Don't write "should I proceed?" — just proceed.

See `~/.claude/projects/C--WINDOWS-system32/memory/feedback_autonomy.md` for the full memory.

### Git / commit style

- **Always new commits, never amend.** Pre-commit hooks exist; if they fail, fix and make a new commit.
- Commit messages use conventional-commit prefixes: `feat(area):`, `fix(area):`, `refactor(area):`, `perf(area):`, `docs:`, `release:`. Area in parens names the subsystem (e.g. `fix(plugin):`, `fix(studio/plugin):`, `feat(ai):`).
- **First line ≤72 chars, then blank line, then detailed body** explaining root cause / what changed / why / known limitations. Commit bodies are the best documentation — future sessions grep them.
- End every commit with `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`.
- Stage files explicitly by name (`git add src/... src/...`), never `git add .` — there are often uncommitted files from parallel sessions you must not hijack.

### TypeScript gates

- **Full `tsc --noEmit` OOMs** on 8GB heap because the project has ~200 components. Do NOT run `npm run typecheck` as the default validation.
- Use `npx tsc -p tsconfig.spotcheck.json` — the `include` list is a curated set of files that matter for the current work. Add your touched files to the include list before running.
- `next.config.ts` has `typescript.ignoreBuildErrors: true` for the same reason (OOM in the Vercel build phase). This means **the build phase does NOT catch TS errors** — spotcheck is your only line of defence.
- ESLint is also skipped in the build (`eslint.ignoreDuringBuilds: true`). Run lint separately when relevant.

### Studio plugin — critical gotchas

- **`src/plugin/ForjeGamesPlugin.lua` is an ORPHAN FILE — DO NOT EDIT IT.** The production plugin is built from `packages/studio-plugin/*.lua` (6 files: `Plugin.lua`, `Auth.lua`, `UI.lua`, `Sync.lua`, `AssetManager.lua`, `History.lua`). Any edit to the orphan is wasted — it doesn't ship.
- The production plugin is assembled by `packages/studio-plugin/build-plugin.js`. To rebuild: `node packages/studio-plugin/build-plugin.js --version 4.6.0`. Add `--install` to also auto-copy to `%LOCALAPPDATA%\Roblox\Plugins\ForjeGames.rbxmx` for local testing.
- The built file lives at `public/plugin/ForjeGames.rbxmx` and is served via `/api/studio/plugin`. Both a `ForjeGames.rbxmx` and a `ForjeGames-store.rbxmx` exist — the latter is the Creator Store variant.
- Plugin command dispatcher is in `Sync.lua` around `function applyChanges(changes)`. All new command types need a new `elseif changeType == "..."` branch there.
- Plugins **cannot** capture viewport pixels or press Play — both are platform limitations, not bugs. The vision loop uses `scan_workspace` scene manifests instead of pixels.

### API routes that read from `public/`

If a route reads a file from `public/` via `fs.readFileSync(process.cwd() + ...)`, Next's file tracer does NOT follow the path automatically. Add it to `experimental.outputFileTracingIncludes` in `next.config.ts` explicitly:

```ts
outputFileTracingIncludes: {
  '/api/studio/plugin': [
    './public/plugin/ForjeGames.rbxmx',
    './public/plugin/ForjeGames-store.rbxmx',
  ],
},
```

Without this, Vercel deploys serve stale copies from build cache and debugging takes hours.

### Vercel crons (Hobby plan)

- **Hobby plan only supports DAILY cron frequencies** — `*/30 * * * *` will not work, even though it's a valid cron expression. Use `0 4 * * *` style schedules. Registered in `vercel.json`.
- `CRON_SECRET` header (`x-cron-secret`) protects all cron routes via `timingSafeEqual`. Set in Vercel env.

### AI provider chain

- Use `callAI(systemPrompt, messages, opts)` from `src/lib/ai/provider.ts` — not raw SDK calls. It handles Gemini → Groq fallback, `jsonMode`, `maxTokens`, `temperature`, `useRAG`.
- `ANTHROPIC_API_KEY` is `prodRequired` in `src/lib/env.ts` but `env.ts` only WARNS on missing vars in prod rather than throwing — so Anthropic-specific paths will gracefully fall back to the Gemini chain instead of crashing.
- Chat route is `src/app/api/ai/chat/route.ts` — huge file (~7900 lines). Token spend sites at lines 6883, 7118, 7180, 7323, 7477 all run AFTER the AI call succeeds, so there's NO token refund path needed (contrary to what past audit agents have claimed).

### COPPA rules

- PostHog **never** initializes until BOTH age gate (confirmed 13+) AND cookie consent are granted. All tracking goes through `safePostHog` in `src/lib/posthog-safe.ts`.
- Server-side analytics (`src/lib/analytics.ts`) requires explicit `isUnder13 === false` — NOT just "not true". Undefined flag = drop silently.
- Clerk JWT's default template does NOT include `publicMetadata`. Any middleware check that reads `session.publicMetadata.dateOfBirth` (or similar) from the session will be `undefined`, which caused a redirect loop bug that was fixed in commit `a2eb1ad`. Page-level layouts should use a live Clerk fetch for age verification, not JWT claims.

### Audit agent quality caveat

Past Haiku-based audit agents (Claude Haiku 4.5 via the Explore subagent) have a roughly 50% false-positive rate on this codebase. Always **verify** individual claims against the real files with explicit line reads before editing. Never fix on audit output alone. The three things audits have been most wrong about:
1. "Token spent before X — no refund" (always verify the order of `await`s)
2. "Null deref at line X" (usually has an upstream `{x && <Y x={x}/>}` guard)
3. "setStreaming(false) missing in error path" (usually an outer try/catch covers it)

### Dev server

- Dev server runs from `C:\dev\roblox-map-building` (moved from OneDrive Apr 10 to fix Turbopack file lock issues).
- `npx next dev --turbo --port 3000` is the standard local dev command.
- A persistent dev server may already be running in a background task — check before starting another.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

### Route layout (src/app/)

- `(marketing)/` — public home, pricing, docs, showcase, help, download, status, changelog, whats-new, about, blog (wrapped by `(marketing)/layout.tsx` with `MarketingNav` + `Footer`)
- `(auth)/` — sign-in, sign-up, sso-callback, onboarding (age-gate + parental-consent + plan + welcome)
- `(app)/` — `/editor` (main product), `/dashboard`, `/settings`, `/templates`, `/marketplace`, `/projects`, `/voice`, `/image-to-map`, `/game-dna`, `/community`, `/earnings`, `/referrals`, `/team`, etc. All Clerk-protected via root middleware.
- `(admin)/admin/` — analytics, users, stripe-setup, marketplace moderation, templates queue, charity, dev-board, etc. Behind `requireAdmin` (Clerk session + `ADMIN_EMAILS` env check).
- `(legal)/` — terms, privacy, dmca, acceptable-use. Custom layout with top-level sidebar nav.
- Error/system pages at root: `/blocked`, `/maintenance`, `/offline`, `/rate-limited`, `/suspended`, `/verify-email`, `/unsubscribe`, `/status`.

### Studio pairing flow

1. User opens `/editor` → `useStudioConnection` generates a session ID → POSTs to `/api/studio/auth?action=generate` → receives a 6-char pairing code.
2. User pastes code into the ForjeGames Studio plugin panel → plugin POSTs `/api/studio/auth` with the code + placeId + pluginVer → receives a JWT signed with `STUDIO_AUTH_SECRET`.
3. Plugin stores JWT in memory, then polls `/api/studio/sync` every 1 s with Authorization: Bearer + query params for context (camera, partCount, nearbyParts, selected, etc.).
4. Server queues commands via `/api/studio/execute`, they flow into Redis `fj:studio:cmd:<sessionId>` LIST, and `drainCommands` atomically reads + clears on each plugin poll.
5. Plugin dispatches commands via `applyChanges` in `Sync.lua`. Results flow back via `/api/studio/update` (session state, workspace snapshots, output logs) and `/api/studio/bridge-result` (MCP-correlated reads keyed by `cmd.id`).

### Session store (src/lib/studio-session.ts)

Redis-primary with L1 in-memory cache. Screenshots are L1-only (too large for Redis hash). Secondary indexes at `fj:studio:token:<tokenHash>` and `fj:studio:place:<placeId>`. Rate-limited poll enforced via `MIN_POLL_INTERVAL_MS`.

### Agentic loop (src/lib/ai/agentic-loop.ts)

Phases: **generate → deploy → playtest → observe → fix**, capped at `maxIterations` (default 3). Observe phase queues `scan_workspace` and reads `session.latestState.worldSnapshot` to run `analyzePlaytestScene` (text-based LLM via `callAI`, not pixel vision). Uses `get_output` → `session.latestState.outputLog` for console-error detection. A visually-broken-but-cleanly-compiling build is now caught by the scene check; prior to commit `3fd0919` this was blind.

### Orchestrator (src/lib/ai/orchestrator.ts)

9 agents: Think, Ideas, Plan, Build, Image, Script, Terrain, ThreeD, Debug. Auto-dispatch via intent classification + keyword match + ambitious-prompt heuristic. Chain capped at 4 agents. SSE streaming on `/api/ai/orchestrate` POST. Also exposed via `{ autoDelegate: true, stream: false }` on `/api/ai/chat`.

### Known landmines

- **`src/plugin/ForjeGamesPlugin.lua` is an orphan.** Don't edit it.
- **Full tsc OOMs.** Use `tsconfig.spotcheck.json`.
- **`next build` skips TS + ESLint** (`ignoreBuildErrors: true`, `ignoreDuringBuilds: true`). Spotcheck is the only gate.
- **CDN caching on `/api/studio/plugin`.** Use `outputFileTracingIncludes` + content-hash etag.
- **Upstash quota** got exhausted Apr 11 — rate limiter falls back to per-instance memory when Redis 429s. Check `/api/health` before assuming Redis is healthy.
- **Orphan routes.** `/changelog` is public but was missing from nav until commit `04efdac`. Other app routes (`/achievements`, `/business`, `/community`, etc.) are protected and only reachable via the dashboard grid.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
