# AUTONOMOUS PLATFORM EXECUTION CHECKLIST

**Research Completed:** 2026-03-29
**Start Date:** [To be filled in]
**Target Completion:** [Start + 4 weeks]

---

## PHASE 1: AGENT FOUNDATION (Week 1, 16h)

### Day 1–2: PQueue + Model Routing Setup (8h)
- [ ] Install PQueue + BullMQ + Redis client
- [ ] Create `src/orchestration/agent-pool.ts`
  - [ ] PQueue with maxConcurrency: 5
  - [ ] BullMQ for long-lived jobs (model training, asset gen)
  - [ ] Task wrapper that reports progress to Redis
- [ ] Create `src/orchestration/model-router.ts`
  - [ ] Complexity analyzer (count context, operations)
  - [ ] Route function: (task) → "haiku" | "sonnet" | "opus"
  - [ ] Cost matrix: $0.0008/1K (haiku), $0.003/1K (sonnet), $0.015/1K (opus)
- [ ] Add cost tracking: `analytics.track({ agent, model, tokens })`
- [ ] **Test:** Run 5 parallel agents, measure concurrency

### Day 2–3: Redis Shared Memory (6h)
- [ ] Create `src/shared/game-state.ts`
  - [ ] Interface: `GameState { version, terrain, assets, economy, lastModifiedBy }`
  - [ ] Redis.Map<GameState> with key `game:${gameId}`
- [ ] Implement optimistic locking:
  - [ ] Read: check current version
  - [ ] Update: increment version, reject if stale
  - [ ] Error: `StaleVersionError` with expected vs actual
- [ ] Create `src/shared/state-operations.ts`
  - [ ] updateGameState(agent, updates, expectedVersion) → success/error
  - [ ] getGameState(gameId) → full state
- [ ] **Test:** Concurrent writes from 2 agents, verify locking

### Day 3–4: Parallelization Patterns (2h)
- [ ] Create `src/patterns/parallel-dispatch.ts`
  - [ ] Pattern A: Research fan-out (3 parallel haiku agents) → Promise.all()
  - [ ] Pattern B: Build + Review (parallel, not sequential)
  - [ ] Pattern C: Asset pipeline (Claude + Meshy + Fal + ElevenLabs parallel)
- [ ] **Test:** Measure latency reduction vs sequential

### Day 5: Integration + Testing (4h)
- [ ] Create integration test: dispatch 5 agents, measure cost
- [ ] Add error handling: PQueue retry logic, fallback strategies
- [ ] Document: `src/orchestration/README.md` with examples
- [ ] **Acceptance:** Week 1 cost tracking must match API costs

---

## PHASE 2: SELF-IMPROVEMENT LOOPS (Week 2, 20h)

### Day 6–7: Analytics Tracking (6h)
- [ ] Create `src/improvement/usage-analytics.ts`
  - [ ] Track: (agent, pattern, tokens, timestamp, quality_score)
  - [ ] Table: `agent_usage (agent, pattern, tokens, timestamp)`
  - [ ] Daily job: Query top patterns by cost (>$0.04)
- [ ] Update agent dispatch to call `trackPromptUsage(agent, tokens)`
- [ ] Create query: `findCacheablePatterns()` → patterns with >10 uses
- [ ] **Test:** Run 100 agent calls, verify analytics table populated

### Day 7–8: Prompt Caching (6h)
- [ ] Create `src/improvement/prompt-cache.ts`
  - [ ] Interface: `CachedPrompt { pattern, hash, response, tokens, hits, ttl }`
  - [ ] generateAndCacheTemplate(pattern) → store in Redis
  - [ ] getCache(pattern, spec) → return cached response if hit
  - [ ] Cache TTL: 7 days, invalidate on manual update
- [ ] Create `src/improvement/cache-manager.ts`
  - [ ] Daily job: Extract patterns with >$0.04 cost, generate caches
  - [ ] Metrics: hits vs misses, token savings
- [ ] **Test:** Run same game spec 10 times, verify 90% hit rate on 2nd+ calls

### Day 8–9: Quality Gate Agent (5h)
- [ ] Create `src/improvement/quality-gate.ts`
  - [ ] Agent: "output-evaluator" (haiku model)
  - [ ] Prompt: Evaluate 0–10 on spec match + code safety + performance
  - [ ] Function: evaluateOutput(agent, output, context) → { score, feedback }
- [ ] Track: `prompt_versions (agent, version, quality_score, timestamp)`
- [ ] Trigger on completion: If score < 5, flag for improvement
- [ ] **Test:** Evaluate 10 outputs, verify scores correlate with quality

### Day 9–10: Auto-Prompt Improvement (5h)
- [ ] Create `src/improvement/prompt-engineer.ts`
  - [ ] Detect: failures with score < 5 in past 7 days
  - [ ] Gather: 5 failure examples (output, context, feedback)
  - [ ] Call Opus: `improvePrompt(agent, currentVersion, failures)`
  - [ ] Store: New version v+0.1, parent reference
- [ ] A/B test: Route 50% to new version
- [ ] Metrics: Track quality_score improvement, win/lose
- [ ] **Acceptance:** Improved prompt version > baseline by 1 point (7→8)

### Day 10–11: Template Auto-Generation (4h)
- [ ] Create `src/improvement/template-generator.ts`
  - [ ] Trigger: After game succeeds (rating > 4.5)
  - [ ] Classify: "business-simulator" / "tycoon" / "shooter"
  - [ ] Check: Template already exists?
  - [ ] If yes: Update success rate (exponential moving average)
  - [ ] If no: Generate template with example input/output
- [ ] Storage: `templates (name, description, system_prompt, example_in, example_out)`
- [ ] Usage: buildGameWithTemplate(idea) uses cached template
- [ ] **Acceptance:** After 50 games, 20+ templates auto-generated

---

## PHASE 3: BUSINESS MODEL (Week 3, 24h)

### Day 12–13: Multi-Tenant Teams (8h)
- [ ] Create `src/business/team-model.ts`
  - [ ] Schema: Team { id, name, ownerUserId, llcName, stripeConnectId, agentConfig, rateLimit }
  - [ ] Table: `teams (id, owner_id, stripe_connect_id, config_json)`
  - [ ] Function: getTeamConfig(teamId) → full config
- [ ] Create `src/business/team-isolation.ts`
  - [ ] Redis namespace: `team:${teamId}:game:${gameId}`
  - [ ] Function: getTeamGameState(teamId, gameId) → isolated state
  - [ ] Update dispatch: respects team.agentConfig.modelPreferences
- [ ] Database migration: Add teams table, team_id foreign key to games
- [ ] **Test:** 3 teams with different model preferences, verify isolation

### Day 13–14: Rate Limiting (6h)
- [ ] Create `src/business/rate-limiter.ts`
  - [ ] Plan tiers: Free (10/mo), Pro (100/mo), Studio (1000/mo)
  - [ ] Track: `usage (team_id, game_count, month, year)`
  - [ ] Function: checkRateLimit(teamId) → allowed / exceeded
  - [ ] Error: Return quota exceeded message with upgrade link
- [ ] Implement: Check in dispatchTeamAgent() before running
- [ ] Monthly reset: Cron job on 1st of month
- [ ] **Test:** Team hits limit, verify subsequent requests rejected

### Day 14–15: Stripe Metered Billing (6h)
- [ ] Create `src/business/stripe-metering.ts`
  - [ ] Setup: Stripe Products with metered pricing tier
  - [ ] Track: tokens_consumed per subscription per month
  - [ ] Charge: stripe.billing.meterEventAdjustment.create()
  - [ ] Webhook: Handle invoice.created / invoice.payment_succeeded
- [ ] Database: Store subscription_id per team
- [ ] Cron: Daily reconciliation (actual tokens vs Stripe records)
- [ ] **Test:** Generate 1000 tokens, verify Stripe invoice increments

### Day 15–17: Creator Earnings Dashboard (8h)
- [ ] Create `src/dashboard/creator-earnings.ts` (backend routes)
  - [ ] GET /api/creator/earnings → total, pending, monthly breakdown
  - [ ] GET /api/creator/games → games + downloads + earnings
  - [ ] GET /api/creator/marketplace → items + sales + revenue
- [ ] Create `src/dashboard/CreatorEarnings.tsx` (frontend)
  - [ ] Real-time earnings ticker (refreshes every 5s)
  - [ ] Monthly breakdown chart
  - [ ] Marketplace items with sales/revenue
  - [ ] Payout schedule + method
- [ ] Database: Query joins `referral_rewards`, `marketplace_downloads`, `games`
- [ ] **Acceptance:** Dashboard updates in <2s, real-time feel

---

## PHASE 4: GROWTH ENGINES (Week 4, 20h)

### Day 18–19: Marketplace Curator (7h)
- [ ] Create `src/marketplace/curator-agent.ts`
  - [ ] Agent: "marketplace-curator" (haiku model)
  - [ ] Prompt: Rate template/asset on quality 0–10, suggest price, featured?
  - [ ] Input: item name, description, spec
  - [ ] Output: { quality, suggestedPrice, featured }
- [ ] Create `src/marketplace/item-evaluation.ts`
  - [ ] On upload: evaluateMarketplaceItem(creatorId, item, type)
  - [ ] Store: `marketplace_items (id, creator_id, type, quality, price)`
  - [ ] Feature: If quality > 8, add to featured items set
- [ ] Storage: Redis sorted sets `featured-items`, `trending-items`
- [ ] **Test:** Upload 5 items, verify quality scores + pricing

### Day 19–20: Trending Algorithm (5h)
- [ ] Create `src/marketplace/trending.ts`
  - [ ] Score formula: (downloads + quality*10) × recency_multiplier
  - [ ] Recency: 1.0 (recent) → 0.5 (30d old)
  - [ ] Cron: Daily recompute trending-items sorted set
- [ ] UI: Featured + trending sections on marketplace
- [ ] Analytics: Track trending changes over time
- [ ] **Test:** Item with 100 downloads + quality 9 scores highest

### Day 20–21: Stripe Connect Payouts (6h)
- [ ] Create `src/marketplace/payout-handler.ts`
  - [ ] On purchase: chargeMarketplaceDownload(buyerId, itemId)
  - [ ] Split: creator_amount = price * 0.7, platform = price * 0.3
  - [ ] Create: stripe.transfers.create({ amount, destination: creatorStripeId })
  - [ ] Track: `creator_earnings (creator_id, item_id, amount, status)`
- [ ] Webhook: Handle marketplace_download confirmed
- [ ] Reconciliation: Monthly match transfers vs database
- [ ] **Acceptance:** Creator receives $7 within 24h of $10 sale

### Day 21–22: Referral System (6h)
- [ ] Create `src/growth/referral-system.ts`
  - [ ] Track: referral_url per game (gameId?ref=creatorId)
  - [ ] On visit: Store referral in session
  - [ ] On signup: Link to referrer
  - [ ] Trigger reward: If referred user builds game in 7 days
- [ ] Reward: $5 (500 tokens) to referrer account
- [ ] Table: `referral_rewards (referrer_id, referree_id, amount, status)`
- [ ] Payout: Trigger when referrer hits $20 minimum
- [ ] **Test:** Create game → share → friend visits → builds game → reward awarded

### Day 22–23: Watermark + CTR Tracking (4h)
- [ ] Create `src/growth/watermark.ts`
  - [ ] Generate: Watermark config (gold #FFB81C, bottom-right, 12px)
  - [ ] Embed: In game preview video via FFmpeg
  - [ ] Link: forjegames.com/?ref=creatorId
  - [ ] Track: watermark_clicks table
- [ ] Create `src/growth/ctr-analytics.ts`
  - [ ] Query: clicks per source (YouTube, Discord, Twitter)
  - [ ] Metric: CTR = clicks / impressions
  - [ ] Feature: If CTR > 5%, add to homepage featured
- [ ] **Test:** Generate watermark, verify embed + tracking link

### Day 23–24: Auto-Generated Share Cards (4h)
- [ ] Create `src/growth/share-card.ts`
  - [ ] On publish: Trigger content-writer agent (haiku)
  - [ ] Prompt: 1-sentence viral tweet for game
  - [ ] Generate: Image card via Fal (1200×630)
  - [ ] Store: game.share_card, game.share_copy, game.referral_url
- [ ] Create `src/growth/discord-poster.ts`
  - [ ] If creator has Discord webhook: Auto-post to server
  - [ ] Include: Share card image + copy + referral link
- [ ] **Test:** Publish game → share card + copy auto-generated

---

## CROSS-PHASE ACTIVITIES

### Metrics & Monitoring (Ongoing)
- [ ] Set up Sentry (error tracking)
- [ ] Add DataDog APM (agent latency monitoring)
- [ ] Create Grafana dashboard:
  - [ ] Agent pool concurrency (target: 5)
  - [ ] Cache hit rate (target: 40%+)
  - [ ] API cost per game (target: $0.10)
  - [ ] Prompt success rate (target: 92%+)

### Testing Strategy
- [ ] Unit tests: Router, gate, cache logic
- [ ] Integration tests: Agent dispatch + shared memory
- [ ] Load tests: 100 concurrent agents via PQueue
- [ ] E2E tests: Full referral loop (game → share → signup → build → reward)

### Documentation
- [ ] API docs: Agent dispatch, model routing, team isolation
- [ ] Setup guide: Deploy checklist, env vars, Stripe keys
- [ ] Architecture diagram: 5 layers (pool, routing, memory, agents, business)
- [ ] Runbook: Debug latency, fix prompt, resolve conflicts

---

## GO/NO-GO DECISION POINTS

### End of Week 1 (Agent Foundation)
- [ ] PQueue managing 5 concurrent agents reliably
- [ ] Cost tracking matches actual API bills
- [ ] Redis shared memory with version control working
- [ ] **DECISION:** Proceed to Week 2? (Expected: YES)

### End of Week 2 (Self-Improvement)
- [ ] 90% cache hit rate on repeated patterns
- [ ] Prompt failure detection + auto-fix working
- [ ] Templates extracted and reused successfully
- [ ] **DECISION:** Ship MVP (foundation + caching)? (Expected: YES)

### End of Week 3 (Business)
- [ ] Team isolation + rate limiting working
- [ ] Stripe metering billing accurate
- [ ] Creator earnings dashboard real-time
- [ ] **DECISION:** Enable marketplace? (Expected: YES)

### End of Week 4 (Growth)
- [ ] Marketplace curator evaluating items
- [ ] Referral rewards paying out correctly
- [ ] Watermark CTR > 5% (or adjust strategy)
- [ ] **DECISION:** Launch full autonomous platform? (Expected: YES)

---

## RISK MITIGATION

### Technical Risks
| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Redis connection pool full | Low | Connection pooling + max pool size config |
| Stripe API quota exceeded | Low | Batch requests + caching recent transfers |
| Claude API rate limit hit | Low | Prompt caching (90% reduction) + haiku routing |
| PQueue deadlock | Very low | 3s timeout + circuit breaker pattern |

### Schedule Risks
| Risk | Mitigation |
|------|-----------|
| Week 1 overruns | PQueue is 4h → pad 2 weeks buffer |
| Stripe integration delay | Use existing @stripe-expert knowledge + MCP |
| Schema redesign needed | Start simple (namespace isolation), add CRDT later |

---

## SUCCESS CRITERIA (End of Month)

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| API cost/game | $0.50 | $0.10 | TBD |
| Build time | 45s | 15s | TBD |
| Cache hit rate | 0% | 40%+ | TBD |
| Prompt success | 75% | 92%+ | TBD |
| Referral k-factor | 0 | 0.25–0.35 | TBD |
| Creator earnings (real-time) | Manual | Dashboard | TBD |
| Marketplace items | 0 | 20+ | TBD |
| Monthly cost @ 1K MAU | $60 | $12 | TBD |

---

## SIGN-OFF

**Researcher:** Claude Code Agent
**Date Completed:** 2026-03-29
**Implementation Owner:** [To be assigned]
**Architecture Review:** [To be scheduled]
**Launch Date:** [Start date + 4 weeks]

