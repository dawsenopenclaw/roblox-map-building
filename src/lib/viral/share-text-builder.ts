/**
 * Context-aware share copy generator. Produces platform-appropriate share text
 * for projects, achievements, and milestones. All strings are deterministic
 * given the same seed — useful for tests.
 */

export type SharePlatform =
  | 'twitter'
  | 'x' // alias
  | 'tiktok'
  | 'discord'
  | 'reddit'
  | 'threads'
  | 'bluesky'
  | 'generic'

export interface ShareProjectContext {
  kind: 'project'
  theme?: string
  buildMinutes?: number
  projectName?: string
  shareUrl: string
  authorHandle?: string
}

export interface ShareAchievementContext {
  kind: 'achievement'
  achievementName: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  shareUrl: string
}

export interface ShareMilestoneContext {
  kind: 'milestone'
  milestone: string // e.g. "level 10", "100 builds", "7-day streak"
  shareUrl: string
}

export type ShareContext =
  | ShareProjectContext
  | ShareAchievementContext
  | ShareMilestoneContext

export interface BuiltShare {
  text: string
  url: string
  hashtags: string[]
  /** Pre-built href for click-to-share links (where applicable). */
  href?: string
}

const BRAND_HANDLE = '@forjegames'
const BRAND_HASHTAGS = ['forjegames', 'roblox', 'gamedev']

export function buildShareText(
  ctx: ShareContext,
  platform: SharePlatform = 'generic',
): BuiltShare {
  const normalizedPlatform = platform === 'x' ? 'twitter' : platform

  let text: string
  const tags = [...BRAND_HASHTAGS]

  switch (ctx.kind) {
    case 'project': {
      const theme = ctx.theme ?? 'Roblox'
      const minutes = ctx.buildMinutes
      const name = ctx.projectName
      if (minutes != null && name) {
        text = `I just built "${name}" — a ${theme} game — in ${minutes} minutes on ${BRAND_HANDLE} ⚡`
      } else if (minutes != null) {
        text = `I just built a ${theme} game in ${minutes} minutes on ${BRAND_HANDLE} ⚡`
      } else if (name) {
        text = `Check out "${name}", a ${theme} game I built on ${BRAND_HANDLE}`
      } else {
        text = `I just built a ${theme} game on ${BRAND_HANDLE} ⚡`
      }
      break
    }
    case 'achievement': {
      const rarityPrefix = ctx.rarity ? `[${ctx.rarity.toUpperCase()}] ` : ''
      text = `${rarityPrefix}I just earned "${ctx.achievementName}" on ${BRAND_HANDLE} 🏆`
      if (ctx.rarity) tags.push(`${ctx.rarity}drop`)
      break
    }
    case 'milestone': {
      text = `Just hit ${ctx.milestone} on ${BRAND_HANDLE} 🎯 come build with me`
      break
    }
  }

  // Platform-specific tweaks
  let finalText = text
  if (normalizedPlatform === 'twitter' || normalizedPlatform === 'bluesky') {
    finalText = truncate(text, 240)
  } else if (normalizedPlatform === 'reddit') {
    // Reddit titles are max 300 chars — no hashtags in titles
    finalText = truncate(text, 290)
  } else if (normalizedPlatform === 'discord') {
    // Discord is chatty — a bit more room
    finalText = truncate(text, 1800)
  } else if (normalizedPlatform === 'tiktok') {
    finalText = truncate(text, 150)
  }

  const href = buildPlatformHref(normalizedPlatform, finalText, ctx.shareUrl, tags)

  return {
    text: finalText,
    url: ctx.shareUrl,
    hashtags: tags,
    href,
  }
}

function buildPlatformHref(
  platform: Exclude<SharePlatform, 'x'>,
  text: string,
  url: string,
  hashtags: string[],
): string | undefined {
  switch (platform) {
    case 'twitter': {
      const u = new URL('https://twitter.com/intent/tweet')
      u.searchParams.set('text', text)
      u.searchParams.set('url', url)
      if (hashtags.length) u.searchParams.set('hashtags', hashtags.join(','))
      return u.toString()
    }
    case 'reddit': {
      const u = new URL('https://www.reddit.com/submit')
      u.searchParams.set('title', text)
      u.searchParams.set('url', url)
      return u.toString()
    }
    case 'threads': {
      const u = new URL('https://www.threads.net/intent/post')
      u.searchParams.set('text', `${text} ${url}`)
      return u.toString()
    }
    case 'bluesky': {
      const u = new URL('https://bsky.app/intent/compose')
      u.searchParams.set('text', `${text} ${url}`)
      return u.toString()
    }
    case 'tiktok':
    case 'discord':
    case 'generic':
      return undefined
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + '…'
}
