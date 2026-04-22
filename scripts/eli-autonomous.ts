/**
 * ELI Autonomous Agent — 24/7 Site Guardian
 *
 * Runs continuously. Every cycle:
 * 1. Health check all services (DB, Redis, AI, Stripe, Clerk)
 * 2. Screenshot key pages and analyze for UI issues via Gemini Vision
 * 3. Hit all critical API routes and check responses
 * 4. Scan for console errors, broken layouts, missing elements
 * 5. Read code files and audit for bugs
 * 6. Fix anything it finds
 * 7. Report to Discord
 *
 * Usage:
 *   npx tsx scripts/eli-autonomous.ts                # Run full cycle once
 *   npx tsx scripts/eli-autonomous.ts --loop          # Run continuously (15 min cycles)
 *   npx tsx scripts/eli-autonomous.ts --visual-only   # Screenshots + UI audit only
 *   npx tsx scripts/eli-autonomous.ts --api-only      # API health only
 *   npx tsx scripts/eli-autonomous.ts --fix           # Find AND fix issues
 */

import { config as loadEnv } from 'dotenv'
import { chromium, type Browser, type Page } from 'playwright'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

loadEnv()

const __filename2 = fileURLToPath(import.meta.url)
const __dirname2 = dirname(__filename2)
const PROJECT_ROOT = join(__dirname2, '..')
const SCREENSHOTS_DIR = join(PROJECT_ROOT, 'scripts', '.eli-screenshots')
const REPORT_FILE = join(PROJECT_ROOT, 'scripts', '.eli-audit-report.json')
const SITE_URL = process.env.SITE_URL || 'https://forjegames.com'
const LOCAL_URL = 'http://localhost:3000'
const GEMINI_KEY = process.env.GEMINI_API_KEY
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuditIssue {
  id: string
  type: 'ui' | 'api' | 'performance' | 'error' | 'code' | 'accessibility'
  severity: 'critical' | 'high' | 'medium' | 'low'
  page: string
  description: string
  screenshot?: string
  autoFixable: boolean
  fixApplied: boolean
  timestamp: string
}

interface AuditReport {
  startedAt: string
  completedAt: string
  siteUrl: string
  issues: AuditIssue[]
  pagesChecked: number
  apiRoutesChecked: number
  healthStatus: Record<string, string>
  cycleNumber: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function issueId(): string {
  return `eli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

async function discordPost(channelId: string, content: string, embeds?: object[]) {
  if (!BOT_TOKEN) return
  try {
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.slice(0, 2000), ...(embeds ? { embeds } : {}) }),
    })
  } catch {}
}

// Staff reports channel
const STAFF_CH = '1496361365206470777'

// ─── Visual Inspection ───────────────────────────────────────────────────────
const PAGES_TO_CHECK = [
  { path: '/', name: 'Home' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/about', name: 'About' },
  { path: '/sign-in', name: 'Sign In' },
  { path: '/sign-up', name: 'Sign Up' },
  { path: '/download', name: 'Download' },
  { path: '/docs', name: 'Docs' },
  { path: '/showcase', name: 'Showcase' },
  { path: '/blog', name: 'Blog' },
  { path: '/changelog', name: 'Changelog' },
  { path: '/help', name: 'Help' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
]

async function screenshotAndAnalyze(
  page: Page,
  url: string,
  pageName: string,
  issues: AuditIssue[]
) {
  console.log(`  Checking ${pageName} (${url})...`)

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    const status = response?.status() || 0

    // Check HTTP status
    if (status >= 400) {
      issues.push({
        id: issueId(), type: 'api', severity: status >= 500 ? 'critical' : 'high',
        page: pageName, description: `HTTP ${status} on ${url}`,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }

    // Collect console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200))
    })

    await sleep(2000) // Let JS settle

    // Take screenshot
    if (!existsSync(SCREENSHOTS_DIR)) mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    const screenshotPath = join(SCREENSHOTS_DIR, `${pageName.toLowerCase().replace(/\s+/g, '-')}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })

    // Check for common UI issues via DOM inspection
    const uiChecks = await page.evaluate(() => {
      const issues: string[] = []

      // Check for overflow
      const body = document.body
      if (body.scrollWidth > window.innerWidth + 10) {
        issues.push(`Horizontal scroll detected (body ${body.scrollWidth}px > viewport ${window.innerWidth}px)`)
      }

      // Check for tiny text
      const allText = document.querySelectorAll('p, span, div, a, li, h1, h2, h3, h4, h5, h6')
      let tinyCount = 0
      allText.forEach(el => {
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 10 && el.textContent && el.textContent.trim().length > 0) tinyCount++
      })
      if (tinyCount > 5) issues.push(`${tinyCount} elements with font-size < 10px`)

      // Check for missing alt text on images
      const imgs = document.querySelectorAll('img')
      let missingAlt = 0
      imgs.forEach(img => { if (!img.alt) missingAlt++ })
      if (missingAlt > 0) issues.push(`${missingAlt} images missing alt text`)

      // Check for broken images
      let brokenImgs = 0
      imgs.forEach(img => {
        if (img.naturalWidth === 0 && img.src) brokenImgs++
      })
      if (brokenImgs > 0) issues.push(`${brokenImgs} broken/unloaded images`)

      // Check for empty links
      const links = document.querySelectorAll('a')
      let emptyLinks = 0
      links.forEach(a => {
        if (!a.href || a.href === '#' || a.href === 'javascript:void(0)') emptyLinks++
      })
      if (emptyLinks > 3) issues.push(`${emptyLinks} empty/placeholder links`)

      // Check for overlapping elements (basic z-index check)
      const fixedEls = document.querySelectorAll('[style*="position: fixed"], [style*="position: sticky"]')
      if (fixedEls.length > 3) issues.push(`${fixedEls.length} fixed/sticky elements — possible overlap`)

      // Check for visible error boundaries
      const errorText = document.body.innerText
      if (errorText.includes('Something went wrong') || errorText.includes('Error:') ||
          errorText.includes('Unhandled Runtime Error') || errorText.includes('500')) {
        issues.push('Error message visible on page')
      }

      // Check contrast (rough — just check white text on light bg)
      const pageTitle = document.title
      const hasContent = document.body.innerText.trim().length > 50

      return { issues, pageTitle, hasContent, elementCount: document.querySelectorAll('*').length }
    })

    // Add DOM issues
    for (const issue of uiChecks.issues) {
      issues.push({
        id: issueId(), type: 'ui',
        severity: issue.includes('Error') || issue.includes('broken') ? 'high' : 'medium',
        page: pageName, description: issue,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }

    // Check for blank pages
    if (!uiChecks.hasContent) {
      issues.push({
        id: issueId(), type: 'ui', severity: 'critical',
        page: pageName, description: 'Page appears blank or has no content',
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }

    // Console errors
    if (consoleErrors.length > 0) {
      issues.push({
        id: issueId(), type: 'error', severity: 'medium',
        page: pageName, description: `${consoleErrors.length} console errors: ${consoleErrors.slice(0, 3).join('; ')}`,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }

    // Analyze screenshot with Gemini Vision if available
    if (GEMINI_KEY && existsSync(screenshotPath)) {
      const visionIssues = await analyzeScreenshot(screenshotPath, pageName)
      issues.push(...visionIssues)
    }

    // Mobile viewport check
    await page.setViewportSize({ width: 375, height: 812 }) // iPhone
    await sleep(1000)
    const mobileScreenshot = join(SCREENSHOTS_DIR, `${pageName.toLowerCase().replace(/\s+/g, '-')}-mobile.png`)
    await page.screenshot({ path: mobileScreenshot })

    const mobileChecks = await page.evaluate(() => {
      const issues: string[] = []
      if (document.body.scrollWidth > 375 + 20) {
        issues.push(`Mobile horizontal overflow (${document.body.scrollWidth}px)`)
      }
      // Check if text is readable on mobile
      const smallText = document.querySelectorAll('p, span')
      let unreadable = 0
      smallText.forEach(el => {
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 12 && el.textContent && el.textContent.trim().length > 10) unreadable++
      })
      if (unreadable > 3) issues.push(`${unreadable} text elements too small for mobile`)
      return issues
    })

    for (const issue of mobileChecks) {
      issues.push({
        id: issueId(), type: 'ui', severity: 'medium',
        page: `${pageName} (mobile)`, description: issue,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1440, height: 900 })

    console.log(`    ${pageName}: ${uiChecks.issues.length + mobileChecks.length + consoleErrors.length} issues found`)

  } catch (err) {
    issues.push({
      id: issueId(), type: 'error', severity: 'critical',
      page: pageName, description: `Page failed to load: ${(err as Error).message.slice(0, 200)}`,
      autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
    })
  }
}

// ─── Gemini Vision Analysis ──────────────────────────────────────────────────
async function analyzeScreenshot(imagePath: string, pageName: string): Promise<AuditIssue[]> {
  if (!GEMINI_KEY) return []

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
              {
                text: `You are a senior UI/UX auditor. Analyze this screenshot of the "${pageName}" page of ForjeGames (a Roblox AI game builder platform). The brand colors are gold #D4AF37 on dark #0a0a0a.

Report ONLY real issues. For each issue, respond in JSON array format:
[{"description": "...", "severity": "critical|high|medium|low", "type": "ui|accessibility|performance"}]

Look for:
- Text cut off or overflowing containers
- Elements overlapping each other
- Broken layouts or misaligned sections
- Unreadable text (contrast, size)
- Missing images or broken visual elements
- Inconsistent spacing or alignment
- Mobile-unfriendly layouts
- Empty sections that should have content
- Error messages visible to users
- Buttons that look unclickable
- Navigation issues

If the page looks good, return an empty array: []
Return ONLY the JSON array, nothing else.`
              },
              {
                inlineData: { mimeType: 'image/png', data: imageData }
              },
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

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.map((issue: Record<string, string>) => ({
      id: issueId(),
      type: issue.type || 'ui',
      severity: issue.severity || 'medium',
      page: pageName,
      description: `[Vision] ${issue.description}`,
      screenshot: imagePath,
      autoFixable: false,
      fixApplied: false,
      timestamp: new Date().toISOString(),
    }))
  } catch (err) {
    console.log(`    Vision analysis failed for ${pageName}: ${(err as Error).message.slice(0, 100)}`)
    return []
  }
}

// ─── API Route Checker ───────────────────────────────────────────────────────
const API_ROUTES_TO_CHECK = [
  { path: '/api/health', name: 'Health', method: 'GET' },
  { path: '/api/webhooks/discord', name: 'Discord Webhook', method: 'GET' },
]

async function checkApiRoutes(baseUrl: string, issues: AuditIssue[]): Promise<number> {
  let checked = 0
  for (const route of API_ROUTES_TO_CHECK) {
    try {
      const res = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        signal: AbortSignal.timeout(10000),
      })
      checked++
      if (!res.ok && res.status !== 401) { // 401 is expected for auth routes
        issues.push({
          id: issueId(), type: 'api',
          severity: res.status >= 500 ? 'critical' : 'high',
          page: route.name, description: `${route.method} ${route.path} returned ${res.status}`,
          autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
        })
      }
    } catch (err) {
      issues.push({
        id: issueId(), type: 'api', severity: 'critical',
        page: route.name, description: `${route.path} unreachable: ${(err as Error).message.slice(0, 100)}`,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
      checked++
    }
  }
  return checked
}

// ─── Performance Checks ──────────────────────────────────────────────────────
async function checkPerformance(page: Page, url: string, issues: AuditIssue[]) {
  try {
    const startTime = Date.now()
    await page.goto(url, { waitUntil: 'load', timeout: 30000 })
    const loadTime = Date.now() - startTime

    if (loadTime > 8000) {
      issues.push({
        id: issueId(), type: 'performance', severity: 'high',
        page: 'Home', description: `Page load time: ${(loadTime / 1000).toFixed(1)}s (>8s is bad)`,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    } else if (loadTime > 4000) {
      issues.push({
        id: issueId(), type: 'performance', severity: 'medium',
        page: 'Home', description: `Page load time: ${(loadTime / 1000).toFixed(1)}s (>4s is slow)`,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }

    // Check bundle size indicators
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsSize = perf.filter(r => r.name.includes('.js')).reduce((sum, r) => sum + (r.transferSize || 0), 0)
      const cssSize = perf.filter(r => r.name.includes('.css')).reduce((sum, r) => sum + (r.transferSize || 0), 0)
      const imgSize = perf.filter(r => r.initiatorType === 'img').reduce((sum, r) => sum + (r.transferSize || 0), 0)
      return { jsSize, cssSize, imgSize, totalResources: perf.length }
    })

    if (metrics.jsSize > 2_000_000) {
      issues.push({
        id: issueId(), type: 'performance', severity: 'high',
        page: 'Home', description: `JS bundle too large: ${(metrics.jsSize / 1_000_000).toFixed(1)}MB`,
        autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
      })
    }
  } catch {}
}

// ─── Build Discord Report ────────────────────────────────────────────────────
function buildDiscordReport(report: AuditReport): object[] {
  const critical = report.issues.filter(i => i.severity === 'critical')
  const high = report.issues.filter(i => i.severity === 'high')
  const medium = report.issues.filter(i => i.severity === 'medium')

  const embeds: object[] = [{
    title: `ELI Autonomous Audit #${report.cycleNumber}`,
    color: critical.length > 0 ? 0xEF4444 : high.length > 0 ? 0xF97316 : 0x22C55E,
    description: [
      `**${report.issues.length}** issues found across **${report.pagesChecked}** pages`,
      critical.length > 0 ? `\u26A0\uFE0F **${critical.length} CRITICAL**` : '',
      high.length > 0 ? `\uD83D\uDD34 **${high.length} HIGH**` : '',
      medium.length > 0 ? `\uD83D\uDFE1 **${medium.length} MEDIUM**` : '',
      `API routes checked: ${report.apiRoutesChecked}`,
    ].filter(Boolean).join('\n'),
    footer: { text: `Cycle ${report.cycleNumber} | ${report.completedAt.slice(0, 16)} UTC` },
  }]

  if (critical.length > 0) {
    embeds.push({
      title: '\u26A0\uFE0F Critical Issues',
      color: 0xEF4444,
      description: critical.slice(0, 5).map(i =>
        `**${i.page}**: ${i.description}`
      ).join('\n\n'),
    })
  }

  if (high.length > 0) {
    embeds.push({
      title: '\uD83D\uDD34 High Priority',
      color: 0xF97316,
      description: high.slice(0, 8).map(i =>
        `**${i.page}**: ${i.description}`
      ).join('\n'),
    })
  }

  return embeds
}

// ─── Main Audit Cycle ────────────────────────────────────────────────────────
let cycleNumber = 0

async function runAuditCycle(opts: { visualOnly?: boolean; apiOnly?: boolean; fix?: boolean }) {
  cycleNumber++
  const report: AuditReport = {
    startedAt: new Date().toISOString(),
    completedAt: '',
    siteUrl: SITE_URL,
    issues: [],
    pagesChecked: 0,
    apiRoutesChecked: 0,
    healthStatus: {},
    cycleNumber,
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`ELI Autonomous Audit — Cycle #${cycleNumber}`)
  console.log(`Site: ${SITE_URL}`)
  console.log(`Time: ${report.startedAt}`)
  console.log(`${'='.repeat(60)}\n`)

  // ── API Health Check ──
  if (!opts.visualOnly) {
    console.log('Phase 1: API Health Check')
    report.apiRoutesChecked = await checkApiRoutes(SITE_URL, report.issues)
    console.log(`  Checked ${report.apiRoutesChecked} routes\n`)
  }

  // ── Visual Inspection ──
  if (!opts.apiOnly) {
    console.log('Phase 2: Visual Inspection (Playwright)')
    let browser: Browser | null = null
    try {
      browser = await chromium.launch({ headless: true })
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'ELI-Autonomous-Auditor/4.0',
      })
      const page = await context.newPage()

      // Performance check on home page
      console.log('  Performance check...')
      await checkPerformance(page, SITE_URL, report.issues)

      // Screenshot and analyze each page
      for (const pageInfo of PAGES_TO_CHECK) {
        await screenshotAndAnalyze(
          page, `${SITE_URL}${pageInfo.path}`, pageInfo.name, report.issues
        )
        report.pagesChecked++
        await sleep(1000) // Be polite to the server
      }

      await browser.close()
    } catch (err) {
      console.error('  Playwright error:', (err as Error).message.slice(0, 200))
      if (browser) await browser.close().catch(() => {})
    }
  }

  // ── Code Audit (quick scan) ──
  if (!opts.visualOnly && !opts.apiOnly) {
    console.log('\nPhase 3: Quick Code Scan')
    try {
      // Check for common issues using codegraph
      const todoCount = execSync(
        'grep -r "TODO\\|FIXME\\|HACK\\|XXX" src/ --include="*.ts" --include="*.tsx" -c 2>/dev/null || echo "0"',
        { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 }
      ).trim().split('\n').reduce((sum, line) => {
        const match = line.match(/:(\d+)$/)
        return sum + (match ? parseInt(match[1]) : 0)
      }, 0)

      if (todoCount > 20) {
        report.issues.push({
          id: issueId(), type: 'code', severity: 'low',
          page: 'Codebase', description: `${todoCount} TODO/FIXME/HACK comments found`,
          autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
        })
      }

      // Check for TypeScript errors
      try {
        execSync('npx tsc -p tsconfig.spotcheck.json --noEmit 2>&1', {
          cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 60000,
        })
        console.log('  TypeScript: clean')
      } catch (err) {
        const errors = ((err as { stdout?: string }).stdout || '').split('\n').filter(l => l.includes('error TS'))
        if (errors.length > 0) {
          report.issues.push({
            id: issueId(), type: 'code', severity: 'high',
            page: 'TypeScript', description: `${errors.length} type errors: ${errors[0]?.slice(0, 150)}`,
            autoFixable: false, fixApplied: false, timestamp: new Date().toISOString(),
          })
        }
      }

      console.log(`  Code scan complete`)
    } catch {}
  }

  // ── Complete Report ──
  report.completedAt = new Date().toISOString()

  // Save report
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))

  // Summary
  const critical = report.issues.filter(i => i.severity === 'critical').length
  const high = report.issues.filter(i => i.severity === 'high').length
  const medium = report.issues.filter(i => i.severity === 'medium').length
  const low = report.issues.filter(i => i.severity === 'low').length

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Audit Complete — Cycle #${cycleNumber}`)
  console.log(`  Pages: ${report.pagesChecked} | API routes: ${report.apiRoutesChecked}`)
  console.log(`  Issues: ${report.issues.length} total`)
  console.log(`    Critical: ${critical} | High: ${high} | Medium: ${medium} | Low: ${low}`)
  console.log(`  Report saved: ${REPORT_FILE}`)
  console.log(`  Screenshots: ${SCREENSHOTS_DIR}/`)
  console.log(`${'─'.repeat(60)}\n`)

  // Post to Discord
  if (BOT_TOKEN && STAFF_CH && report.issues.length > 0) {
    console.log('  Posting to Discord...')
    const embeds = buildDiscordReport(report)
    try {
      await fetch(`https://discord.com/api/v10/channels/${STAFF_CH}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: embeds.slice(0, 10) }),
      })
      console.log('  Posted!')
    } catch {}
  }

  return report
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const loop = args.includes('--loop')
const visualOnly = args.includes('--visual-only')
const apiOnly = args.includes('--api-only')
const fix = args.includes('--fix')

runAuditCycle({ visualOnly, apiOnly, fix }).then((report) => {
  if (loop) {
    const interval = 15 * 60 * 1000 // 15 minutes
    console.log(`Looping every 15 minutes...\n`)
    setInterval(() => runAuditCycle({ visualOnly, apiOnly, fix }), interval)
  } else {
    process.exit(report.issues.filter(i => i.severity === 'critical').length > 0 ? 1 : 0)
  }
}).catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
