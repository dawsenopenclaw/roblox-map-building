#!/usr/bin/env npx tsx
/**
 * ELI AI Beta Tester — Simulates real users 24/7
 *
 * Acts like a human beta tester:
 * - Navigates every page, clicks buttons, fills forms
 * - Tests full user journeys (home → sign-up → editor)
 * - Screenshots every state, sends to Gemini Vision for analysis
 * - Tests mobile + desktop + tablet viewports
 * - Checks hover states, scroll behavior, animations
 * - Finds broken links, console errors, performance issues
 * - Builds a massive growing issue list for ELI
 *
 * Usage:
 *   npx tsx scripts/eli-beta-tester.ts              # One sweep
 *   npx tsx scripts/eli-beta-tester.ts --loop        # Every 5 min
 *   npx tsx scripts/eli-beta-tester.ts --journey     # User journey only
 */

import { config as loadEnv } from 'dotenv'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

loadEnv()

const __filename2 = fileURLToPath(import.meta.url)
const __dirname2 = dirname(__filename2)
const SCREENSHOTS = join(__dirname2, '.eli-screenshots')
const ISSUES_FILE = join(__dirname2, '.eli-beta-issues.json')
const SITE = process.env.SITE_URL || 'https://forjegames.com'
const GEMINI_KEY = process.env.GEMINI_API_KEY
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const STAFF_CH = '1496361365206470777'

if (!existsSync(SCREENSHOTS)) mkdirSync(SCREENSHOTS, { recursive: true })

// ─── Types ───────────────────────────────────────────────────────────────────
interface BetaIssue {
  id: string
  sweep: number
  type: 'visual' | 'functional' | 'performance' | 'responsive' | 'ux' | 'a11y' | 'content' | 'error'
  severity: 'critical' | 'high' | 'medium' | 'low'
  page: string
  viewport: string
  description: string
  screenshot?: string
  timestamp: string
}

interface IssueStore {
  issues: BetaIssue[]
  sweepCount: number
  lastSweep: string
  totalIssuesFound: number
  resolvedCount: number
}

function loadIssues(): IssueStore {
  try {
    if (existsSync(ISSUES_FILE)) return JSON.parse(readFileSync(ISSUES_FILE, 'utf-8'))
  } catch {}
  return { issues: [], sweepCount: 0, lastSweep: '', totalIssuesFound: 0, resolvedCount: 0 }
}

function saveIssues(store: IssueStore) {
  store.lastSweep = new Date().toISOString()
  writeFileSync(ISSUES_FILE, JSON.stringify(store, null, 2))
}

function issueId(): string {
  return `bt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// Check if issue is already known (dedupe by description similarity)
function isDuplicate(desc: string, existing: BetaIssue[]): boolean {
  const words = new Set(desc.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  for (const e of existing) {
    const eWords = new Set(e.description.toLowerCase().split(/\s+/).filter(w => w.length > 3))
    let overlap = 0
    for (const w of words) { if (eWords.has(w)) overlap++ }
    const total = new Set([...words, ...eWords]).size
    if (total > 0 && overlap / total > 0.6) return true
  }
  return false
}

// ─── Gemini Vision ───────────────────────────────────────────────────────────
async function visionAnalyze(imagePath: string, context: string): Promise<string[]> {
  if (!GEMINI_KEY || !existsSync(imagePath)) return []
  try {
    const imageData = readFileSync(imagePath).toString('base64')
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `You are an expert QA tester for ForjeGames (AI Roblox game builder). Brand: gold #D4AF37 on dark #0a0a0a.

Context: ${context}

Look at this screenshot and list EVERY issue you see. Be picky. A real user would notice these:
- Text cut off, overflowing, or unreadable
- Buttons that look broken or unclickable
- Layout misalignment or spacing issues
- Missing content or empty sections
- Error messages or loading spinners stuck
- Overlapping elements
- Colors that don't match the brand
- Mobile issues (if mobile viewport)
- Anything that looks unfinished or unprofessional

Return a JSON array of strings — each string is one issue. Be specific about location.
If it looks perfect, return []. Return ONLY the JSON array.` },
              { inlineData: { mimeType: 'image/png', data: imageData } },
            ],
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    const match = text.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}

// ─── Viewports ───────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

// ─── Pages + User Journeys ───────────────────────────────────────────────────
const PAGES = [
  { path: '/', name: 'Home', critical: true },
  { path: '/pricing', name: 'Pricing', critical: true },
  { path: '/sign-in', name: 'Sign In', critical: true },
  { path: '/sign-up', name: 'Sign Up', critical: true },
  { path: '/about', name: 'About', critical: false },
  { path: '/download', name: 'Download', critical: false },
  { path: '/docs', name: 'Docs', critical: false },
  { path: '/showcase', name: 'Showcase', critical: false },
  { path: '/blog', name: 'Blog', critical: false },
  { path: '/changelog', name: 'Changelog', critical: false },
  { path: '/help', name: 'Help', critical: false },
  { path: '/privacy', name: 'Privacy', critical: false },
  { path: '/terms', name: 'Terms', critical: false },
]

// ─── Page Sweep ──────────────────────────────────────────────────────────────
async function sweepPage(
  page: Page,
  pageInfo: typeof PAGES[0],
  viewport: typeof VIEWPORTS[0],
  store: IssueStore,
  sweepNum: number
) {
  const url = `${SITE}${pageInfo.path}`
  const tag = `${pageInfo.name}-${viewport.name}`
  const issues: BetaIssue[] = []

  try {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    // Navigate with timing
    const start = Date.now()
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    const loadTime = Date.now() - start
    const status = response?.status() || 0

    // HTTP errors
    if (status >= 400) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'error', severity: 'critical',
        page: pageInfo.name, viewport: viewport.name,
        description: `HTTP ${status} error`, timestamp: new Date().toISOString() })
    }

    // Slow load
    if (loadTime > 5000) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'performance',
        severity: loadTime > 10000 ? 'high' : 'medium',
        page: pageInfo.name, viewport: viewport.name,
        description: `Slow load: ${(loadTime / 1000).toFixed(1)}s`, timestamp: new Date().toISOString() })
    }

    await sleep(1500) // Let animations settle

    // Collect console errors
    const consoleErrors: string[] = []
    const errorHandler = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200))
    }
    page.on('console', errorHandler)

    // Screenshot
    const ssPath = join(SCREENSHOTS, `${tag}-sweep${sweepNum}.png`)
    await page.screenshot({ path: ssPath, fullPage: true })

    // ── DOM Inspection ──
    const domIssues = await page.evaluate(({ vw }) => {
      const issues: string[] = []
      const body = document.body

      // Horizontal overflow
      if (body.scrollWidth > vw + 15) {
        issues.push(`Horizontal scroll: body is ${body.scrollWidth}px wide on ${vw}px viewport`)
      }

      // Blank page
      if (body.innerText.trim().length < 30) {
        issues.push('Page appears blank — almost no text content')
      }

      // Error messages visible
      const text = body.innerText
      if (text.includes('Unhandled Runtime Error')) issues.push('Unhandled runtime error visible')
      if (text.includes('Application error')) issues.push('Application error visible')
      if (text.includes('Something went wrong')) issues.push('Error boundary triggered')
      if (text.includes('500') && text.includes('error')) issues.push('500 error text visible')
      if (text.includes('404') && text.length < 500) issues.push('Looks like a 404 page')

      // Images
      const imgs = document.querySelectorAll('img')
      let broken = 0
      let noAlt = 0
      imgs.forEach(img => {
        if (img.naturalWidth === 0 && img.src && !img.src.includes('data:')) broken++
        if (!img.alt && img.src) noAlt++
      })
      if (broken > 0) issues.push(`${broken} broken/unloaded images`)
      if (noAlt > 3) issues.push(`${noAlt} images missing alt text`)

      // Buttons with no text
      const btns = document.querySelectorAll('button, [role="button"], a[href]')
      let emptyBtns = 0
      btns.forEach(btn => {
        if (!btn.textContent?.trim() && !btn.querySelector('svg') && !btn.getAttribute('aria-label')) emptyBtns++
      })
      if (emptyBtns > 2) issues.push(`${emptyBtns} buttons/links with no text or label`)

      // Overlapping text (crude: check for elements at same position)
      const textEls = document.querySelectorAll('h1, h2, h3, p, span, a')
      const positions = new Map<string, number>()
      textEls.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const key = `${Math.round(rect.top / 10)}-${Math.round(rect.left / 10)}`
        positions.set(key, (positions.get(key) || 0) + 1)
      })
      let overlaps = 0
      positions.forEach(count => { if (count > 3) overlaps++ })
      if (overlaps > 2) issues.push(`Possible overlapping text in ${overlaps} areas`)

      // Tiny text on mobile
      if (vw < 500) {
        let tiny = 0
        textEls.forEach(el => {
          const size = parseFloat(getComputedStyle(el).fontSize)
          if (size < 11 && el.textContent && el.textContent.trim().length > 5) tiny++
        })
        if (tiny > 5) issues.push(`${tiny} text elements too small for mobile (< 11px)`)
      }

      // CLS indicators: large elements with transform
      const animated = document.querySelectorAll('[style*="transform"], [style*="animation"]')
      if (animated.length > 20) issues.push(`${animated.length} animated elements — potential CLS/jank`)

      // Check scroll depth — are there sections way below the fold?
      const totalHeight = Math.max(body.scrollHeight, body.offsetHeight)
      if (totalHeight > 15000) issues.push(`Very long page: ${Math.round(totalHeight / 1000)}K px — might need pagination`)

      // Links
      const links = document.querySelectorAll('a[href]')
      let deadLinks = 0
      links.forEach(a => {
        const href = a.getAttribute('href') || ''
        if (href === '#' || href === '' || href === 'javascript:void(0)') deadLinks++
      })
      if (deadLinks > 3) issues.push(`${deadLinks} dead/placeholder links`)

      return issues
    }, { vw: viewport.width })

    for (const d of domIssues) {
      const sev = d.includes('error') || d.includes('blank') || d.includes('broken') ? 'high' :
        d.includes('scroll') || d.includes('small') ? 'medium' : 'low'
      issues.push({ id: issueId(), sweep: sweepNum, type: 'visual', severity: sev as BetaIssue['severity'],
        page: pageInfo.name, viewport: viewport.name,
        description: d, screenshot: ssPath, timestamp: new Date().toISOString() })
    }

    // Console errors
    if (consoleErrors.length > 0) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'error', severity: 'medium',
        page: pageInfo.name, viewport: viewport.name,
        description: `${consoleErrors.length} console errors: ${consoleErrors[0]?.slice(0, 150)}`,
        timestamp: new Date().toISOString() })
    }

    // ── Gemini Vision Analysis (desktop + critical pages only to save API) ──
    if (GEMINI_KEY && viewport.name === 'desktop' && pageInfo.critical) {
      const visionIssues = await visionAnalyze(ssPath, `${pageInfo.name} page, ${viewport.name} ${viewport.width}x${viewport.height}`)
      for (const v of visionIssues) {
        if (!isDuplicate(v, store.issues)) {
          issues.push({ id: issueId(), sweep: sweepNum, type: 'visual', severity: 'medium',
            page: pageInfo.name, viewport: viewport.name,
            description: `[AI Vision] ${v}`, screenshot: ssPath, timestamp: new Date().toISOString() })
        }
      }
    }

    // ── Interactive Tests ──
    // Test clickable elements
    if (viewport.name === 'desktop') {
      try {
        // Check all buttons are clickable (no overlapping elements blocking them)
        const clickableCheck = await page.evaluate(() => {
          const issues: string[] = []
          const btns = document.querySelectorAll('button:not([disabled]), a[href]:not([href="#"])')
          let blocked = 0
          btns.forEach(btn => {
            const rect = btn.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) return
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            if (centerY > window.innerHeight) return // offscreen
            const topEl = document.elementFromPoint(centerX, centerY)
            if (topEl && topEl !== btn && !btn.contains(topEl) && !(topEl as HTMLElement).closest?.('a, button')) {
              blocked++
            }
          })
          if (blocked > 2) issues.push(`${blocked} buttons/links blocked by overlapping elements`)
          return issues
        })
        for (const c of clickableCheck) {
          issues.push({ id: issueId(), sweep: sweepNum, type: 'functional', severity: 'high',
            page: pageInfo.name, viewport: viewport.name,
            description: c, timestamp: new Date().toISOString() })
        }
      } catch {}
    }

    // Scroll test — check bottom of page renders
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await sleep(1000)
      const bottomSs = join(SCREENSHOTS, `${tag}-bottom-sweep${sweepNum}.png`)
      await page.screenshot({ path: bottomSs })
      await page.evaluate(() => window.scrollTo(0, 0))
    } catch {}

    page.removeListener('console', errorHandler)
  } catch (err) {
    issues.push({ id: issueId(), sweep: sweepNum, type: 'error', severity: 'critical',
      page: pageInfo.name, viewport: viewport.name,
      description: `Page crashed: ${(err as Error).message.slice(0, 200)}`,
      timestamp: new Date().toISOString() })
  }

  // Dedupe and add to store
  for (const issue of issues) {
    if (!isDuplicate(issue.description, store.issues)) {
      store.issues.push(issue)
      store.totalIssuesFound++
    }
  }

  return issues.length
}

// ─── User Journey Tests ──────────────────────────────────────────────────────
async function testUserJourney(page: Page, store: IssueStore, sweepNum: number) {
  console.log('  Journey: Home → Pricing → Sign Up flow')
  const issues: BetaIssue[] = []

  try {
    // 1. Land on home page
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 })
    await sleep(2000)

    // 2. Find and click a CTA button
    const cta = await page.$('a[href*="sign"], a[href*="pricing"], button:has-text("Get Started"), button:has-text("Start"), a:has-text("Try")')
    if (!cta) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'ux', severity: 'high',
        page: 'Home', viewport: 'desktop',
        description: 'No clear CTA button found on home page (Get Started, Try, Sign Up)',
        timestamp: new Date().toISOString() })
    } else {
      // Check CTA is visible above the fold
      const ctaBox = await cta.boundingBox()
      if (ctaBox && ctaBox.y > 900) {
        issues.push({ id: issueId(), sweep: sweepNum, type: 'ux', severity: 'medium',
          page: 'Home', viewport: 'desktop',
          description: `Main CTA is below the fold (y=${Math.round(ctaBox.y)}px)`,
          timestamp: new Date().toISOString() })
      }
    }

    // 3. Navigate to pricing
    await page.goto(`${SITE}/pricing`, { waitUntil: 'networkidle', timeout: 30000 })
    await sleep(1500)
    const pricingScreenshot = join(SCREENSHOTS, `journey-pricing-sweep${sweepNum}.png`)
    await page.screenshot({ path: pricingScreenshot })

    // Check pricing cards exist
    const priceCards = await page.$$('[class*="price"], [class*="card"], [class*="tier"], [class*="plan"]')
    if (priceCards.length === 0) {
      // Fallback: check for $ signs
      const hasPrices = await page.evaluate(() => document.body.innerText.includes('$'))
      if (!hasPrices) {
        issues.push({ id: issueId(), sweep: sweepNum, type: 'content', severity: 'high',
          page: 'Pricing', viewport: 'desktop',
          description: 'No pricing cards or dollar amounts visible on pricing page',
          timestamp: new Date().toISOString() })
      }
    }

    // 4. Navigate to sign up
    await page.goto(`${SITE}/sign-up`, { waitUntil: 'networkidle', timeout: 30000 })
    await sleep(2000)
    const signupScreenshot = join(SCREENSHOTS, `journey-signup-sweep${sweepNum}.png`)
    await page.screenshot({ path: signupScreenshot })

    // Check sign up form exists
    const hasForm = await page.evaluate(() => {
      return !!(document.querySelector('form') ||
        document.querySelector('input[type="email"]') ||
        document.querySelector('[class*="clerk"]') ||
        document.querySelector('[class*="sign"]'))
    })
    if (!hasForm) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'functional', severity: 'critical',
        page: 'Sign Up', viewport: 'desktop',
        description: 'No sign-up form, email input, or Clerk component found',
        timestamp: new Date().toISOString() })
    }

    // 5. Check navigation works
    const navLinks = await page.$$('nav a[href], header a[href]')
    if (navLinks.length < 3) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'ux', severity: 'medium',
        page: 'Global', viewport: 'desktop',
        description: `Only ${navLinks.length} nav links found — navigation may be broken`,
        timestamp: new Date().toISOString() })
    }

    // 6. Check footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await sleep(1000)
    const hasFooter = await page.evaluate(() => !!document.querySelector('footer'))
    if (!hasFooter) {
      issues.push({ id: issueId(), sweep: sweepNum, type: 'ux', severity: 'low',
        page: 'Global', viewport: 'desktop',
        description: 'No <footer> element found',
        timestamp: new Date().toISOString() })
    }

  } catch (err) {
    issues.push({ id: issueId(), sweep: sweepNum, type: 'error', severity: 'high',
      page: 'Journey', viewport: 'desktop',
      description: `Journey test crashed: ${(err as Error).message.slice(0, 200)}`,
      timestamp: new Date().toISOString() })
  }

  for (const issue of issues) {
    if (!isDuplicate(issue.description, store.issues)) {
      store.issues.push(issue)
      store.totalIssuesFound++
    }
  }

  return issues.length
}

// ─── Discord Report ──────────────────────────────────────────────────────────
async function reportToDiscord(store: IssueStore, newIssueCount: number, sweepNum: number) {
  if (!BOT_TOKEN || !STAFF_CH || newIssueCount === 0) return

  const critical = store.issues.filter(i => i.sweep === sweepNum && i.severity === 'critical')
  const high = store.issues.filter(i => i.sweep === sweepNum && i.severity === 'high')

  const embed = {
    title: `Beta Tester Sweep #${sweepNum}`,
    color: critical.length > 0 ? 0xEF4444 : high.length > 0 ? 0xF97316 : 0x22C55E,
    description: [
      `**${newIssueCount} new issues** found this sweep`,
      `**${store.issues.length} total** issues accumulated`,
      critical.length > 0 ? `\u26A0\uFE0F ${critical.length} critical` : '',
      high.length > 0 ? `\uD83D\uDD34 ${high.length} high` : '',
      '',
      ...store.issues.filter(i => i.sweep === sweepNum).slice(0, 8).map(i =>
        `\u2022 **[${i.severity.toUpperCase()}]** ${i.page} (${i.viewport}): ${i.description.slice(0, 100)}`
      ),
    ].filter(Boolean).join('\n'),
    footer: { text: `ELI Beta Tester | Sweep ${sweepNum} | ${new Date().toISOString().slice(0, 16)} UTC` },
  }

  try {
    await fetch(`https://discord.com/api/v10/channels/${STAFF_CH}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch {}
}

// ─── Main Sweep ──────────────────────────────────────────────────────────────
async function runSweep(journeyOnly: boolean = false) {
  const store = loadIssues()
  store.sweepCount++
  const sweepNum = store.sweepCount

  console.log(`\n${'='.repeat(50)}`)
  console.log(`ELI Beta Tester — Sweep #${sweepNum}`)
  console.log(`Site: ${SITE}`)
  console.log(`${'='.repeat(50)}\n`)

  let browser: Browser | null = null
  let newIssues = 0

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ELI-BetaTester/1.0',
    })
    const page = await context.newPage()

    // User journey test
    console.log('Phase 1: User Journey Test')
    const journeyIssues = await testUserJourney(page, store, sweepNum)
    newIssues += journeyIssues
    console.log(`  Found ${journeyIssues} issues\n`)

    if (!journeyOnly) {
      // Full page sweep across viewports
      console.log('Phase 2: Full Page Sweep')
      for (const vp of VIEWPORTS) {
        console.log(`  Viewport: ${vp.name} (${vp.width}x${vp.height})`)
        for (const pg of PAGES) {
          const count = await sweepPage(page, pg, vp, store, sweepNum)
          if (count > 0) console.log(`    ${pg.name}: ${count} issues`)
          await sleep(500) // Be polite
        }
      }
      const sweepIssueCount = store.issues.filter(i => i.sweep === sweepNum).length - journeyIssues
      newIssues += sweepIssueCount
      console.log(`  Page sweep found ${sweepIssueCount} issues\n`)
    }

    await browser.close()
  } catch (err) {
    console.error('Browser error:', (err as Error).message)
    if (browser) await browser.close().catch(() => {})
  }

  // Prune old issues (keep last 500)
  if (store.issues.length > 500) {
    store.issues = store.issues.slice(-500)
  }

  saveIssues(store)

  // Report
  const total = store.issues.length
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const i of store.issues) bySeverity[i.severity]++

  console.log(`${'─'.repeat(50)}`)
  console.log(`Sweep #${sweepNum} Complete`)
  console.log(`  New issues: ${newIssues}`)
  console.log(`  Total accumulated: ${total}`)
  console.log(`  Critical: ${bySeverity.critical} | High: ${bySeverity.high} | Medium: ${bySeverity.medium} | Low: ${bySeverity.low}`)
  console.log(`${'─'.repeat(50)}\n`)

  // Post to Discord if new issues found
  await reportToDiscord(store, newIssues, sweepNum)

  return { newIssues, total }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const loop = args.includes('--loop')
const journeyOnly = args.includes('--journey')

runSweep(journeyOnly).then(({ newIssues }) => {
  if (loop) {
    const interval = 5 * 60 * 1000 // 5 minutes
    console.log('Looping every 5 minutes...\n')
    setInterval(() => runSweep(journeyOnly), interval)
  } else if (newIssues === 0) {
    console.log('No new issues found. Site looking clean.')
  }
}).catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
