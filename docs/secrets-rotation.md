# Secrets Rotation Policy

## Overview

All production secrets must be rotated every **90 days** at minimum.
Security incidents require immediate rotation (within 1 hour).

## Rotation Schedule

| Secret | Rotation Interval | Owner |
|--------|-------------------|-------|
| `CLERK_SECRET_KEY` | 90 days | Platform |
| `STRIPE_SECRET_KEY` | 90 days | Platform |
| `STRIPE_WEBHOOK_SECRET` | On endpoint change | Platform |
| `DATABASE_URL` credentials | 90 days | DevOps |
| `SENTRY_AUTH_TOKEN` | 90 days | Platform |
| `FLY_API_TOKEN` | 90 days | DevOps |
| `VERCEL_TOKEN` | 90 days | DevOps |
| `AWS_SECRET_ACCESS_KEY` (backup) | 90 days | DevOps |

## Rotation Procedure

All secrets must be updated **atomically** across all three surfaces. A partial update
can cause production downtime.

### Step 1: Generate New Secret

Generate the new secret in the respective service console:
- **Clerk:** https://dashboard.clerk.com → API Keys
- **Stripe:** https://dashboard.stripe.com → Developers → API Keys
- **Database:** Neon/Supabase → Settings → Connection String (rotate password)
- **AWS:** IAM → Security Credentials → Access Keys

### Step 2: Update All Three Surfaces Atomically

Run these three updates in sequence (takes < 5 minutes). Keep old secret active
until all three are confirmed.

```bash
# 1. GitHub Actions secrets
gh secret set SECRET_NAME --body "new_value" --repo forjegames/forjegames

# 2. Vercel environment variables
vercel env rm SECRET_NAME production
vercel env add SECRET_NAME production <<< "new_value"

# 3. Fly.io secrets
flyctl secrets set SECRET_NAME="new_value" --app forjegames-api
flyctl secrets set SECRET_NAME="new_value" --app forjegames-api-staging
```

### Step 3: Verify

1. Trigger a CI/CD deploy to staging
2. Check `/health` endpoint returns `{"status":"ok"}`
3. Test a protected API route
4. Remove the old secret from the originating service

### Step 4: Audit

Log the rotation in the audit trail:
- Date rotated
- Secret rotated (not the value)
- Who rotated it
- Why (schedule or incident)

## Emergency Rotation (Incident Response)

If a secret is suspected compromised:

1. **Immediately** revoke the old secret in the service console
2. Generate new secret
3. Update all three surfaces (see Step 2)
4. Deploy immediately: `flyctl deploy --remote-only`
5. Check audit logs for unauthorized usage
6. File incident report within 24 hours

## Secret Storage Rules

- Secrets NEVER in git (`.env` files are in `.gitignore`)
- `.env.example` contains only placeholder values
- Secrets NEVER in code comments or log output
- Secrets NEVER passed via URL query parameters

## Secrets Inventory

See `.env.example` for the complete list of required secrets.
