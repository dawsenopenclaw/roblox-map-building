/**
 * Discover + rate YouTube channels relevant to ForjeGames.
 *
 * For each search query, ask yt-dlp to return top videos, group by
 * channel, fetch channel-level stats (subs, total views, recent uploads),
 * score, and write the top N to a JSON file we can then merge into
 * curated-channels.ts.
 *
 * Usage:
 *   npx tsx scripts/discover-channels.ts > .transcripts/channels.json
 */
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface Discovered {
  channelId: string
  channel: string
  channelUrl: string
  subscriberCount: number
  uploadCount?: number
  category: 'pattern' | 'building' | 'service' | 'blender' | 'dev'
  matchedQuery: string
  score: number
}

const SEARCHES: Array<{ q: string; cat: Discovered['category']; pull: number }> = [
  // Roblox scripting / development
  { q: 'roblox scripting tutorial',     cat: 'service',  pull: 30 },
  { q: 'roblox studio tutorial beginner',cat: 'pattern',  pull: 30 },
  { q: 'roblox game development',       cat: 'pattern',  pull: 25 },
  { q: 'roblox lua scripting',          cat: 'service',  pull: 20 },
  { q: 'roblox advanced scripting',     cat: 'service',  pull: 15 },
  { q: 'roblox tycoon tutorial',        cat: 'pattern',  pull: 15 },
  { q: 'roblox simulator tutorial',     cat: 'pattern',  pull: 15 },
  { q: 'roblox obby tutorial',          cat: 'pattern',  pull: 15 },
  { q: 'roblox UI tutorial',            cat: 'building', pull: 15 },
  { q: 'roblox building tutorial',      cat: 'building', pull: 20 },
  { q: 'roblox lighting atmosphere',    cat: 'building', pull: 12 },
  { q: 'roblox terrain tutorial',       cat: 'building', pull: 12 },
  { q: 'roblox studio tips tricks',     cat: 'building', pull: 20 },
  { q: 'roblox datastore service',      cat: 'service',  pull: 12 },
  { q: 'roblox remote events',          cat: 'service',  pull: 12 },
  { q: 'roblox pathfinding',            cat: 'service',  pull: 10 },
  { q: 'roblox tween service',          cat: 'service',  pull: 10 },
  { q: 'roblox modulescript oop',       cat: 'service',  pull: 10 },
  { q: 'roblox knit framework',         cat: 'service',  pull: 8 },
  { q: 'roblox profileservice',         cat: 'service',  pull: 8 },
  { q: 'roblox monetization tutorial',  cat: 'pattern',  pull: 10 },

  // Blender for game assets
  { q: 'blender low poly tutorial',     cat: 'blender',  pull: 20 },
  { q: 'blender game asset tutorial',   cat: 'blender',  pull: 20 },
  { q: 'blender hard surface modeling', cat: 'blender',  pull: 15 },
  { q: 'blender uv unwrapping',         cat: 'blender',  pull: 12 },
  { q: 'blender pbr materials',         cat: 'blender',  pull: 12 },
  { q: 'blender export to roblox',      cat: 'blender',  pull: 8 },
  { q: 'blender export fbx game engine',cat: 'blender',  pull: 12 },
  { q: 'blender stylized character',    cat: 'blender',  pull: 12 },
  { q: 'blender retopology tutorial',   cat: 'blender',  pull: 10 },
  { q: 'blender geometry nodes',        cat: 'blender',  pull: 10 },
  { q: 'blender beginner tutorial',     cat: 'blender',  pull: 15 },

  // Game design
  { q: 'game design fundamentals',      cat: 'dev',      pull: 15 },
  { q: 'game design analysis',          cat: 'dev',      pull: 12 },
  { q: 'game level design tutorial',    cat: 'dev',      pull: 12 },
  { q: 'indie game development',        cat: 'dev',      pull: 12 },
]

function searchTopChannels(query: string, limit: number): Array<{ channelId: string; channel: string }> {
  const out = execFileSync(
    'yt-dlp',
    [
      `ytsearch${limit}:${query}`,
      '--no-warnings',
      '--no-playlist',
      '--print', '%(channel_id)s\t%(channel)s',
      '--flat-playlist',
    ],
    { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 },
  )
  const seen = new Set<string>()
  const results: Array<{ channelId: string; channel: string }> = []
  for (const line of out.trim().split('\n')) {
    const [id, name] = line.split('\t')
    if (id && !seen.has(id)) {
      seen.add(id)
      results.push({ channelId: id, channel: name || id })
    }
  }
  return results
}

function getChannelStats(channelId: string): { subs: number; uploads: number } {
  try {
    const out = execFileSync(
      'yt-dlp',
      [
        `https://www.youtube.com/channel/${channelId}`,
        '--no-warnings',
        '--print', '%(channel_follower_count|0)s\t%(playlist_count|0)s',
        '--playlist-end', '1',
      ],
      { encoding: 'utf-8' },
    )
    const [subs, uploads] = out.trim().split('\n')[0].split('\t')
    return { subs: parseInt(subs, 10) || 0, uploads: parseInt(uploads, 10) || 0 }
  } catch {
    return { subs: 0, uploads: 0 }
  }
}

function score(subs: number, uploads: number, query: string): number {
  // Logarithmic scaling on subs so 1M doesn't crush 10k entirely
  const subScore = Math.log10(Math.max(subs, 100)) * 10
  const uploadBonus = Math.min(uploads, 100) / 10
  // Specific-query bonus: tutorials over generic content
  const qBonus = /tutorial|tip|trick|advanced/.test(query) ? 5 : 0
  return Math.round(subScore + uploadBonus + qBonus)
}

const merged = new Map<string, Discovered>()
let totalSearched = 0

for (const s of SEARCHES) {
  console.error(`🔍 [${s.cat}] "${s.q}" (top ${s.pull})`)
  let channels: Array<{ channelId: string; channel: string }>
  try {
    channels = searchTopChannels(s.q, s.pull)
  } catch (e) {
    console.error(`   error: ${(e as Error).message.split('\n')[0]}`)
    continue
  }
  for (const c of channels) {
    if (!c.channelId) continue
    if (merged.has(c.channelId)) continue
    totalSearched++
    const stats = getChannelStats(c.channelId)
    const sc = score(stats.subs, stats.uploads, s.q)
    merged.set(c.channelId, {
      channelId: c.channelId,
      channel: c.channel,
      channelUrl: `https://www.youtube.com/channel/${c.channelId}`,
      subscriberCount: stats.subs,
      uploadCount: stats.uploads,
      category: s.cat,
      matchedQuery: s.q,
      score: sc,
    })
    console.error(`   • ${c.channel} (${stats.subs.toLocaleString()} subs, score ${sc})`)
  }
}

const sorted = Array.from(merged.values()).sort((a, b) => b.score - a.score)
const outFile = path.join(process.cwd(), '.transcripts', 'channels.json')
fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(sorted, null, 2))
console.error(`\n✅ Discovered ${sorted.length} unique channels (searched ${totalSearched})`)
console.error(`   Top 20:`)
for (const c of sorted.slice(0, 20)) {
  console.error(`   ${c.score.toString().padStart(3)} · ${c.subscriberCount.toLocaleString().padStart(10)} subs · [${c.category}] ${c.channel}`)
}
console.error(`\nSaved: ${outFile}`)
