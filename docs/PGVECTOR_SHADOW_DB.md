# Shadow database with pgvector

## The problem

When you run `prisma migrate dev`, Prisma spins up a **shadow database** — a
temporary second database it uses to diff your schema against the migration
history. The shadow DB runs every migration from scratch, including:

```
prisma/migrations/20260406000000_add_pgvector_rag/migration.sql
```

…which starts with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

A stock Postgres install (like the `postgres:16` Docker image, or the
Postgres on `localhost:5432` in most local setups) does **not** ship with
the `vector` (pgvector) extension compiled in, so the `CREATE EXTENSION`
call fails with:

```
ERROR: could not open extension control file ".../extension/vector.control": No such file or directory
```

By default Prisma will create the shadow DB on the same server as
`DATABASE_URL`, so it inherits the same missing-extension problem. The fix
is to point Prisma at a **separate** shadow database that already has
pgvector installed.

## The fix

`prisma/schema.prisma` now declares an explicit `shadowDatabaseUrl`:

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

You have two ways to provide a pgvector-capable shadow DB. Pick one.

---

## Option A — local Docker sidecar (recommended for local dev)

There's a pre-wired `docker-compose.shadow-db.yml` at the repo root that
runs `pgvector/pgvector:pg16` on port **5433** (so it won't collide with
your main Postgres on 5432).

```bash
# 1. Start it (first run pulls the image, ~80 MB)
npm run db:shadow

# 2. Make sure .env has this line (it's already in .env and .env.local):
#    SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/shadow

# 3. Run your migration
npx prisma migrate dev --name add-beta-invites

# 4. When you're done for the day (optional — it's cheap to leave running)
npm run db:shadow:down
```

The shadow container has **no persistent volume** on purpose. Prisma
nukes the shadow DB on every `migrate dev` run anyway, so keeping data
around would be pointless.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| `port 5433 already allocated` | Another process is on 5433. Either stop it, or edit `docker-compose.shadow-db.yml` to use a different host port (e.g. `5434:5432`) and update `SHADOW_DATABASE_URL` to match. |
| `docker: command not found` | Install Docker Desktop, or use Option B. |
| `Cannot connect to the Docker daemon` | Start Docker Desktop and wait for the whale icon to stop animating. |
| Windows API version 500 error from `docker ps` | Restart Docker Desktop fully (right-click tray icon → Quit, then relaunch). |

---

## Option B — dedicated Neon branch (recommended if you hate Docker)

Neon's free tier supports multiple branches per project, and every Neon
branch has `pgvector` pre-installed. Create a dedicated empty branch just
for Prisma's shadow use:

1. Go to https://console.neon.tech → your project → **Branches** → **New Branch**
2. Name it something like `prisma-shadow`
3. Start from a **clean state** (don't copy data — the shadow DB needs to
   be empty so Prisma can replay all migrations)
4. Copy the branch's connection string (the **pooled** URL is fine)
5. Paste it into your local `.env` as `SHADOW_DATABASE_URL`:

   ```
   SHADOW_DATABASE_URL=postgresql://...neon.tech/prisma_shadow?sslmode=require
   ```

6. Run `npx prisma migrate dev --name add-beta-invites`

**Warning:** never point `SHADOW_DATABASE_URL` at a Neon branch that has
real data — Prisma will drop and recreate everything in the shadow DB
every time you run `migrate dev`.

---

## Why not just `prisma migrate deploy`?

`migrate deploy` runs the migration on the main DB without using a shadow
database, so it sidesteps this whole issue — but it won't generate new
migrations from schema changes, it only applies pre-existing ones. We
still need `migrate dev` for authoring `add-beta-invites` and any future
migrations.

## Why not make the migration's `CREATE EXTENSION` optional?

We already use `IF NOT EXISTS`. The issue isn't that the extension is
*already* there — it's that pgvector isn't available to *install at all*
on vanilla Postgres builds. Removing the `CREATE EXTENSION` call would
mean relying on someone having pre-created the extension out of band,
which is fragile and breaks clean-room CI runs.
