---
phase: 07
plan: game-dna-team-collab
subsystem: game-dna, team-collaboration
tags: [dna-scanner, team, rbac, presence, versioning, recharts, socket-io, claude-vision]
requirements: [DNA-01, DNA-02, DNA-03, DNA-04, TEAM-01, TEAM-02, TEAM-03, TEAM-04]
dependency-graph:
  requires: [prisma-schema, anthropic-provider, redis, hono-api, clerk-auth]
  provides:
    - GameScan + GameGenome Prisma models
    - Team, TeamMember, TeamInvite, TeamActivity, ZoneLock Prisma models
    - ProjectVersion + VersionDiff Prisma models
    - POST /api/dna/scan — async DNA analysis pipeline
    - GET /api/dna/scans, GET /api/dna/:id
    - POST /api/teams, team CRUD, invite/accept, zone lock
    - PUT /api/teams/:id/members/:memberId/role
    - GET/POST /api/projects/:id/versions
    - GET /api/projects/:id/diff
    - POST /api/projects/:id/rollback
    - /game-dna, /game-dna/[id], /game-dna/compare pages
    - /team, /team/settings, /team/history, /team/join/[token] pages
    - PresenceIndicator, ActivityFeed components
    - Socket.io server lib (graceful degradation if not installed)
  affects: [navigation, AppSidebar, dashboard-quick-actions]
tech-stack:
  added: [recharts (pre-installed), socket.io (graceful degradation), Hono routes pattern]
  patterns:
    - Async fire-and-forget scan with polling for status
    - Claude genome extraction via structured JSON prompt
    - Roblox public API for universe + game data fetch
    - Socket.io progressive enhancement (fails gracefully without package)
    - Role hierarchy enforcement in Hono middleware helpers
    - Diff caching via VersionDiff model
    - Rollback as new version (non-destructive)
key-files:
  created:
    - prisma/schema.prisma (extended with 9 new models + enums)
    - apps/api/src/routes/dna/scan.ts
    - apps/api/src/routes/teams.ts
    - apps/api/src/routes/versions.ts
    - apps/api/src/lib/socket.ts
    - src/app/(app)/game-dna/page.tsx
    - src/app/(app)/game-dna/[id]/page.tsx
    - src/app/(app)/game-dna/compare/page.tsx
    - src/app/(app)/team/page.tsx
    - src/app/(app)/team/settings/page.tsx
    - src/app/(app)/team/history/page.tsx
    - src/app/(app)/team/join/[token]/page.tsx
    - src/components/PresenceIndicator.tsx
    - src/components/ActivityFeed.tsx
  modified:
    - apps/api/src/index.ts (registered dnaRoutes, teamRoutes, versionRoutes)
decisions:
  - Socket.io installed as graceful degradation only — exports no-op factory if package missing; prevents build failure while allowing progressive enhancement when installed
  - Rollback is non-destructive — creates a new version with old snapshot rather than deleting history
  - DNA scan is async (202 Accepted) with client-side polling rather than blocking HTTP — prevents timeout on slow Claude analysis
  - Roblox API used without key (public endpoints only) — universe ID resolution then game details fetch
  - Diff computation cached in VersionDiff model — repeated diff requests are served from DB
  - Zone locking uses upsert with unique constraint on zoneId — concurrent claims resolved at DB level
metrics:
  duration: "~45 minutes"
  completed: "2026-03-28"
  tasks: 11
  files: 14 created, 2 modified
---

# Phase 07: Game DNA Scanner + Team Collaboration Summary

## One-Liner

Claude-powered 12-variable Roblox game genome extraction with radar charts and real-time team collaboration including RBAC, zone locking, Socket.io presence, and non-destructive version history.

## What Was Built

### DNA-01: Game DNA Input Screen
- `/game-dna` — URL paste input + Scan button + recent scans list with status badges
- Polling animation during active scan (DNA helix CSS animation, 2.5s polling interval)
- Auto-navigates to report on COMPLETE, shows error on FAILED

### DNA-02: Analysis Engine
- `POST /api/dna/scan` — validates Roblox URL, creates pending scan, fires async analysis
- Roblox public API: universe ID resolution → game data (visits, playing, genre, favorites)
- Claude 3.5 Sonnet extracts 12-variable genome via structured JSON prompt
- Genome persisted to `GameGenome` with scores (0-100), genre averages, recommendations
- `GET /api/dna/scans` + `GET /api/dna/:id` for list and detail

### DNA-03: Report UI
- `/game-dna/[id]` — full genome profile grid (12 attribute chips)
- Recharts `RadarChart` — this game vs genre average with dual Radar traces
- Monetization breakdown with animated progress bars (4 revenue streams)
- Progression `LineChart` — new player vs engaged player % over 20 weeks
- Strategic recommendations panel (numbered, sourced from Claude)
- Export PDF via `window.print()`

### DNA-04: Comparison Mode
- `/game-dna/compare` — select 2 completed scans from dropdowns
- Side-by-side individual radars + overlay radar with Legend
- Attribute comparison table with score deltas + win/lose labels
- Strategic gaps section: top 4 lags and top 4 leads for Game A

### TEAM-01: Team Creation + Invites
- `POST /api/teams` — creates team + auto-adds creator as OWNER
- `GET /api/teams` — lists user's teams with memberCount + myRole
- `POST /api/teams/:id/invite` — generates 7-day expiry invite token + shareable URL
- `GET /api/teams/invite/:token` — accept invite, adds member, records activity
- `/team` page with create modal, invite panel (email + role), invite link copy
- `/team/join/[token]` — auto-accepts invite on load with success/error UI

### TEAM-02: Real-Time Presence
- `apps/api/src/lib/socket.ts` — Socket.io server factory with room-based presence
- In-memory presence store with color assignment (deterministic per userId)
- Events: `room:join`, `room:leave`, `cursor:move`, `activity:emit`, `presence:update`, `activity:new`
- `PresenceIndicator` — shows online avatars, connection dot, overflow count; uses socket.io-client dynamically
- `ActivityFeed` — dual-mode (socket live + 15s polling fallback); action icon mapping

### TEAM-03: Permission Management
- `requireTeamMember()` helper with role hierarchy: OWNER > ADMIN > EDITOR > VIEWER
- `PUT /api/teams/:id/members/:memberId/role` — admin-only role assignment
- `DELETE /api/teams/:id/members/:memberId` — remove member
- Zone lock endpoints: `GET`, `POST /lock`, `DELETE /:zoneId`
- `/team/settings` — role management table with inline select + remove buttons

### TEAM-04: Version History
- `POST /api/projects/:id/versions` — creates snapshot with auto-incrementing version number
- `GET /api/projects/:id/versions` — paginated list (no snapshot payload)
- `GET /api/projects/:id/diff` — computes JSON diff (added/modified/removed/changes), caches in `VersionDiff`
- `POST /api/projects/:id/rollback` — creates new version from old snapshot (non-destructive)
- `/team/history` — timeline with From/To selector, diff panel, rollback button

## Prisma Models Added

| Model | Purpose |
|---|---|
| `GameScan` | Tracks scan status per user |
| `GameGenome` | 12-variable genome + scores + recommendations |
| `ScanStatus` | PENDING / PROCESSING / COMPLETE / FAILED |
| `Team` | Team entity with slug |
| `TeamMember` | userId + role + joinedAt |
| `TeamRole` | OWNER / ADMIN / EDITOR / VIEWER |
| `TeamInvite` | Token-based invite with expiry |
| `InviteStatus` | PENDING / ACCEPTED / EXPIRED / REVOKED |
| `TeamActivity` | Activity feed log |
| `ZoneLock` | Exclusive zone claim with TTL |
| `ProjectVersion` | Snapshot + version number |
| `VersionDiff` | Cached diff between two versions |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Socket.io graceful degradation**
- **Found during:** Task 5 (socket.ts creation)
- **Issue:** socket.io package not installed in apps/api — import would crash the server
- **Fix:** Used dynamic `require('socket.io')` wrapped in try/catch; exports no-op factory if package missing; logs clear install instruction
- **Files modified:** apps/api/src/lib/socket.ts
- **Commit:** b2e7dc2

**2. [Rule 2 - Missing] Role hierarchy enforcement**
- **Found during:** Task 3 (teams.ts)
- **Issue:** Plan specified role assignment but didn't define hierarchy enforcement
- **Fix:** Added `requireTeamMember()` helper with numeric hierarchy map; ADMIN cannot promote to ADMIN (owner-only); OWNER cannot be removed or role-changed
- **Files modified:** apps/api/src/routes/teams.ts

**3. [Rule 2 - Missing] Zone lock auto-expiry cleanup**
- **Found during:** Task 3 (zone endpoints)
- **Issue:** Expired locks would accumulate without cleanup
- **Fix:** Added `deleteMany` for expired locks on every GET /zones request (cheap scan with indexed expiresAt)
- **Files modified:** apps/api/src/routes/teams.ts

## Known Stubs

- `PresenceIndicator` shows userId prefix (`{userId}.slice(0,12)`) in member list instead of resolved display names — real names require a user profile lookup endpoint (not yet built)
- ActivityFeed shows raw userId strings — same resolution gap
- PDF export uses `window.print()` — a proper PDF library (e.g., `jspdf`) would give better formatting; marked as pragmatic MVP

## Self-Check: PASSED

Files verified present:
- apps/api/src/routes/dna/scan.ts
- apps/api/src/routes/teams.ts
- apps/api/src/routes/versions.ts
- apps/api/src/lib/socket.ts
- src/app/(app)/game-dna/page.tsx
- src/app/(app)/game-dna/[id]/page.tsx
- src/app/(app)/game-dna/compare/page.tsx
- src/app/(app)/team/page.tsx
- src/app/(app)/team/settings/page.tsx
- src/app/(app)/team/history/page.tsx
- src/app/(app)/team/join/[token]/page.tsx
- src/components/PresenceIndicator.tsx
- src/components/ActivityFeed.tsx
- .planning/phases/07-game-dna-team-collab/07-SUMMARY.md

Commits verified:
- abfbee6 — Prisma schema additions
- b2e7dc2 — API routes (DNA, teams, versions)
- c5e21c0 — DNA pages + presence components
- 27f4096 — Team pages
