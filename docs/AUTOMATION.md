# ForjeGames Automation Schedule

All automated Claude agents that run without human intervention.
**Max 2 triggers running concurrently** to stay within limits.

## Active Scheduled Triggers (Claude Code Remote)

Managed at: https://claude.ai/code/scheduled

| Agent | Schedule (MDT) | Frequency | What it does |
|-------|----------------|-----------|--------------|
| **24/7 Builder** | 10pm daily | Every 24h | Rotates focus: Mon=AI, Tue=UX, Wed=Payments, Thu=Plugin, Fri=SEO, Sat=Code Review, Sun=Cleanup |
| **AI Quality Grinder** | 2am/10am/6pm | Every 8h | Expands object library (+5-10 recipes), error-fix patterns, game templates, system prompts |
| **Night Shift Feature Builder** | 12am daily | Every 24h | Picks one feature from backlog, builds it completely (conversion, retention, or growth features) |
| **Conversion Optimizer** | 4am Tue/Thu/Sat | 3x/week | Optimizes landing/pricing/signup pages for conversion: copy, CTAs, SEO, mobile, paywalls |
| **SEO & Content Writer** | 8am Mon/Wed/Fri | 3x/week | Writes 1 blog post per run targeting Roblox search terms |
| **End-of-Week Wrap** | 9pm Sunday | Weekly | Verifies build, reviews week's PRs, writes report, plans next week |

### Schedule Stagger (UTC)

To avoid 2 running at the same time:

```
03:00 UTC (9pm MDT)  — End-of-Week (Sunday only)
04:00 UTC (10pm MDT) — 24/7 Builder (daily)
06:00 UTC (12am MDT) — Night Shift Feature Builder (daily)
08:00 UTC (2am MDT)  — AI Quality Grinder
10:00 UTC (4am MDT)  — Conversion Optimizer (Tue/Thu/Sat)
14:00 UTC (8am MDT)  — SEO Content Writer (Mon/Wed/Fri)
16:00 UTC (10am MDT) — AI Quality Grinder
00:00 UTC (6pm MDT)  — AI Quality Grinder
```

Worst case overlap: 24/7 Builder (04:00) could overlap with AI Quality Grinder (08:00) if the builder runs long. Both create separate branches so no conflicts.

## GitHub Actions

| Workflow | Schedule | What it does |
|----------|----------|--------------|
| **Discord Bug Intake** | Every 6h | Polls Discord bug channels, creates GitHub issues for new bugs |
| CI | On push/PR | Build + type check |
| Deploy Production | On push to main | Vercel deploy |
| Deploy Staging | On push to staging | Vercel staging deploy |

## Vercel Crons

| Route | Schedule | What it does |
|-------|----------|--------------|
| `/api/crons/stripe-reconcile` | Daily 4am UTC | Reconciles Stripe subscriptions with DB |
| `/api/crons/email-drip` | Every 2h | Sends Day 1/3/7 drip emails to free signups |

## How Agents Create PRs

Every scheduled agent:
1. Creates branch: `claude/[focus]-YYYY-MM-DD[-HH]`
2. Makes changes (max 10-15 files)
3. Commits with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
4. Opens a PR against `main`

**Dawsen reviews and merges PRs.** Agents never push directly to main.

## Adding/Changing Schedules

- Remote triggers: https://claude.ai/code/scheduled (or ask Claude Code to use `/schedule`)
- GitHub Actions: `.github/workflows/discord-bug-intake.yml`
- Vercel crons: `vercel.json` → `crons` array
- **Rule: max 2 concurrent agents.** Check the stagger table before adding new ones.

## Secrets Required

### Remote Triggers
- None needed — triggers use repo access only (read code, write PRs)

### GitHub Actions
- `DISCORD_BOT_TOKEN` — for Discord bug polling (add in GitHub repo Settings > Secrets)

### Vercel Env Vars
- `CRON_SECRET` — protects cron endpoints
- `RESEND_API_KEY` — for drip emails
- All other env vars already configured
