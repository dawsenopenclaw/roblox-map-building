/**
 * Drip campaign email templates — raw HTML strings.
 *
 * Day 1: Welcome + first build nudge
 * Day 3: Social proof / showcase
 * Day 7: Upgrade pitch
 *
 * All templates are dark-themed (#0a0a0a bg, #D4AF37 gold accents),
 * mobile-responsive, inline-styled, and include an unsubscribe link.
 */

const BRAND_GOLD = '#D4AF37'
const BRAND_DARK = '#0a0a0a'
const BRAND_CARD = '#1a1a1a'
const TEXT_PRIMARY = '#e5e5e5'
const TEXT_SECONDARY = '#999999'

interface DripBaseParams {
  name: string
  baseUrl: string
  unsubscribeToken: string
}

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

function layout(body: string, baseUrl: string, unsubscribeToken: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ForjeGames</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_DARK};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

<!-- Logo -->
<tr><td align="center" style="padding-bottom:24px;">
  <span style="font-size:28px;font-weight:bold;color:${BRAND_GOLD};letter-spacing:1px;">ForjeGames</span>
</td></tr>

<!-- Body -->
<tr><td style="background-color:${BRAND_CARD};border-radius:12px;padding:32px 28px;">
${body}
</td></tr>

<!-- Footer -->
<tr><td align="center" style="padding-top:24px;">
  <p style="margin:0;font-size:12px;color:${TEXT_SECONDARY};line-height:1.6;">
    You're receiving this because you signed up for ForjeGames.<br/>
    <a href="${baseUrl}/unsubscribe?token=${unsubscribeToken}" style="color:${TEXT_SECONDARY};text-decoration:underline;">Unsubscribe from these emails</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
<tr><td style="border-radius:8px;background-color:${BRAND_GOLD};">
  <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:bold;color:${BRAND_DARK};text-decoration:none;border-radius:8px;">${text}</a>
</td></tr>
</table>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;color:#ffffff;line-height:1.3;">${text}</h1>`
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:${TEXT_PRIMARY};line-height:1.6;">${text}</p>`
}

function featureBullet(label: string, detail: string): string {
  return `<tr>
<td style="padding:6px 0;vertical-align:top;">
  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${BRAND_GOLD};margin-right:10px;margin-top:5px;vertical-align:top;"></span>
</td>
<td style="padding:6px 0;font-size:14px;color:${TEXT_PRIMARY};line-height:1.5;">
  <strong style="color:#ffffff;">${label}</strong> &mdash; ${detail}
</td>
</tr>`
}

// ---------------------------------------------------------------------------
// Day 1 — Welcome
// ---------------------------------------------------------------------------

export function dripDay1(params: DripBaseParams): string {
  const { name, baseUrl, unsubscribeToken } = params

  const body = `
${heading(`Welcome aboard, ${name}`)}
${paragraph('ForjeGames turns your ideas into playable Roblox games. Type a description, and our 9 AI agents handle the rest — terrain, scripts, lighting, UI, the whole thing.')}
${paragraph('Here is what you get right now, for free:')}

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px 8px;">
${featureBullet('10 free builds every day', 'resets at midnight UTC')}
${featureBullet('200+ templates', 'obbies, tycoons, RPGs, horror maps, and more')}
${featureBullet('9 AI agents', 'each one specializes in a different part of your game')}
</table>

${paragraph('Your first build takes about 30 seconds. Give it a shot.')}
${ctaButton('Open the Editor', `${baseUrl}/editor`)}
`

  return layout(body, baseUrl, unsubscribeToken)
}

// ---------------------------------------------------------------------------
// Day 3 — Social proof
// ---------------------------------------------------------------------------

interface ShowcaseBuild {
  title: string
  description: string
}

const SHOWCASE_BUILDS: ShowcaseBuild[] = [
  { title: 'Neon Obby Tower', description: 'A 50-stage obby with glowing platforms and checkpoint saves' },
  { title: 'Pizza Tycoon Deluxe', description: 'Full tycoon loop with upgrades, workers, and a delivery van' },
  { title: 'Haunted Forest RPG', description: 'Story-driven RPG with enemy AI, loot drops, and boss fights' },
  { title: 'Space Station Escape', description: 'Sci-fi puzzle game with airlocks, zero-gravity zones, and a timer' },
]

function showcaseCard(build: ShowcaseBuild): string {
  return `<td style="padding:8px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#252525;border-radius:8px;border:1px solid #333;">
<tr><td style="padding:16px;">
  <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:${BRAND_GOLD};">${build.title}</p>
  <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};line-height:1.4;">${build.description}</p>
</td></tr>
</table>
</td>`
}

export function dripDay3(params: DripBaseParams): string {
  const { name, baseUrl, unsubscribeToken } = params

  const cards = SHOWCASE_BUILDS.map((b) => `<tr>${showcaseCard(b)}</tr>`).join('\n')

  const body = `
${heading(`${name}, check out what others are building`)}
${paragraph('Creators are building RPGs, obbies, tycoons -- what will you make? Here are a few recent builds from the community:')}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 16px;">
${cards}
</table>

${paragraph('Every one of these was built from a text prompt. No scripting, no 3D modeling, no hours in Studio.')}
${ctaButton('Browse the Showcase', `${baseUrl}/showcase`)}
`

  return layout(body, baseUrl, unsubscribeToken)
}

// ---------------------------------------------------------------------------
// Day 7 — Upgrade pitch
// ---------------------------------------------------------------------------

function planRow(feature: string, free: string, paid: string): string {
  return `<tr>
<td style="padding:10px 12px;font-size:13px;color:${TEXT_PRIMARY};border-bottom:1px solid #333;">${feature}</td>
<td style="padding:10px 12px;font-size:13px;color:${TEXT_SECONDARY};border-bottom:1px solid #333;text-align:center;">${free}</td>
<td style="padding:10px 12px;font-size:13px;color:${BRAND_GOLD};border-bottom:1px solid #333;text-align:center;font-weight:bold;">${paid}</td>
</tr>`
}

export function dripDay7(params: DripBaseParams): string {
  const { name, baseUrl, unsubscribeToken } = params

  const body = `
${heading(`Ready to level up, ${name}?`)}
${paragraph('You have been building for a week now. Here is what upgrading unlocks:')}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:12px 0 20px;border:1px solid #333;border-radius:8px;overflow:hidden;">
<tr style="background-color:#252525;">
  <td style="padding:10px 12px;font-size:12px;color:${TEXT_SECONDARY};font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Feature</td>
  <td style="padding:10px 12px;font-size:12px;color:${TEXT_SECONDARY};font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Free</td>
  <td style="padding:10px 12px;font-size:12px;color:${BRAND_GOLD};font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Paid</td>
</tr>
${planRow('Daily builds', '10', 'Unlimited')}
${planRow('3D mesh generation', 'No', 'Yes')}
${planRow('Marketplace selling', 'No', 'Yes')}
${planRow('Priority AI queue', 'No', 'Yes')}
${planRow('Build history', '7 days', 'Forever')}
</table>

${paragraph('Your free builds reset daily -- upgrade to never run out. Plans start at $9.99/mo.')}
${ctaButton('See Plans', `${baseUrl}/pricing`)}
`

  return layout(body, baseUrl, unsubscribeToken)
}
