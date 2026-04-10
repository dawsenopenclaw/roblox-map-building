# Clerk Production Setup Guide

This guide walks through swapping ForjeGames' Clerk keys from development (`pk_test_` / `sk_test_`) to production (`pk_live_` / `sk_live_`). The dev keys trigger a "Clerk has been loaded with development keys" warning in the browser console on production and are rate-limited, so they must be replaced before launch.

## Affected environment files

Both of these files currently contain `pk_test_` / `sk_test_` values and must be updated:

- `.env.prod` — Vercel production env snapshot
- `.vercel/.env.production.local` — local copy of Vercel production env (pulled via `vercel env pull`)

The Clerk-related variables that need to be swapped or verified:

| Variable | Current | Target |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` (dev instance) | `whsec_...` (prod instance) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | unchanged |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | unchanged |

## Step-by-step

### Step 1. Open the Clerk dashboard

Go to <https://dashboard.clerk.com> and select the **production** instance for ForjeGames. If no production instance exists yet, create one via "Create application" and choose "Production" when prompted. Do **not** reuse the development instance — production keys can only be generated from a production instance.

### Step 2. Copy the production API keys

In the production instance sidebar, go to **API Keys**. Copy the two keys shown:

- **Publishable key** — begins with `pk_live_`
- **Secret key** — begins with `sk_live_` (click "Show" to reveal, then copy)

Keep this browser tab open; you will need it for Step 5.

### Step 3. Replace `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Update the variable in **Vercel → Project → Settings → Environment Variables** for the **Production** environment. The new value **must** start with `pk_live_`. After saving, also update the local copies in `.env.prod` and `.vercel/.env.production.local` (or re-run `vercel env pull .vercel/.env.production.local --environment=production`).

### Step 4. Replace `CLERK_SECRET_KEY`

Same procedure as Step 3, but for the secret key. The new value **must** start with `sk_live_`. Mark the variable as "Sensitive" in Vercel so it is encrypted at rest and not printed in build logs.

### Step 5. Set `CLERK_WEBHOOK_SECRET`

In the Clerk production dashboard, go to **Webhooks → Endpoints**. Either create a new endpoint pointing at `https://forjegames.com/api/webhooks/clerk` or open the existing one, then copy its **Signing Secret** (starts with `whsec_`). Subscribe to at least these events: `user.created`, `user.updated`, `user.deleted`, `session.created`. Save the secret as `CLERK_WEBHOOK_SECRET` in Vercel Production env.

### Step 6. Configure allowed origins

Still in the Clerk production dashboard, go to **Domains** (or **Settings → Domains**) and add the production domains:

- `forjegames.com`
- `www.forjegames.com`

Set `forjegames.com` as the primary/home URL. If you use a custom Clerk subdomain (e.g. `clerk.forjegames.com`), complete the DNS verification steps — the existing CSP in `next.config.ts` already whitelists `https://clerk.forjegames.com`.

### Step 7. Configure social providers

Go to **User & Authentication → Social Connections** and enable the providers ForjeGames supports:

- **Google** — create an OAuth client at <https://console.cloud.google.com/apis/credentials>, paste the client ID and secret into Clerk. Use Clerk's production-mode OAuth app, not the shared dev one.
- **Discord** — create an application at <https://discord.com/developers/applications>, add an OAuth2 redirect, copy client ID and secret into Clerk.
- **Roblox** — if available in your Clerk plan, enable it and register a Roblox OAuth application at <https://create.roblox.com/dashboard/credentials>. If Roblox is not yet offered natively, skip this step and track it as a follow-up.

For each provider, make sure you flip off "Use shared credentials for development" so production uses your own OAuth apps.

### Step 8. Set OAuth redirect URLs

In each provider's developer console, register these redirect URIs (Clerk will show the exact values for your instance on the provider config page — copy them verbatim):

- `https://clerk.forjegames.com/v1/oauth_callback` (if using custom domain)
- `https://<your-instance>.clerk.accounts.dev/v1/oauth_callback` (fallback)

Also verify these app URLs inside Clerk under **Paths**:

- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in URL: `/dashboard`
- After sign-up URL: `/dashboard`

### Step 9. Test sign-up and sign-in on the live site

After the Vercel deploy picks up the new env vars:

1. Open an incognito window and go to <https://forjegames.com/sign-up>.
2. Create a brand new account via email + password.
3. Sign out, then sign back in.
4. Test each social provider (Google, Discord, Roblox if enabled).
5. Trigger a webhook event (e.g. update your profile) and check the Vercel function logs for `/api/webhooks/clerk` — you should see a successful 200 with the signature verified against the new `CLERK_WEBHOOK_SECRET`.

### Step 10. Verify the warning is gone

Open DevTools on <https://forjegames.com> and check the Console. The message `Clerk has been loaded with development keys. Development instances have strict usage limits...` must no longer appear. Also run:

```bash
npm run verify:clerk
```

from a shell with `.vercel/.env.production.local` sourced — it will exit 0 if the production keys are active and exit 1 if any `pk_test_` is still present.

## Rollback

If production sign-in breaks after the swap, restore the previous `pk_test_` / `sk_test_` values from the commit history of `.env.prod` (or from Vercel's env variable history) and redeploy. The dev instance stays active indefinitely, so rollback is always available.
