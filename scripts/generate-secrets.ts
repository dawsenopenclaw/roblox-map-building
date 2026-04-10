#!/usr/bin/env tsx
/**
 * generate-secrets.ts
 *
 * Generates all random secrets required by the ForjeGames app:
 *   - ROBUX_WEBHOOK_SECRET       (32-byte hex)
 *   - VAPID keys                 (for web push notifications)
 *
 * Usage:
 *   npm run secrets:generate
 *
 * Copy the printed output into .env (or paste into Vercel dashboard).
 * Never commit the generated values — they are secrets.
 */
import crypto from 'node:crypto'
import webpush from 'web-push'

const robuxSecret = crypto.randomBytes(32).toString('hex')
const vapidKeys = webpush.generateVAPIDKeys()

// eslint-disable-next-line no-console
console.log('Add these to your .env (or Vercel → Settings → Environment Variables):\n')
// eslint-disable-next-line no-console
console.log(`ROBUX_WEBHOOK_SECRET=${robuxSecret}`)
// eslint-disable-next-line no-console
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
// eslint-disable-next-line no-console
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
// eslint-disable-next-line no-console
console.log(`VAPID_SUBJECT=mailto:support@forjegames.com`)
// eslint-disable-next-line no-console
console.log(
  '\nNote: ROBUX_WEBHOOK_SECRET must also be pasted into your Roblox place at\n' +
    '  ServerStorage > ForjeConfig > WebhookSecret (StringValue).',
)
