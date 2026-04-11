# Secrets Location

## Why secrets live outside the project

The project root `C:\Users\Dawse\OneDrive\Desktop\roblox-map-building\` lives
inside **OneDrive**, which continuously syncs to Microsoft's cloud. Keeping
`.env*` files (with live Stripe keys, Clerk secrets, DB credentials, Vercel
OIDC tokens, etc.) inside a cloud-synced folder is a security risk even if
`.gitignore` excludes them from git.

## Where secrets actually live

All real secret env files have been **moved** (not copied) to a local-only
directory that is **not** synced by OneDrive:

```
C:\Users\Dawse\.forjegames-secrets\
```

Current contents:

| File | Purpose |
| --- | --- |
| `.env` | Base env (local dev DB URLs) |
| `.env.local` | Local dev overrides (Clerk, Stripe test, Anthropic, etc.) |
| `.env.prod` | **LIVE Stripe production key** and other prod secrets |
| `.env.vercel` | Vercel OIDC token (dev environment) |
| `.env.vercel.local` | Vercel OIDC token (local) |
| `.env.production.local` | Pulled from Vercel via `vercel env pull` |
| `.env.check.local` | Older Vercel env pull snapshot |

The only `.env*` file that remains **inside** the project root is
`.env.example`, which is a sanitized template and is safe to commit.

## How the project still finds them (symlinks)

Directory-junction-style symlinks have been created from the original
locations back to `C:\Users\Dawse\.forjegames-secrets\`, so tooling like
Next.js, Prisma, the Vercel CLI, and scripts that expect these files in the
project root continue to work unchanged:

```
<project>\.env                          -> ~\.forjegames-secrets\.env
<project>\.env.local                    -> ~\.forjegames-secrets\.env.local
<project>\.env.prod                     -> ~\.forjegames-secrets\.env.prod
<project>\.env.vercel                   -> ~\.forjegames-secrets\.env.vercel
<project>\.env.vercel.local             -> ~\.forjegames-secrets\.env.vercel.local
<project>\.vercel\.env.production.local -> ~\.forjegames-secrets\.env.production.local
<project>\.vercel\.env.check.local      -> ~\.forjegames-secrets\.env.check.local
```

OneDrive treats symlinks as placeholder files and does not upload the target
contents, so the real secrets stay on disk only.

## Recreating the symlinks (fresh machine or if they get deleted)

Symlink creation on Windows requires either **Developer Mode** enabled in
Settings -> Privacy & Security -> For developers, **or** an elevated
(Administrator) terminal.

From an admin `cmd.exe` at the project root:

```bat
mklink .env                           C:\Users\Dawse\.forjegames-secrets\.env
mklink .env.local                     C:\Users\Dawse\.forjegames-secrets\.env.local
mklink .env.prod                      C:\Users\Dawse\.forjegames-secrets\.env.prod
mklink .env.vercel                    C:\Users\Dawse\.forjegames-secrets\.env.vercel
mklink .env.vercel.local              C:\Users\Dawse\.forjegames-secrets\.env.vercel.local
mklink .vercel\.env.production.local  C:\Users\Dawse\.forjegames-secrets\.env.production.local
mklink .vercel\.env.check.local       C:\Users\Dawse\.forjegames-secrets\.env.check.local
```

If you cannot create symlinks for any reason, you can always regenerate the
Vercel-managed files with:

```bash
vercel env pull .env.production.local --environment=production
vercel env pull .env.local              --environment=development
```

and hand-copy the rest from `C:\Users\Dawse\.forjegames-secrets\` back into
the project root (though this defeats the purpose of the move — prefer
symlinks).

## Rotation reminders

Because the previous copies of these files sat inside OneDrive for a period,
assume the secrets may have been synced to Microsoft servers. Rotate them on
the following cadence (see also `docs/secrets-rotation.md`):

- **Stripe live key (`sk_live_51SxCuZQm...`)** — rotate **immediately** in the
  Stripe dashboard (Developers -> API keys -> Roll key). Update the new value
  in:
  - Vercel production env vars
  - `C:\Users\Dawse\.forjegames-secrets\.env.prod`
- **Clerk secret key** — rotate in Clerk dashboard, update Vercel + local env.
- **Anthropic API key** — rotate at console.anthropic.com, update Vercel +
  local env.
- **Database credentials (Neon/local Postgres)** — rotate Neon role password,
  update `DATABASE_URL` / `DIRECT_URL` in Vercel + local env.
- **Vercel OIDC tokens** (`.env.vercel*`) — these are short-lived and auto-
  refresh via `vercel env pull` / `vercel dev`, no manual rotation needed.

After any rotation, run `vercel env pull` to refresh the local copy and
confirm the app still boots with `npm run dev`.

## Never do this

- **Never** copy these files back into OneDrive-synced folders.
- **Never** commit them to git (the `.gitignore` already excludes `.env.*`
  with an allow-list exception for `.env.example`).
- **Never** paste their contents into chat, issue trackers, screen shares,
  or CI logs.
