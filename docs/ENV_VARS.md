# Environment Variables

Complete reference for every environment variable used by the ForjeGames app.

Legend:
- **Required** — app will fail to boot (or fail in production) without it
- **Optional** — feature degrades gracefully if unset
- **Public** — prefixed with `NEXT_PUBLIC_`, shipped to the browser

Copy `.env.example` to `.env.local` for local dev, or into your Vercel project settings for production. Secrets are mirrored to the local symlinked store at `~/.forjegames-secrets/.env`.

Run `npm run secrets:generate` to generate random values for VAPID and Robux webhook secrets.

---

## Database

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `DATABASE_URL` | Yes | Pooled Postgres connection (PgBouncer / Supabase pooler). Used by Prisma at runtime. | Neon / Supabase / self-hosted |
| `DIRECT_URL` | Yes | Direct (non-pooled) Postgres connection. Used by Prisma for migrations and introspection. | Same host as `DATABASE_URL`, bypass pooler |
| `SHADOW_DATABASE_URL` | Required for `prisma migrate dev` | Shadow DB that must have the `vector` (pgvector) extension available. | Run `npm run db:shadow` for the local Docker container, or create an empty Neon branch. See `docs/PGVECTOR_SHADOW_DB.md`. |

## Redis / Upstash

Pick one. Upstash is recommended for serverless/edge deployments.

| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | Optional | Classic Redis/ioredis connection string. |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash REST URL (used by `@upstash/redis` and rate limiter). |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash REST token paired with the URL above. |

## Auth — Clerk

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (public) | Clerk publishable key (`pk_test_` or `pk_live_`). |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (`sk_test_` or `sk_live_`). |
| `CLERK_WEBHOOK_SECRET` | Yes | Svix signing secret for Clerk webhooks. |
| `CLERK_JWT_KEY` | Optional | RS256 base64-PEM JWT verification key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional (public) | Sign-in route. Default `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional (public) | Sign-up route. Default `/sign-up`. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Optional (public) | Redirect after sign-in. Default `/editor`. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Optional (public) | Redirect after sign-up. Default `/onboarding`. |

Source: https://dashboard.clerk.com

## Payments — Stripe

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes (prod) | Stripe server key (`sk_live_…`). |
| `STRIPE_RESTRICTED_KEY` | Optional | Restricted key for reporting workflows. |
| `STRIPE_WEBHOOK_SECRET` | Yes (prod) | Webhook signing secret (`whsec_…`). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes (public) | Publishable key for checkout forms. |
| `STRIPE_HOBBY_PRICE_ID` | Optional | Hobby plan monthly price ID. |
| `STRIPE_HOBBY_YEARLY_PRICE_ID` | Optional | Hobby plan yearly price ID. |
| `STRIPE_CREATOR_PRICE_ID` | Optional | Creator plan monthly price ID. |
| `STRIPE_CREATOR_YEARLY_PRICE_ID` | Optional | Creator plan yearly price ID. |
| `STRIPE_STUDIO_PRICE_ID` | Optional | Studio plan monthly price ID. |
| `STRIPE_STUDIO_YEARLY_PRICE_ID` | Optional | Studio plan yearly price ID. |
| `STRIPE_TOKEN_STARTER_PRICE_ID` | Optional | 1,000-token starter pack price ID. |
| `STRIPE_TOKEN_CREATOR_PRICE_ID` | Optional | 5,000-token creator pack price ID. |
| `STRIPE_TOKEN_PRO_PRICE_ID` | Optional | 15,000-token pro pack price ID. |
| `STRIPE_FREE_PRICE_ID` | Optional | Free tier placeholder. |
| `STRIPE_CHARITY_ACCOUNT_ID` | Optional | Stripe Connect account for charity payouts. |

Any missing price ID degrades to "Contact us" on the pricing page.

## Payments — Robux (NEW Apr 10)

| Variable | Required | Description |
|---|---|---|
| `ROBUX_WEBHOOK_SECRET` | Required if accepting Robux | HMAC-SHA256 secret signing Roblox payment callbacks. Must match the value in `ServerStorage > ForjeConfig > WebhookSecret` inside your Roblox place. Generate via `npm run secrets:generate`. |

## AI Providers

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (prod) | Claude (Anthropic). Primary LLM. |
| `ANTHROPIC_DISABLED` | Optional | Set to `true` to skip all Anthropic calls (CI / Groq-only mode). |
| `OPENAI_API_KEY` | Optional (NEW Apr 10) | Enables GPT-4o, GPT-4o-mini, o1-preview in the AI mode selector. Get from https://platform.openai.com/api-keys |
| `GEMINI_API_KEY` | Optional | Google Gemini. |
| `GROQ_API_KEY` | Optional | Groq LLM fallback (`src/lib/ai/provider.ts`). |
| `MESHY_API_KEY` | Optional | Meshy 3D generation. |
| `MESHY_WEBHOOK_SECRET` | Optional | Meshy webhook signature secret. |
| `FAL_KEY` | Optional | fal.ai image/video generation (SDK-specific name). |
| `FAL_API_KEY` | Optional | Alias for `FAL_KEY`. |
| `DEEPGRAM_API_KEY` | Optional | Deepgram speech-to-text. |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs text-to-speech. |

## Email — Resend

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes (prod) | Resend transactional email key. |
| `RESEND_AUDIENCE_ID` | Optional | Audience ID for email marketing list management. |
| `UNSUBSCRIBE_SECRET` | Yes (prod) | HMAC key signing email unsubscribe links. |

## SMS — Twilio

| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Optional | Twilio account SID. |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio auth token. |
| `TWILIO_FROM_NUMBER` | Optional | Sender phone number. |

## Web Push Notifications (NEW Apr 10)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes for push (public) | VAPID public key. |
| `VAPID_PRIVATE_KEY` | Yes for push | VAPID private key. |
| `VAPID_SUBJECT` | Yes for push | `mailto:` or `https:` URL identifying the app owner. |

Generate all three with `npm run secrets:generate` (or `npx web-push generate-vapid-keys`).

## Analytics — PostHog

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional (public) | Client-side tracking key. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional (public) | PostHog host. Default `https://app.posthog.com`. |
| `POSTHOG_API_KEY` | Optional | Server-side event tracking key. |
| `POSTHOG_HOST` | Optional | Server-side host. |

## Error Monitoring — Sentry

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Optional (public) | Browser DSN. |
| `SENTRY_DSN` | Optional | Server/edge DSN. |
| `SENTRY_AUTH_TOKEN` | Optional | Auth token for source-map upload. |
| `SENTRY_ORG` | Optional | Sentry org slug. |
| `SENTRY_PROJECT` | Optional | Sentry project slug. |

## Uptime Monitoring

| Variable | Required | Description |
|---|---|---|
| `BETTER_UPTIME_API_KEY` | Optional | Better Uptime / Better Stack API key. |

## Security / Infra

| Variable | Required | Description |
|---|---|---|
| `CRON_SECRET` | Yes (prod) | Bearer token protecting `/api/cron/*` routes. |
| `TOKEN_HASH_SECRET` | Yes | HMAC key for `hashSecret()` / `hashToken()` helpers. Must be ≥32 random chars. |
| `WORKER_SECRET` | Optional | Bearer token for worker → server internal calls. |
| `HEALTH_CHECK_SECRET` | Optional | Bearer token required for detailed `/api/health` output. |
| `ADMIN_EMAILS` | Optional | Comma-separated admin emails. Grants `/admin` access. Can also set `role=ADMIN` in the DB. |

## Beta Program (NEW Apr 10)

| Variable | Required | Description |
|---|---|---|
| `BETA_REQUIRED` | Optional | Set to `true` to require an invite code for `/editor`. Default `false`. Manage codes at `/admin/beta`. |

## Roblox Integration

| Variable | Required | Description |
|---|---|---|
| `ROBLOX_OPEN_CLOUD_API_KEY` | Optional | Roblox Open Cloud API key. |
| `ROBLOX_CREATOR_ID` | Optional | Creator (user or group) ID. |
| `ROBLOX_CREATOR_TYPE` | Optional | `User` or `Group`. Default `User`. |

Source: https://create.roblox.com/dashboard/credentials

## Studio Plugin Auth

| Variable | Required | Description |
|---|---|---|
| `STUDIO_AUTH_SECRET` | Yes | JWT signing key for Studio plugin requests. ≥32 chars. |
| `STUDIO_PLUGIN_SECRET` | Yes | Shared handshake secret for plugin pairing. Rotate to invalidate sessions. |

## MCP Servers

| Variable | Required | Description |
|---|---|---|
| `MCP_ASSET_ALCHEMIST_URL` | Optional | Default `http://localhost:3002`. |
| `MCP_CITY_ARCHITECT_URL` | Optional | Default `http://localhost:3003`. |
| `MCP_TERRAIN_FORGE_URL` | Optional | Default `http://localhost:3004`. |

## App Routing

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes (public) | Public web URL. |
| `NEXT_PUBLIC_API_URL` | Yes (public) | Public API URL. |
| `API_URL` | Yes | Server-side API URL. |
| `ALLOWED_ORIGINS` | Yes | CORS allowlist (comma-separated). |
| `PORT` | Optional | API server port. Default `3001`. |

## AWS / Backups

Used by `scripts/backup.sh` only.

| Variable | Required | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Optional | IAM key. |
| `AWS_SECRET_ACCESS_KEY` | Optional | IAM secret. |
| `AWS_REGION` | Optional | Default `us-east-1`. |
| `BACKUP_S3_BUCKET` | Optional | S3 bucket name for DB backups. |

## Maintenance Mode

| Variable | Required | Description |
|---|---|---|
| `MAINTENANCE_MODE` | Optional | `true` serves the maintenance page to all visitors. |
| `MAINTENANCE_UNTIL` | Optional | ISO 8601 datetime displayed as ETA. |
| `NEXT_PUBLIC_DISCORD_URL` | Optional (public) | Discord invite shown on the maintenance page. |
| `NEXT_PUBLIC_STATUS_PAGE_URL` | Optional (public) | Status page link shown on the maintenance page. |

## Feature Flags

| Variable | Required | Description |
|---|---|---|
| `DEMO_MODE` | Optional | `true` bypasses all auth gates (dev/staging only). |
| `NEXT_PUBLIC_DEMO_MODE` | Optional (public) | Mirrors `DEMO_MODE` for client UI. |

## i18n (NEW Apr 10)

No env vars. Configure locales in `src/i18n/config.ts` and add matching JSON files in `src/i18n/messages/<locale>.json`.

---

## Generating secrets

```bash
npm run secrets:generate
```

Prints fresh values for:
- `ROBUX_WEBHOOK_SECRET`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Paste into `.env.local` locally, or into Vercel → Project → Settings → Environment Variables for production. Remember to also paste `ROBUX_WEBHOOK_SECRET` into the Roblox place at `ServerStorage > ForjeConfig > WebhookSecret`.
