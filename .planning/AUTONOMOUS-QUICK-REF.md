# AUTONOMOUS PLATFORM — QUICK REFERENCE

## 4-Week Build Plan (~80 hours)

### WEEK 1: Agent Foundation (16h)
```typescript
// Core: PQueue + Redis shared memory + model routing
- [ ] PQueue (max 5 concurrent) for task scheduling
- [ ] Redis shared memory (game state with version control)
- [ ] Model routing: trivial→haiku, simple→sonnet, complex→opus
- [ ] Parallel dispatch: Promise.all() for 3+ independent tasks
- [ ] Cost tracking per agent/model
```

**Files to write:**
- `src/orchestration/agent-pool.ts` — PQueue + BullMQ setup
- `src/orchestration/model-router.ts` — Complexity detector + cost matrix
- `src/shared/game-state.ts` — Redis store with optimistic locking

---

### WEEK 2: Self-Improvement Loops (20h)
```typescript
// Core: Caching + quality gates + prompt improvement
- [ ] Analytics tracking (which agents, patterns, tokens)
- [ ] Cache high-repeat patterns (>10 uses, >$0.04 cost)
- [ ] Quality gate agent (haiku, 5-second review)
- [ ] Auto-prompt-improvement on score < 5 (Opus)
- [ ] A/B test new prompts (50% traffic)
- [ ] Template auto-generation from successful games
```

**Files to write:**
- `src/improvement/usage-analytics.ts` — Track agent usage
- `src/improvement/prompt-cache.ts` — Embedding-based caching
- `src/improvement/quality-gate.ts` — Output evaluation
- `src/improvement/template-generator.ts` — Auto-extract templates

---

### WEEK 3: Multi-Tenant Business (24h)
```typescript
// Core: Teams + rate limits + Stripe metering
- [ ] Team schema (agentConfig, rateLimit, stripeConnectId)
- [ ] Per-team Redis namespacing (team:${teamId}:game:${gameId})
- [ ] Rate limit enforcement (Free 10/mo, Pro 100/mo)
- [ ] Stripe metered usage billing
- [ ] Creator earnings dashboard (real-time)
```

**Files to write:**
- `src/business/team-model.ts` — Team data + config
- `src/business/rate-limiter.ts` — Per-team limit enforcement
- `src/business/stripe-metering.ts` — Usage-based billing
- `src/dashboard/creator-earnings.ts` — Real-time earnings UI

---

### WEEK 4: Growth Engines (20h)
```typescript
// Core: Marketplace curator + referral system + watermarks
- [ ] Marketplace item evaluation (haiku curator agent)
- [ ] Trending algorithm (downloads + quality × recency)
- [ ] Creator payouts via Stripe Connect (70/30 split)
- [ ] Referral reward system + tracking
- [ ] Watermark generation + CTR analytics
- [ ] Auto-generated share cards (Claude content writer)
```

**Files to write:**
- `src/marketplace/curator-agent.ts` — Auto-rate items
- `src/marketplace/trending.ts` — Trending algorithm + caching
- `src/growth/referral-system.ts` — Referral tracking + payouts
- `src/growth/watermark.ts` — Generate + embed watermarks
- `src/growth/share-card.ts` — Claude-generated share content

---

## AGENT ROSTER (Deploy in Order)

### Phase 1: Research Agents (Haiku, parallelize)
```
1. competitor-scout — Analyze competitor games
2. trend-analyzer — Identify trending mechanics
3. asset-auditor — Validate asset specs
4. marketplace-curator — Evaluate items (quality, price)
5. analytics-engineer — Compute metrics (trending, viral)
```

### Phase 2: Builder Agents (Sonnet)
```
6. roblox-builder — Write game systems
7. ui-builder — Build UI screens
8. economy-designer — Design game economy
9. template-generator — Extract templates from games
10. prompt-engineer — Fix failing prompts
```

### Phase 3: Review Agents (Mixed)
```
11. code-reviewer — Security + style (sonnet)
12. performance-auditor — Perf metrics (haiku)
13. output-evaluator — Quality gate (haiku)
14. architect — Design (opus, rare)
```

---

## COST ANALYSIS

| Item | Weekly | Monthly |
|------|--------|---------|
| Haiku agents | $2.00 | $8.00 |
| Sonnet agents | $12.00 | $48.00 |
| Opus agents | $1.00 | $4.00 |
| Cache hits (90% savings) | -$12.00 | -$48.00 |
| **Net at 1K MAU** | **$3.00** | **$12.00** |

**vs. No optimization:** $60/month → saves $48/month (80% reduction)

---

## METRICS TO TRACK

### Operational
- [ ] Agent pool concurrency (max 5)
- [ ] Queue depth (BullMQ)
- [ ] Model routing distribution (% haiku vs sonnet vs opus)
- [ ] Cache hit rate (target > 40%)

### Quality
- [ ] Output quality score (target > 7/10)
- [ ] Prompt success rate (target > 92%)
- [ ] Template reuse rate (target > 30%)

### Business
- [ ] Referral k-factor (target 0.25–0.35)
- [ ] Watermark CTR (target > 5%)
- [ ] Creator monthly earnings (real-time dashboard)
- [ ] Marketplace item velocity (downloads/week)

### Cost
- [ ] API cost per game (target $0.10)
- [ ] Cost per active user (target < $0.50/mo)
- [ ] Cache efficiency (tokens saved)

---

## DEPENDENCIES & BLOCKERS

```
Week 1 → Foundation (PQueue, Redis, routing)
   ├→ Week 2 (caching, prompts)
   ├→ Week 3 (team multi-tenancy) [after Day 2 of Week 1]
   └→ Week 4 (marketplace, referrals) [after Week 3]
```

**Risk 1:** Redis connection limits (solve: connection pooling)
**Risk 2:** Stripe API rate limits (solve: batch requests)
**Risk 3:** Claude API quota (solve: prompt caching + haiku routing)

---

## SUCCESS CRITERIA

| Criteria | Before | After |
|----------|--------|-------|
| API cost per game | $0.50 | $0.10 (5x) |
| Time to build game | 45s | 15s (3x) |
| Creator onboarding | Manual | Automated |
| Referral conversion | 0% | 5–10% |
| Cache hit rate | 0% | 40%+ |
| Prompt success rate | 75% | 92%+ |

---

## IMPLEMENTATION SEQUENCE

**Do this first (Day 1):**
1. PQueue setup + basic dispatch
2. Redis shared memory + versioning
3. Model router + complexity detection

**Then parallelize:**
- Week 1: Complete foundation
- Week 2+3: Caching + business (parallel after Day 2 of Week 1)
- Week 4: Growth engines

**Go live with:**
- MVP: Week 2 (basic agent pool + caching)
- Full: Week 4 (all 4 pillars)

---

## REFERENCE FILES

**Full research:** `C:\Users\Dawse\OneDrive\Desktop\roblox-map-building\.planning\AUTONOMOUS-RESEARCH.md`

**Agent memory:** `C:\Users\Dawse\.claude\agent-memory\researcher\autonomous-self-evolving-platform-2026.md`

**Supporting docs:**
- Multi-agent patterns: `multi-agent-orchestration-2026.md`
- RobloxForge architecture: `robloxforge_architecture.md`
- Stripe integration: `stripe-latest-2025-2026-patterns.md`

