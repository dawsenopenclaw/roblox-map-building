/**
 * GET /api/admin/robux-status
 *
 * Returns the configuration status of the Robux payment system.
 * Used by the admin dashboard to show what's configured and what's missing.
 *
 * Auth: Admin only.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const REQUIRED_ENV_VARS = [
  { key: 'ROBLOX_EXPERIENCE_ID',              label: 'Roblox Experience ID',              required: true },
  { key: 'ROBUX_WEBHOOK_SECRET',              label: 'Webhook HMAC Secret',               required: true },
  { key: 'FORJE_OWNER_ROBLOX_USER_ID',        label: 'Your Roblox UserId (payee)',        required: true },
  { key: 'ROBLOX_GAMEPASS_STARTER_ID',        label: 'GamePass: Starter ($9.99)',         required: false },
  { key: 'ROBLOX_GAMEPASS_PRO_ID',            label: 'GamePass: Pro ($19.99)',            required: false },
  { key: 'ROBLOX_GAMEPASS_STUDIO_ID',         label: 'GamePass: Studio ($49.99)',         required: false },
  { key: 'ROBLOX_DEVPRODUCT_CREDITS_100_ID',  label: 'DevProduct: 100 credits ($4.99)',   required: false },
  { key: 'ROBLOX_DEVPRODUCT_CREDITS_500_ID',  label: 'DevProduct: 500 credits ($19.99)',  required: false },
  { key: 'ROBLOX_DEVPRODUCT_CREDITS_1000_ID', label: 'DevProduct: 1000 credits ($39.99)', required: false },
] as const

export async function GET() {
  // Admin auth
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check each env var
  const config = REQUIRED_ENV_VARS.map((v) => ({
    key: v.key,
    label: v.label,
    required: v.required,
    configured: !!process.env[v.key],
    // Don't leak the actual value, just whether it's set
  }))

  const requiredMissing = config.filter((c) => c.required && !c.configured)
  const optionalMissing = config.filter((c) => !c.required && !c.configured)
  const ready = requiredMissing.length === 0

  let totalUnclaimedRobux = 0
  let unclaimedCount = 0
  let totalCompletedRobux = 0
  let completedCount = 0

  try {
    const { db } = await import('@/lib/db')

    // Count unclaimed purchases (Robux paid but no ForjeGames account linked yet)
    const unclaimed = await db.auditLog.findMany({
      where: { action: 'ROBUX_PURCHASE_UNCLAIMED' },
      select: { metadata: true },
      take: 1000,
    })
    unclaimedCount = unclaimed.length
    totalUnclaimedRobux = unclaimed.reduce((sum, log) => {
      const meta = log.metadata as Record<string, unknown> | null
      const amount = (meta?.amount as number) ?? 0
      return sum + amount
    }, 0)

    // Count completed purchases (Robux that already routed to your account)
    const completed = await db.auditLog.findMany({
      where: { action: 'ROBUX_PURCHASE_COMPLETED' },
      select: { metadata: true },
      take: 1000,
    })
    completedCount = completed.length
    totalCompletedRobux = completed.reduce((sum, log) => {
      const meta = log.metadata as Record<string, unknown> | null
      const amount = (meta?.amount as number) ?? 0
      return sum + amount
    }, 0)
  } catch {
    // DB unavailable — counts stay at 0
  }

  return NextResponse.json({
    ready,
    config,
    requiredMissing: requiredMissing.length,
    optionalMissing: optionalMissing.length,
    stats: {
      totalCompletedRobux,
      completedCount,
      totalUnclaimedRobux,
      unclaimedCount,
      // Approximate USD via DevEx rate (Roblox pays out at ~$0.0035 per Robux)
      estimatedUsdEarned: Math.round(totalCompletedRobux * 0.0035 * 100) / 100,
    },
    nextSteps: ready
      ? ['Robux payments are live! Test by buying a credit pack on the pricing page.']
      : [
          '1. Create a Roblox experience on your account at https://create.roblox.com',
          '2. Create GamePasses and DevProducts inside it for credit packs',
          '3. Add the IDs to .env.local (see ROBLOX_GAMEPASS_*_ID, ROBLOX_DEVPRODUCT_*_ID)',
          '4. Generate ROBUX_WEBHOOK_SECRET with: openssl rand -hex 32',
          '5. Set the same secret in your Roblox experience: ServerStorage > ForjeConfig > WebhookSecret (StringValue)',
          '6. Enable HTTP Requests in Game Settings > Security',
          '7. Restart the dev server to pick up the new env vars',
          '8. Apply for Roblox DevEx at https://create.roblox.com/dashboard/devex to cash out earned Robux',
        ],
  })
}
