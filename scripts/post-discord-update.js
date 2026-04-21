/**
 * Post polished update announcements to Discord + edit old messages
 */
import { config } from 'dotenv'
config()

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const ANNOUNCE_CH = '1495873969704665248' // beta-announcements
const BUGLOG_CH = '1495873972162789478'   // beta-bug-log

// Old message IDs to edit
const OLD_ANNOUNCE_ID = '1495995831353081857'
const OLD_BUGFIX_ID = '1495998624520474665'

async function discordReq(endpoint, body, method = 'POST') {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    method,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { status: res.status, data }
}

async function main() {
  // ── 1. Edit the old announcement to be a teaser pointing to the new one ──
  console.log('Editing old announcement...')
  const editAnnounce = await discordReq(
    `/channels/${ANNOUNCE_CH}/messages/${OLD_ANNOUNCE_ID}`,
    {
      embeds: [{
        title: 'Update Available — See Below',
        description: 'This announcement has been superseded. Scroll down for the full v2.0 update.',
        color: 0x6B7280,
      }],
    },
    'PATCH'
  )
  console.log('Edit announce:', editAnnounce.status)

  // ── 2. Edit the old bug fix post ──
  console.log('Editing old bug fix post...')
  const editBugfix = await discordReq(
    `/channels/${BUGLOG_CH}/messages/${OLD_BUGFIX_ID}`,
    {
      embeds: [{
        title: 'Bug Fixes — See Updated Post Below',
        description: 'This post has been superseded by a more detailed report below.',
        color: 0x6B7280,
      }],
    },
    'PATCH'
  )
  console.log('Edit bugfix:', editBugfix.status)

  // ── 3. Post the new polished announcement ──
  console.log('Posting new announcement...')
  const announce = await discordReq(`/channels/${ANNOUNCE_CH}/messages`, {
    content: '@everyone',
    embeds: [
      {
        title: 'Forje v2.0 \u2014 The AI Just Got a Brain',
        description: 'This is the biggest update since launch. The AI no longer guesses \u2014 it **learns**, **plans**, and **verifies** every build. 6 new systems shipped today.',
        color: 0xD4AF37,
      },
      {
        title: '\uD83E\uDDE0  The AI Learns From You',
        description: 'Every build is now tracked \u2014 what worked, what broke, what you asked for.\n\n**Your votes matter 3x more than anything else.** When you click **Worked** or **Broke**, that directly trains the AI for everyone.\n\nUses semantic search \u2014 a successful "medieval fortress" helps future "castle" builds too.\n\nBad builds become anti-patterns. Good builds become examples. **The more you use it, the smarter it gets.**',
        color: 0x8B5CF6,
      },
      {
        title: '\uD83D\uDEE1\uFE0F  Builds Are Actually Complete Now',
        description: 'We added a **completeness auditor** that catches the #1 complaint:\n> *"The AI said it built a castle but I got one brick"*\n\nNow every build is checked:\n\u2022 Did the AI actually build what it described?\n\u2022 Does it meet category minimums? (castle = walls + towers + gate)\n\u2022 Are there lights, interactive elements, effects?\n\nIf incomplete, it **auto-retries** and adds the missing parts \u2014 without starting over.\n\n**15 categories** with specific requirements. A house needs walls, doors, windows, a roof, AND a floor.',
        color: 0x3B82F6,
      },
      {
        title: '\uD83D\uDD25  Real Lighting \u2014 Neon is Dead',
        description: 'Neon material made everything look like a flat glowing block. **Gone.**\n\nBuilds now use real light sources:\n```\nGlass lamp + PointLight (warm glow)\nMetal torch + Fire + PointLight\nChandelier with SpotLight children\n```\nThe AI also scripts things together \u2014 doors open with ProximityPrompt, torches have real fire, signs have readable text.',
        color: 0xF59E0B,
      },
      {
        title: '\uD83D\uDCCB  Smart Build Planning',
        description: 'Before writing code, the AI now:\n\n**1.** Classifies difficulty \u2014 simple box vs detailed pirate ship\n**2.** Estimates complexity \u2014 target part count, lights, interactive elements\n**3.** Tells itself the target \u2014 "60 parts, 5 lights, 3 interactive"\n\nSimple prompts stay fast. Complex prompts get planned properly.',
        color: 0x10B981,
      },
      {
        title: '\u2705  10 Bugs Squashed',
        description: '**@souler547** \u2014 "Trouble generating" \u2192 Lightweight retry added\n**@yomittv** \u2014 Builds = one brick \u2192 Completeness auditor\n**@itjustlikethat** \u2014 Connection drops on refresh \u2192 Auto-reconnect\n**@itjustlikethat** \u2014 Quick actions broken \u2192 Fixed\n**@itjustlikethat** \u2014 Email box overflow \u2192 Responsive fix\n**@itjustlikethat** \u2014 Comparison cut off \u2192 Wider layout\n**@itjustlikethat** \u2014 Language selector \u2192 Removed for now\n**@itjustlikethat** \u2014 Light mode broken \u2192 Fixed\n**@2_sleazyy** \u2014 Plan mode error \u2192 Fixed',
        color: 0x22C55E,
      },
      {
        title: '\uD83C\uDFAF  What We Need From You',
        description: '**Test these and report back in your team channel:**\n\n\u2460 Build something complex \u2014 castle, pirate ship, town\n\u2461 Click **Worked** / **Broke** on every build (trains the AI)\n\u2462 Say "add more detail" or "missing X" after a build\n\u2463 Try Plan mode with something ambitious\n\u2464 Refresh while connected to Studio \u2014 does it reconnect?\n\u2465 Try scripts: "NPC that patrols" or "leaderboard system"\n\n**Every report makes the AI better for everyone.**',
        color: 0xD4AF37,
        footer: { text: 'ForjeGames Beta  \u2022  6 commits today  \u2022  +3,000 lines of intelligence' },
        timestamp: new Date().toISOString(),
      },
    ],
  })
  console.log('New announce:', announce.status, announce.data.id || '')

  // ── 4. Post the new bug fix report ──
  console.log('Posting new bug report...')
  const bugReport = await discordReq(`/channels/${BUGLOG_CH}/messages`, {
    embeds: [{
      title: '\u2705  Bug Fix Report \u2014 Apr 21',
      color: 0x22C55E,
      description: 'All 10 bugs from yesterday have been fixed and deployed.\n\n' +
        '**\u2705 AI fails to generate** \u2014 @souler547\nAdded lightweight retry with smaller prompt when rate-limited\n\n' +
        '**\u2705 Builds = one brick** \u2014 @yomittv\nNew completeness auditor + auto-retry with specific missing features\n\n' +
        '**\u2705 Connection drops on refresh** \u2014 @itjustlikethat\nSession persists to localStorage + auto-reconnect on page load\n\n' +
        '**\u2705 Quick actions broken** \u2014 @itjustlikethat\nSame AI pipeline fix covers all quick actions\n\n' +
        '**\u2705 Email box overflow** \u2014 @itjustlikethat\nResponsive constraints applied to auth forms\n\n' +
        '**\u2705 Comparison section cut off** \u2014 @itjustlikethat\nWider container + responsive padding\n\n' +
        '**\u2705 Language selector** \u2014 @itjustlikethat\nRemoved until translations are ready\n\n' +
        '**\u2705 Light mode** \u2014 @itjustlikethat\nTheme now applies to full page background\n\n' +
        '**\u2705 Plan mode error** \u2014 @2_sleazyy\nSame rate-limit fix as AI generation\n\n' +
        '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n**Please re-test and report any remaining issues in your team channel.**',
      footer: { text: 'ForjeGames Beta  \u2022  All fixes live on forjegames.com' },
      timestamp: new Date().toISOString(),
    }],
  })
  console.log('New bug report:', bugReport.status, bugReport.data.id || '')
}

main().catch(e => console.error(e))
