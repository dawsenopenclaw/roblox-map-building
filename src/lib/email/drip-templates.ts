/**
 * Drip campaign email templates — raw HTML strings.
 *
 * Day 3: "Did you try building yet?" — example builds, CTA to editor
 * Day 7: "Builders like you are creating amazing games" — social proof, CTA
 *
 * All templates are dark-themed (#0a0a0a bg, #D4AF37 gold accents),
 * mobile-responsive, inline-styled, and include an unsubscribe link.
 *
 * CAN-SPAM compliant: physical address + unsubscribe link in every email.
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
  <span style="font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">Forje</span><span style="font-size:28px;font-weight:bold;color:${BRAND_GOLD};letter-spacing:1px;">Games</span>
</td></tr>

<!-- Body -->
<tr><td style="background-color:${BRAND_CARD};border-radius:12px;padding:32px 28px;">
${body}
</td></tr>

<!-- Footer -->
<tr><td align="center" style="padding-top:24px;">
  <p style="margin:0 0 8px;font-size:12px;color:${TEXT_SECONDARY};line-height:1.6;">
    You're receiving this because you signed up for ForjeGames.<br/>
    <a href="${baseUrl}/unsubscribe?token=${unsubscribeToken}" style="color:${TEXT_SECONDARY};text-decoration:underline;">Unsubscribe from these emails</a>
  </p>
  <p style="margin:0;font-size:11px;color:#666666;">
    ForjeGames LLC &middot; 2261 Market Street #4671 &middot; San Francisco, CA 94114
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
<tr><td style="border-radius:10px;background-color:${BRAND_GOLD};">
  <a href="${href}" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:bold;color:${BRAND_DARK};text-decoration:none;border-radius:10px;">${text}</a>
</td></tr>
</table>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;color:#ffffff;line-height:1.3;">${text}</h1>`
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:${TEXT_PRIMARY};line-height:1.6;">${text}</p>`
}

// ---------------------------------------------------------------------------
// Day 3 — "Did you try building yet?"
// ---------------------------------------------------------------------------

interface ShowcaseBuild {
  title: string
  description: string
}

const SHOWCASE_BUILDS: ShowcaseBuild[] = [
  { title: 'Neon Obby Tower', description: '50 stages with glowing platforms and checkpoint saves' },
  { title: 'Pizza Tycoon', description: 'Full tycoon loop — upgrades, workers, and a delivery van' },
  { title: 'Haunted Forest RPG', description: 'Enemy AI, loot drops, and boss fights' },
  { title: 'Space Station Escape', description: 'Puzzles, airlocks, zero-gravity zones' },
]

function showcaseCard(build: ShowcaseBuild): string {
  return `<tr>
<td style="padding:8px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#252525;border-radius:8px;border:1px solid #333;">
<tr><td style="padding:14px 16px;">
  <p style="margin:0 0 4px;font-size:14px;font-weight:bold;color:${BRAND_GOLD};">${build.title}</p>
  <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};line-height:1.4;">${build.description}</p>
</td></tr>
</table>
</td>
</tr>`
}

export function dripDay3(params: DripBaseParams): string {
  const { name, baseUrl, unsubscribeToken } = params

  const cards = SHOWCASE_BUILDS.map((b) => showcaseCard(b)).join('\n')

  const body = `
${heading(`${name}, did you try building yet?`)}
${paragraph('Other creators are already shipping games from a single text prompt. No scripting required. Here are a few from this week:')}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 16px;">
${cards}
</table>

${paragraph('Every one of these was built by typing one sentence. The AI writes the scripts, places the terrain, sets up the lighting — the whole thing.')}
${paragraph('Your turn.')}
${ctaButton('Open the Editor', `${baseUrl}/editor`)}
`

  return layout(body, baseUrl, unsubscribeToken)
}

// ---------------------------------------------------------------------------
// Day 7 — "Builders like you are creating amazing games"
// ---------------------------------------------------------------------------

export function dripDay7(params: DripBaseParams): string {
  const { name, baseUrl, unsubscribeToken } = params

  const body = `
${heading(`Builders like you are creating games, ${name}`)}
${paragraph("It's been a week since you joined ForjeGames. Creators on the platform have already shipped hundreds of games — obbies, tycoons, RPGs, horror maps, and things we didn't even expect.")}
${paragraph("Here's the thing: every single one started as a text prompt. No 3D modeling. No hours in Studio. Just an idea and 30 seconds.")}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;border:1px solid #333;border-radius:8px;overflow:hidden;">
<tr style="background-color:#252525;">
  <td style="padding:10px 12px;font-size:12px;color:${TEXT_SECONDARY};font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">What you get</td>
  <td style="padding:10px 12px;font-size:12px;color:${BRAND_GOLD};font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Free plan</td>
</tr>
<tr>
  <td style="padding:10px 12px;font-size:14px;color:${TEXT_PRIMARY};border-bottom:1px solid #333;">Builds per day</td>
  <td style="padding:10px 12px;font-size:14px;color:${BRAND_GOLD};border-bottom:1px solid #333;text-align:center;font-weight:bold;">10</td>
</tr>
<tr>
  <td style="padding:10px 12px;font-size:14px;color:${TEXT_PRIMARY};border-bottom:1px solid #333;">AI agents</td>
  <td style="padding:10px 12px;font-size:14px;color:${BRAND_GOLD};border-bottom:1px solid #333;text-align:center;font-weight:bold;">200+</td>
</tr>
<tr>
  <td style="padding:10px 12px;font-size:14px;color:${TEXT_PRIMARY};">Templates</td>
  <td style="padding:10px 12px;font-size:14px;color:${BRAND_GOLD};text-align:center;font-weight:bold;">200+</td>
</tr>
</table>

${paragraph("You still have free tokens. Use them before they expire.")}
${ctaButton('Build Something Now', `${baseUrl}/editor`)}
`

  return layout(body, baseUrl, unsubscribeToken)
}
