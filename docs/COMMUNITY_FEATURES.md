# Community + Viral Systems

Reference for the community, gamification, and growth-loop systems that give
ForjeGames a moat over ropilot/forgegui/bloxtoolkit/userebirth.

## Overview

Four systems working together:

1. **Community interaction** — remix, share, react, spotlights, leaderboards
2. **Viral loops** — referral links, share attribution, reward ladders
3. **Gamification** — XP, levels, streaks, daily challenges, badges
4. **Polish layer** — toasts, confetti, onboarding, tooltips, empty states

The architecture is deliberately split into **pure business logic** (in
`src/lib/viral/`, `src/lib/daily-challenges.ts`) and **thin API routes** (in
`src/app/api/community/`). Pure modules are trivially testable and reusable;
routes handle auth + persistence.

---

## 1. Community API — `src/app/api/community/`

All routes accept Clerk auth and gracefully degrade to **demo mode** when no
session is present or the DB is unavailable. Demo responses are clearly flagged
with `demo: true` in the payload so the UI can render a realistic preview.

### `POST /api/community/remix`

Clones a public showcase project into the caller's account.

- **Body:** `{ projectId: string }`
- **Effects:**
  - Creates a new `Project` with `forkedFromId` pointing at the source.
  - Increments the source's `forkCount` in the same transaction.
  - Awards the remixer `FORK_GIVEN` XP.
  - Fire-and-forget awards the original author `FORK_RECEIVED` XP.
- **Errors:** 400 (bad projectId), 403 (private or remix disabled / self-remix),
  404 (not found).

### `POST /api/community/share`

Mints a shareable link with an OG preview image and tracks clicks.

- **Body:** `{ projectId, channel?, campaign? }`
- **Response:** `{ shareId, shareUrl, ogImageUrl, expiresAt, xp }`
- **URL format:** `https://forjegames.com/p/<slug>?ref=<userKey>.<channel>.<campaign>&sid=<shareId>`
- **Awards:** `SHARE_CREATED` XP to the sharer.
- **Persistence:** writes to `ShareEvent` if the model exists; otherwise
  returns the URL without logging (graceful degradation).

### `POST /api/community/react`

Emoji reactions: 👍 ❤️ 🔥 🎮.

- **Body:** `{ projectId, emoji }`
- **Effects:** Upserts a `ProjectReaction`. Re-posting the same emoji toggles
  it off. Posting a different emoji replaces the previous one (one reaction per
  user per project).
- **Awards:** The project author gets `LIKE_RECEIVED` XP **only on the first
  reaction per user** to prevent spam.
- **Response:** Full aggregate counts for all four emojis plus the caller's
  current reaction.

### `GET /api/community/weekly-spotlight`

Top 5 trending projects this week.

- **Cached:** 10 minutes via `export const revalidate = 600`.
- **Scoring formula:**
  ```
  score = forks * 1.0 + reactions * 0.3 + recencyBonus
  recencyBonus = max(0, 7 - ageInDays) * 0.5
  ```
- **Week definition:** Monday 00:00 UTC to the following Monday 00:00 UTC.

### `GET /api/community/creator-leaderboard`

Public creator leaderboard.

- **Query:** `?sort=xp|forks|likes&limit=25` (max 100)
- **Response:** Ranked list with `rank, userId, username, avatarUrl, xp,
  level, totalForks, totalLikes`.
- **Denormalization:** Prefers `User.totalForks` / `User.totalLikes` columns if
  present; falls back to XP-only sort if those columns don't exist yet.

### `GET|POST /api/community/daily-challenge`

Featured daily challenge + submissions.

- **GET:** Returns today's challenge (rotates daily by UTC date) and the UTC
  reset timestamp. Cached 1 hour.
- **POST body:** `{ challengeId, projectId, notes? }`
- **POST rules:**
  - The `challengeId` **must** match today's active challenge.
  - Only one submission per user per day awards XP (`CHALLENGE_COMPLETE`).
  - Subsequent submissions return `alreadySubmittedToday: true`.

---

## 2. Viral Loops — `src/lib/viral/`

Pure modules. No DB, no fetch. Unit-test all of this with confidence.

### `xp-engine.ts`

Defines `XpAction` + fixed XP amounts in `XP_AMOUNTS`. Level math is
sub-quadratic: `xpForLevel(level) = 50 * (level-1) * level`.

- `grantXp(currentXp, action)` — pure; returns the full grant result including
  level-up detection and progress percentage.
- `levelForXp(totalXp)` — inverse of `xpForLevel`.
- `computeProgress(totalXp)` — returns current level, xp into level, xp to next,
  progress percentage.
- `LEVEL_REWARDS` — ladder of unlocks (cosmetics, credits, features, badges,
  titles).

### `streaks.ts`

Daily streak tracking with grace days.

- `recordActivity(state, now)` — returns updated state + delta (incremented,
  broken, graceUsed, milestone reached).
- **Grace:** Default 2 grace days per rolling 30-day window. A 1-day miss
  consumes 1 grace day instead of resetting the streak.
- **Milestones:** 7-day, 30-day, 100-day — returned on the tick where they're
  first hit, so the caller can celebrate.
- All dates handled in UTC via `toUtcDateString(Date)` — no timezone bugs.

### `referral-link.ts`

Token format: `userKey.channel.campaign?`

- `generateUserKey(stableId)` — deterministic FNV-1a hash → base36, 10 chars.
- `buildReferralUrl(baseUrl, token, extraParams?)` — sets `?ref=...` and any
  extras.
- `extractReferralFromRequest(Request)` — edge-runtime safe.
- All components are validated against a safe-character regex; malformed tokens
  return `null`.

### `share-text-builder.ts`

Context-aware share copy per platform.

- `buildShareText(ctx, platform)` where `ctx` is one of `project`,
  `achievement`, `milestone`.
- Returns `{ text, url, hashtags, href? }` — `href` is a prebuilt platform
  intent URL where applicable (Twitter, Reddit, Threads, Bluesky).
- Per-platform character-limit truncation is handled automatically.

### `viral-loop.ts`

Attribution rules for referrals.

- `attributeSignup(ctx)` — returns whether a signup should be credited and,
  if so, the inviter's XP grant result. Rejects self-referrals, already-
  credited pairs, and visitors whose account is "too new" (fraud guard).
- `REFERRAL_REWARD_LADDER` — `1 / 3 / 5 / 10 / 25 / 50 / 100` conversions
  unlock XP, credits, or badges.
- `unlockedReferralTiers(previousCount, newCount)` — idempotent diff so
  rewards are never paid twice.
- `viralCoefficient(cohort, sharesPerUser, convPerShare)` — convenience
  analytics helper.

---

## 3. Daily Challenges — `src/lib/daily-challenges.ts`

30 curated challenges with difficulty (beginner / intermediate / expert),
theme (obby, tycoon, simulator, pvp, horror, racing, rpg, parkour, puzzle,
sandbox, story, social), concrete success criteria, and XP rewards.

- `getTodaysChallenge()` — deterministic by UTC date. Same date, same challenge
  for every user worldwide.
- `getUpcomingChallenges(days)` — admin preview of the next N days.
- `getChallengesByDifficulty(d)` / `getChallengesByTheme(t)` — filters.
- **Do not renumber existing `id` fields.** Append new challenges only.

---

## 4. Polish Components — `src/components/polish/`

All components are accessible by default (ARIA, keyboard nav, focus trapping,
reduced motion) and usable without the design system.

| Component | Purpose |
|-----------|---------|
| `EmptyState` | Beautiful empty views (editor, gallery, marketplace, admin) |
| `LoadingShimmer` | Skeleton loaders: text / card / image / list / avatar / button |
| `ConfettiBurst` | Pure-CSS confetti for first-build / first-purchase / milestones |
| `Toast` + `ToastCenter` | Headless toast system with `useToast()` hook |
| `KeyboardShortcutsModal` | Shortcuts reference grouped by category |
| `OnboardingTour` | Guided tour with DOM highlighting and step nav |
| `Tooltip` | Accessible tooltip with smart viewport-aware positioning |
| `Avatar` | Roblox-style headshot fetcher with initials fallback |
| `Badge` | Earned badges with rarity tiers and shine animation |

Import from the barrel: `import { EmptyState, useToast } from '@/components/polish'`

---

## 5. Premium Components — `src/components/premium/`

| Component | Purpose |
|-----------|---------|
| `GoldShimmer` | Animated gold text/background for PRO surfaces |
| `ProBadge` | Tier badge (`free / starter / pro / studio / enterprise`) |
| `UpgradeNudge` | Smart upgrade prompt with dismissal + cooldown in localStorage |
| `CreditCounter` | Animated credit balance with low-balance warning + callback |

---

## Wiring things together

The typical request flow for a user remixing a project:

```
UI button "Remix"
  ↓ POST /api/community/remix { projectId }
    ↓ auth() → user
    ↓ db.$transaction([create forked project, increment forkCount])
    ↓ grantXp(user.xp, 'FORK_GIVEN') → update user
    ↓ (async) grantXp(author.xp, 'FORK_RECEIVED') → update author
  ↓ response { forkedProjectId, xp }
UI:
  useToast().toast({ title: `+10 XP`, severity: 'success' })
  if (xp.leveledUp) <ConfettiBurst active onComplete={...} />
  router.push(`/projects/${forkedProjectId}`)
```

## Future work

- Move `ShareEvent`, `ProjectReaction`, `ChallengeSubmission` models from
  opportunistic writes into a migration. They're currently tolerated as
  optional in the route handlers so deploy can ship without a schema change.
- Add a weekly digest email (hook into `src/lib/email-templates/`) summarizing
  the user's XP, new badges, remix count, and the week's top spotlight projects.
- A/B-test UpgradeNudge cooldowns — 7 days is a guess, not measured.
- Add a Discord integration: post weekly-spotlight winners to a public channel.
