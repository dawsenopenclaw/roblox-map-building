/**
 * ELI Site Operations — Full access to the live platform
 *
 * Gives ELI the ability to:
 * - Query the database (users, builds, sessions, billing)
 * - Check API health and Stripe status
 * - Manage users (lookup, check tier, check usage)
 * - Monitor active sessions
 * - Check deployment status
 */

import 'server-only'

// ─── Database Access ─────────────────────────────────────────────────────────
async function getDb() {
  const { db } = await import('@/lib/db')
  return db
}

export async function queryUsers(opts: {
  search?: string
  limit?: number
  tier?: string
}) {
  try {
    const db = await getDb()
    const where: Record<string, unknown> = {}

    if (opts.search) {
      where.OR = [
        { email: { contains: opts.search, mode: 'insensitive' } },
        { username: { contains: opts.search, mode: 'insensitive' } },
        { clerkId: opts.search },
      ]
    }
    if (opts.tier) {
      where.tier = opts.tier.toUpperCase()
    }

    const users = await db.user.findMany({
      where,
      take: opts.limit || 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        tier: true,
        role: true,
        tokenBalance: true,
        totalBuilds: true,
        createdAt: true,
        lastActiveAt: true,
      },
    })

    return { success: true, users, count: users.length }
  } catch (err) {
    return { success: false, error: (err as Error).message, users: [], count: 0 }
  }
}

export async function getUserStats() {
  try {
    const db = await getDb()
    const [total, free, starter, creator, studio, admin] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { tier: 'FREE' } }),
      db.user.count({ where: { tier: 'STARTER' } }),
      db.user.count({ where: { tier: 'CREATOR' } }),
      db.user.count({ where: { tier: 'STUDIO' } }),
      db.user.count({ where: { role: 'ADMIN' } }),
    ])

    // Active in last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const activeToday = await db.user.count({
      where: { lastActiveAt: { gte: dayAgo } },
    })

    // Active in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeWeek = await db.user.count({
      where: { lastActiveAt: { gte: weekAgo } },
    })

    return {
      success: true,
      stats: { total, free, starter, creator, studio, admin, activeToday, activeWeek },
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, stats: {} }
  }
}

export async function getBuildStats() {
  try {
    const db = await getDb()

    // Try to count builds — table might not exist
    let totalBuilds = 0
    let recentBuilds = 0
    try {
      totalBuilds = await (db as Record<string, unknown> as { buildHistory: { count: (args?: unknown) => Promise<number> } }).buildHistory.count()
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      recentBuilds = await (db as Record<string, unknown> as { buildHistory: { count: (args?: unknown) => Promise<number> } }).buildHistory.count({
        where: { createdAt: { gte: dayAgo } },
      })
    } catch {
      // Table might not exist yet
    }

    return { success: true, totalBuilds, recentBuilds }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ─── Health Check ────────────────────────────────────────────────────────────
export async function checkSiteHealth() {
  const results: Record<string, { status: string; latency?: number; error?: string }> = {}

  // Database
  const dbStart = Date.now()
  try {
    const db = await getDb()
    await db.$queryRaw`SELECT 1`
    results.database = { status: 'ok', latency: Date.now() - dbStart }
  } catch (err) {
    results.database = { status: 'error', error: (err as Error).message, latency: Date.now() - dbStart }
  }

  // Redis
  const redisStart = Date.now()
  try {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    if (redisUrl) {
      const token = process.env.UPSTASH_REDIS_REST_TOKEN
      const res = await fetch(`${redisUrl}/ping`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(5000),
      })
      results.redis = { status: res.ok ? 'ok' : 'error', latency: Date.now() - redisStart }
    } else {
      results.redis = { status: 'not-configured' }
    }
  } catch (err) {
    results.redis = { status: 'error', error: (err as Error).message, latency: Date.now() - redisStart }
  }

  // AI Provider (Gemini)
  const aiStart = Date.now()
  try {
    const key = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN
    if (key) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        { signal: AbortSignal.timeout(5000) }
      )
      results.gemini = { status: res.ok ? 'ok' : 'error', latency: Date.now() - aiStart }
    } else {
      results.gemini = { status: 'not-configured' }
    }
  } catch (err) {
    results.gemini = { status: 'error', error: (err as Error).message }
  }

  // Stripe
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (stripeKey) {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${stripeKey}` },
        signal: AbortSignal.timeout(5000),
      })
      results.stripe = { status: res.ok ? 'ok' : 'error' }
    } else {
      results.stripe = { status: 'not-configured' }
    }
  } catch (err) {
    results.stripe = { status: 'error', error: (err as Error).message }
  }

  // Clerk
  try {
    const clerkKey = process.env.CLERK_SECRET_KEY
    if (clerkKey) {
      results.clerk = { status: 'configured' }
    } else {
      results.clerk = { status: 'not-configured' }
    }
  } catch {
    results.clerk = { status: 'error' }
  }

  const allOk = Object.values(results).every((r) => r.status === 'ok' || r.status === 'configured' || r.status === 'not-configured')

  return { success: true, overall: allOk ? 'healthy' : 'degraded', services: results }
}

// ─── Discord Real-Time ──────────────────────────────────────────────────────
export async function getRecentDiscordMessages(channelId: string, limit: number = 10) {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) return { success: false, error: 'No bot token', messages: [] }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
      { headers: { Authorization: `Bot ${token}` }, signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return { success: false, error: `Discord ${res.status}`, messages: [] }
    const messages = await res.json()
    return {
      success: true,
      messages: messages.map((m: Record<string, unknown>) => ({
        id: m.id,
        author: (m.author as Record<string, unknown>)?.username,
        content: (m.content as string)?.slice(0, 500),
        timestamp: m.timestamp,
        isBot: (m.author as Record<string, unknown>)?.bot || false,
      })),
    }
  } catch (err) {
    return { success: false, error: (err as Error).message, messages: [] }
  }
}

export async function getDiscordServerInfo() {
  const token = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_GUILD_ID || '1495863063423746068'
  if (!token) return { success: false, error: 'No bot token' }

  try {
    const [guild, channels] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
        headers: { Authorization: `Bot ${token}` },
        signal: AbortSignal.timeout(10000),
      }).then((r) => r.json()),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${token}` },
        signal: AbortSignal.timeout(10000),
      }).then((r) => r.json()),
    ])

    return {
      success: true,
      name: guild.name,
      memberCount: guild.approximate_member_count,
      onlineCount: guild.approximate_presence_count,
      channels: (channels as Array<Record<string, unknown>>)
        .filter((c) => c.type === 0)
        .map((c) => ({ id: c.id, name: c.name })),
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function postDiscordReply(channelId: string, messageId: string, content: string) {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) return { success: false, error: 'No bot token' }

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.slice(0, 2000),
        message_reference: { message_id: messageId },
      }),
    })
    if (!res.ok) return { success: false, error: `Discord ${res.status}` }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
