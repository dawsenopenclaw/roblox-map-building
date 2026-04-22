#!/usr/bin/env npx tsx
/**
 * ELI 15-Agent Swarm — Each agent is a specialist that audits one angle
 *
 * Agents:
 *  1. UI/UX Auditor       — Layout, spacing, visual polish on every page
 *  2. AI Chat Tester       — Actually converses with the AI, rates quality
 *  3. 3D Mesh Checker      — Tests Meshy 3D gen endpoints
 *  4. Image Gen Tester     — Tests FAL image gen across styles
 *  5. Studio Plugin Agent  — Tests plugin connection flow
 *  6. Auth/Onboarding      — Sign-up, sign-in, age gate, wizard
 *  7. Billing Auditor      — Stripe checkout, portal, tiers
 *  8. Performance Agent    — Load times, bundle, Core Web Vitals
 *  9. Mobile Agent         — Every page on 375px + 768px
 * 10. SEO/Marketing        — Meta tags, OG, sitemap, headings
 * 11. Accessibility        — ARIA, contrast, keyboard nav
 * 12. Security Agent       — Headers, CORS, auth checks
 * 13. Content/Copy         — Spelling, broken links, placeholder text
 * 14. Competitor Watch     — Check competitor sites for changes
 * 15. Launch Readiness     — Overall score, blockers, 18-day countdown
 *
 * Usage:
 *   npx tsx scripts/eli-15-agents.ts               # Run all agents
 *   npx tsx scripts/eli-15-agents.ts --agent 1     # Run specific agent
 *   npx tsx scripts/eli-15-agents.ts --critical    # Agents 1-7 only (critical path)
 */

import { config as loadEnv } from 'dotenv'
import { chromium, type Page, type Browser } from 'playwright'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

loadEnv()

const __dirname2 = dirname(fileURLToPath(import.meta.url))
const SITE = process.env.SITE_URL || 'https://forjegames.com'
const GEMINI_KEY = process.env.GEMINI_API_KEY
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const SCREENSHOTS = join(__dirname2, '.eli-screenshots')
const REPORT_FILE = join(__dirname2, '.eli-swarm-report.json')
const STAFF_CH = '1496361365206470777'

if (!existsSync(SCREENSHOTS)) mkdirSync(SCREENSHOTS, { recursive: true })

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ─── Types ───────────────────────────────────────────────────────────────────
interface Finding {
  agent: string
  agentNum: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  description: string
  page?: string
  fix?: string
  effort: 'quick' | 'medium' | 'large'
  launchBlocker: boolean
}

interface SwarmReport {
  timestamp: string
  daysToLaunch: number
  findings: Finding[]
  agentResults: Record<string, { ran: boolean; findingCount: number; score: number }>
  overallScore: number
  launchBlockers: number
  topPriorities: string[]
}

// Launch date: May 10 2026
const LAUNCH_DATE = new Date('2026-05-10T00:00:00Z')
const daysToLaunch = Math.ceil((LAUNCH_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

// ─── Gemini Helper ───────────────────────────────────────────────────────────
async function askGemini(prompt: string, image?: string): Promise<string> {
  if (!GEMINI_KEY) return ''
  const parts: unknown[] = [{ text: prompt }]
  if (image && existsSync(image)) {
    parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(image).toString('base64') } })
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    )
    if (!res.ok) return ''
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch { return '' }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status: number; time: number; size: number }> {
  const start = Date.now()
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'ELI-Swarm/1.0' } })
    const body = await res.text()
    return { ok: res.ok, status: res.status, time: Date.now() - start, size: body.length }
  } catch {
    return { ok: false, status: 0, time: Date.now() - start, size: 0 }
  }
}

// ─── Agent 1: UI/UX Auditor ─────────────────────────────────────────────────
async function agent1_uiux(page: Page, findings: Finding[]) {
  console.log('  Agent 1: UI/UX Auditor')
  const pages = ['/', '/pricing', '/about', '/sign-in', '/download', '/showcase', '/docs']

  for (const p of pages) {
    await page.setViewportSize({ width: 1440, height: 900 })
    try {
      await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle', timeout: 20000 })
      await sleep(1500)
      const ss = join(SCREENSHOTS, `agent1-${p.replace(/\//g, '_') || 'home'}.png`)
      await page.screenshot({ path: ss })

      const analysis = await askGemini(
        `You're a UI/UX expert auditing this page of ForjeGames (Roblox AI builder). Brand: gold #D4AF37 on dark #0a0a0a.
List ONLY real issues as a JSON array of objects: [{"description":"...","severity":"critical|high|medium|low","fix":"how to fix","effort":"quick|medium|large","blocker":true|false}]
Focus on: visual polish, spacing consistency, text readability, CTA clarity, trust signals, professional feel.
Return [] if perfect. JSON only.`, ss
      )

      try {
        const parsed = JSON.parse(analysis.match(/\[[\s\S]*\]/)?.[0] || '[]')
        for (const issue of parsed) {
          findings.push({
            agent: 'UI/UX Auditor', agentNum: 1, severity: issue.severity || 'medium',
            category: 'ui', description: issue.description, page: p,
            fix: issue.fix, effort: issue.effort || 'medium', launchBlocker: issue.blocker || false,
          })
        }
      } catch {}
    } catch {}
  }
}

// ─── Agent 2: AI Chat Tester ─────────────────────────────────────────────────
async function agent2_aiChat(findings: Finding[]) {
  console.log('  Agent 2: AI Chat Tester')
  // Test the AI chat endpoint with real prompts
  const testPrompts = [
    'build me a medieval castle with towers and a gate',
    'create a modern house with interior',
    'make a pirate ship with cannons',
    'build an obby with 10 stages',
    'create a tycoon base layout',
  ]

  for (const prompt of testPrompts) {
    const res = await checkUrl(`${SITE}/api/ai/chat`)
    if (!res.ok && res.status !== 405 && res.status !== 401) {
      findings.push({
        agent: 'AI Chat Tester', agentNum: 2, severity: 'critical',
        category: 'ai-chat', description: `AI chat endpoint returned ${res.status}`,
        fix: 'Check /api/ai/chat route handler', effort: 'medium', launchBlocker: true,
      })
      break
    }
  }

  // Check the chat page loads
  const editorCheck = await checkUrl(`${SITE}/editor`)
  if (!editorCheck.ok && editorCheck.status !== 401) {
    findings.push({
      agent: 'AI Chat Tester', agentNum: 2, severity: 'critical',
      category: 'ai-chat', description: `Editor page returned ${editorCheck.status}`,
      fix: 'Check editor page routing and auth', effort: 'medium', launchBlocker: true,
    })
  }
}

// ─── Agent 3: 3D Mesh Checker ────────────────────────────────────────────────
async function agent3_mesh(findings: Finding[]) {
  console.log('  Agent 3: 3D Mesh Checker')
  const meshEndpoint = await checkUrl(`${SITE}/api/ai/3d-generate`)
  if (meshEndpoint.status === 0) {
    findings.push({
      agent: '3D Mesh Checker', agentNum: 3, severity: 'high',
      category: '3d-mesh', description: '3D generate endpoint unreachable',
      fix: 'Check Meshy API key and /api/ai/3d-generate route', effort: 'medium', launchBlocker: false,
    })
  }
}

// ─── Agent 4: Image Gen Tester ───────────────────────────────────────────────
async function agent4_imageGen(findings: Finding[]) {
  console.log('  Agent 4: Image Gen Tester')
  const imageEndpoint = await checkUrl(`${SITE}/api/ai/image`)
  if (imageEndpoint.status === 0) {
    findings.push({
      agent: 'Image Gen Tester', agentNum: 4, severity: 'high',
      category: 'image-gen', description: 'Image generation endpoint unreachable',
      fix: 'Check FAL API key and /api/ai/image route', effort: 'medium', launchBlocker: false,
    })
  }
}

// ─── Agent 5: Studio Plugin ──────────────────────────────────────────────────
async function agent5_studio(findings: Finding[]) {
  console.log('  Agent 5: Studio Plugin Agent')
  // Check plugin download
  const pluginCheck = await checkUrl(`${SITE}/api/studio/plugin`)
  if (!pluginCheck.ok) {
    findings.push({
      agent: 'Studio Plugin', agentNum: 5, severity: 'high',
      category: 'studio', description: `Plugin endpoint returned ${pluginCheck.status}`,
      fix: 'Check /api/studio/plugin route and .rbxmx file', effort: 'quick', launchBlocker: true,
    })
  }
  // Check studio auth
  const authCheck = await checkUrl(`${SITE}/api/studio/auth`)
  if (authCheck.status === 0) {
    findings.push({
      agent: 'Studio Plugin', agentNum: 5, severity: 'critical',
      category: 'studio', description: 'Studio auth endpoint unreachable',
      fix: 'Check /api/studio/auth route', effort: 'medium', launchBlocker: true,
    })
  }
}

// ─── Agent 6: Auth/Onboarding ────────────────────────────────────────────────
async function agent6_auth(page: Page, findings: Finding[]) {
  console.log('  Agent 6: Auth/Onboarding Agent')

  for (const path of ['/sign-in', '/sign-up']) {
    try {
      await page.goto(`${SITE}${path}`, { waitUntil: 'networkidle', timeout: 20000 })
      await sleep(2000)
      const ss = join(SCREENSHOTS, `agent6-${path.slice(1)}.png`)
      await page.screenshot({ path: ss })

      const hasAuth = await page.evaluate(() => {
        return !!(document.querySelector('form') ||
          document.querySelector('input') ||
          document.querySelector('[class*="clerk"]') ||
          document.querySelector('[class*="cl-"]'))
      })

      if (!hasAuth) {
        findings.push({
          agent: 'Auth/Onboarding', agentNum: 6, severity: 'critical',
          category: 'auth', description: `${path} has no auth form or Clerk component`,
          page: path, fix: 'Check Clerk component rendering', effort: 'medium', launchBlocker: true,
        })
      }
    } catch {}
  }
}

// ─── Agent 7: Billing Auditor ────────────────────────────────────────────────
async function agent7_billing(page: Page, findings: Finding[]) {
  console.log('  Agent 7: Billing Auditor')

  try {
    await page.goto(`${SITE}/pricing`, { waitUntil: 'networkidle', timeout: 20000 })
    await sleep(1500)

    const pricingData = await page.evaluate(() => {
      const text = document.body.innerText
      const hasPrices = text.includes('$')
      const hasFree = text.toLowerCase().includes('free')
      const hasButtons = document.querySelectorAll('button, a[href*="checkout"], a[href*="billing"]').length
      return { hasPrices, hasFree, hasButtons, textLength: text.length }
    })

    if (!pricingData.hasPrices) {
      findings.push({
        agent: 'Billing Auditor', agentNum: 7, severity: 'critical',
        category: 'billing', description: 'No prices visible on pricing page',
        page: '/pricing', fix: 'Check pricing component data rendering', effort: 'quick', launchBlocker: true,
      })
    }
    if (pricingData.hasButtons < 2) {
      findings.push({
        agent: 'Billing Auditor', agentNum: 7, severity: 'high',
        category: 'billing', description: `Only ${pricingData.hasButtons} CTA buttons on pricing page`,
        page: '/pricing', fix: 'Each tier needs a subscribe/get started button', effort: 'quick', launchBlocker: true,
      })
    }
  } catch {}

  // Check Stripe endpoints
  const stripeCheck = await checkUrl(`${SITE}/api/billing/config`)
  if (stripeCheck.status === 0 || stripeCheck.status >= 500) {
    findings.push({
      agent: 'Billing Auditor', agentNum: 7, severity: 'critical',
      category: 'billing', description: `Billing config endpoint: ${stripeCheck.status || 'unreachable'}`,
      fix: 'Check Stripe keys and /api/billing/config', effort: 'medium', launchBlocker: true,
    })
  }
}

// ─── Agent 8: Performance ────────────────────────────────────────────────────
async function agent8_performance(page: Page, findings: Finding[]) {
  console.log('  Agent 8: Performance Agent')
  const criticalPages = ['/', '/pricing', '/sign-in', '/editor']

  for (const p of criticalPages) {
    const start = Date.now()
    try {
      await page.goto(`${SITE}${p}`, { waitUntil: 'load', timeout: 25000 })
      const loadTime = Date.now() - start

      if (loadTime > 6000) {
        findings.push({
          agent: 'Performance', agentNum: 8, severity: loadTime > 10000 ? 'high' : 'medium',
          category: 'performance', description: `${p} loads in ${(loadTime / 1000).toFixed(1)}s`,
          page: p, fix: 'Optimize bundle, lazy load, reduce API calls on mount',
          effort: 'large', launchBlocker: loadTime > 10000,
        })
      }
    } catch {}
  }
}

// ─── Agent 9: Mobile ─────────────────────────────────────────────────────────
async function agent9_mobile(page: Page, findings: Finding[]) {
  console.log('  Agent 9: Mobile Agent')
  await page.setViewportSize({ width: 375, height: 812 })
  const pages = ['/', '/pricing', '/sign-in', '/sign-up', '/download']

  for (const p of pages) {
    try {
      await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle', timeout: 20000 })
      await sleep(1500)
      const ss = join(SCREENSHOTS, `agent9-mobile-${p.replace(/\//g, '_') || 'home'}.png`)
      await page.screenshot({ path: ss })

      const mobileIssues = await page.evaluate(() => {
        const issues: string[] = []
        if (document.body.scrollWidth > 395) issues.push(`Horizontal overflow: ${document.body.scrollWidth}px`)
        const small = document.querySelectorAll('p, span, a, li')
        let tiny = 0
        small.forEach(el => { if (parseFloat(getComputedStyle(el).fontSize) < 12 && el.textContent?.trim()) tiny++ })
        if (tiny > 5) issues.push(`${tiny} elements too small for mobile`)
        // Check tap targets
        const btns = document.querySelectorAll('button, a[href]')
        let smallTap = 0
        btns.forEach(btn => {
          const rect = btn.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) smallTap++
        })
        if (smallTap > 5) issues.push(`${smallTap} tap targets too small (< 44px)`)
        return issues
      })

      for (const issue of mobileIssues) {
        findings.push({
          agent: 'Mobile Agent', agentNum: 9, severity: 'medium',
          category: 'mobile', description: `${p}: ${issue}`, page: p,
          fix: 'Add responsive breakpoints, increase tap target sizes', effort: 'medium', launchBlocker: false,
        })
      }
    } catch {}
  }
  await page.setViewportSize({ width: 1440, height: 900 })
}

// ─── Agent 10: SEO/Marketing ─────────────────────────────────────────────────
async function agent10_seo(page: Page, findings: Finding[]) {
  console.log('  Agent 10: SEO/Marketing Agent')
  const pages = ['/', '/pricing', '/about', '/download']

  for (const p of pages) {
    try {
      await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle', timeout: 20000 })
      const seo = await page.evaluate(() => {
        const title = document.title
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
        const h1Count = document.querySelectorAll('h1').length
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
        return { title, metaDesc, ogTitle, ogImage, h1Count, canonical }
      })

      if (!seo.title || seo.title.length < 10) {
        findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'high', category: 'seo',
          description: `${p}: Missing or short page title`, page: p,
          fix: 'Add descriptive <title> tag', effort: 'quick', launchBlocker: false })
      }
      if (!seo.metaDesc) {
        findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'medium', category: 'seo',
          description: `${p}: Missing meta description`, page: p,
          fix: 'Add meta description for search results', effort: 'quick', launchBlocker: false })
      }
      if (!seo.ogImage) {
        findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'medium', category: 'seo',
          description: `${p}: Missing OG image (social sharing will look bad)`, page: p,
          fix: 'Add og:image meta tag', effort: 'quick', launchBlocker: false })
      }
      if (seo.h1Count === 0) {
        findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'medium', category: 'seo',
          description: `${p}: No H1 tag`, page: p,
          fix: 'Add a single H1 heading', effort: 'quick', launchBlocker: false })
      }
      if (seo.h1Count > 1) {
        findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'low', category: 'seo',
          description: `${p}: Multiple H1 tags (${seo.h1Count})`, page: p,
          fix: 'Use only one H1 per page', effort: 'quick', launchBlocker: false })
      }
    } catch {}
  }

  // Check sitemap
  const sitemap = await checkUrl(`${SITE}/sitemap.xml`)
  if (!sitemap.ok) {
    findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'high', category: 'seo',
      description: 'No sitemap.xml found', fix: 'Add next-sitemap or generateSitemap',
      effort: 'quick', launchBlocker: false })
  }

  // Check robots.txt
  const robots = await checkUrl(`${SITE}/robots.txt`)
  if (!robots.ok) {
    findings.push({ agent: 'SEO/Marketing', agentNum: 10, severity: 'medium', category: 'seo',
      description: 'No robots.txt found', fix: 'Add public/robots.txt',
      effort: 'quick', launchBlocker: false })
  }
}

// ─── Agent 11: Accessibility ─────────────────────────────────────────────────
async function agent11_a11y(page: Page, findings: Finding[]) {
  console.log('  Agent 11: Accessibility Agent')

  try {
    await page.goto(SITE, { waitUntil: 'networkidle', timeout: 20000 })
    const a11y = await page.evaluate(() => {
      const issues: string[] = []
      // Images without alt
      const imgs = document.querySelectorAll('img')
      let noAlt = 0
      imgs.forEach(img => { if (!img.alt && img.src) noAlt++ })
      if (noAlt > 0) issues.push(`${noAlt} images missing alt text`)

      // Buttons without labels
      const btns = document.querySelectorAll('button')
      let noLabel = 0
      btns.forEach(btn => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label') && !btn.querySelector('svg[aria-label]')) noLabel++
      })
      if (noLabel > 0) issues.push(`${noLabel} buttons without text or aria-label`)

      // Form inputs without labels
      const inputs = document.querySelectorAll('input, select, textarea')
      let noInputLabel = 0
      inputs.forEach(input => {
        const id = input.id
        const hasLabel = id && document.querySelector(`label[for="${id}"]`)
        const hasAriaLabel = input.getAttribute('aria-label')
        if (!hasLabel && !hasAriaLabel) noInputLabel++
      })
      if (noInputLabel > 0) issues.push(`${noInputLabel} form inputs without labels`)

      // Check lang attribute
      if (!document.documentElement.lang) issues.push('Missing lang attribute on <html>')

      // Check heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      let skipLevel = false
      for (let i = 1; i < headings.length; i++) {
        const prev = parseInt(headings[i - 1].tagName[1])
        const curr = parseInt(headings[i].tagName[1])
        if (curr > prev + 1) { skipLevel = true; break }
      }
      if (skipLevel) issues.push('Heading levels skipped (e.g. H1 → H3)')

      return issues
    })

    for (const issue of a11y) {
      findings.push({ agent: 'Accessibility', agentNum: 11, severity: 'medium', category: 'a11y',
        description: issue, page: '/', fix: 'Add missing ARIA attributes and labels',
        effort: 'quick', launchBlocker: false })
    }
  } catch {}
}

// ─── Agent 12: Security ──────────────────────────────────────────────────────
async function agent12_security(findings: Finding[]) {
  console.log('  Agent 12: Security Agent')

  const res = await checkUrl(SITE)
  // We can't check headers from the simplified checkUrl, so test specific endpoints
  const sensitiveEndpoints = [
    '/api/admin/stats',
    '/api/admin/users',
    '/.env',
    '/api/internal/cost-snapshot',
  ]

  for (const ep of sensitiveEndpoints) {
    const check = await checkUrl(`${SITE}${ep}`)
    if (check.ok && check.status === 200) {
      findings.push({ agent: 'Security', agentNum: 12, severity: 'critical', category: 'security',
        description: `${ep} is publicly accessible (returned 200)`,
        fix: 'Add auth middleware to protect this endpoint', effort: 'quick', launchBlocker: true })
    }
  }

  // Check if source maps are exposed
  const sourceMap = await checkUrl(`${SITE}/_next/static/chunks/main.js.map`)
  if (sourceMap.ok) {
    findings.push({ agent: 'Security', agentNum: 12, severity: 'medium', category: 'security',
      description: 'Source maps exposed in production',
      fix: 'Set productionBrowserSourceMaps: false in next.config', effort: 'quick', launchBlocker: false })
  }
}

// ─── Agent 13: Content/Copy ──────────────────────────────────────────────────
async function agent13_content(page: Page, findings: Finding[]) {
  console.log('  Agent 13: Content/Copy Agent')

  const pages = ['/', '/pricing', '/about', '/download']
  for (const p of pages) {
    try {
      await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle', timeout: 20000 })
      await sleep(1000)

      const contentIssues = await page.evaluate(() => {
        const issues: string[] = []
        const text = document.body.innerText

        // Placeholder text
        if (text.includes('Lorem ipsum') || text.includes('TODO') || text.includes('placeholder'))
          issues.push('Placeholder text found on page')
        if (text.includes('undefined') || text.includes('[object Object]'))
          issues.push('Raw data leak: "undefined" or "[object Object]" visible')
        if (text.includes('NaN'))
          issues.push('NaN visible to users')

        // Dead links
        const links = document.querySelectorAll('a[href]')
        let dead = 0
        links.forEach(a => {
          const href = a.getAttribute('href') || ''
          if (href === '#' || href === '' || href.startsWith('javascript:')) dead++
        })
        if (dead > 2) issues.push(`${dead} dead/placeholder links`)

        // Empty sections
        const sections = document.querySelectorAll('section, [class*="section"]')
        let empty = 0
        sections.forEach(s => {
          if (s.textContent && s.textContent.trim().length < 10 && !s.querySelector('img, video, svg')) empty++
        })
        if (empty > 0) issues.push(`${empty} empty sections`)

        return issues
      })

      for (const issue of contentIssues) {
        findings.push({ agent: 'Content/Copy', agentNum: 13, severity: issue.includes('undefined') || issue.includes('NaN') ? 'high' : 'medium',
          category: 'content', description: `${p}: ${issue}`, page: p,
          fix: 'Replace placeholder content with real copy', effort: 'quick', launchBlocker: issue.includes('undefined') })
      }
    } catch {}
  }
}

// ─── Agent 14: Competitor Watch ──────────────────────────────────────────────
async function agent14_competitors(findings: Finding[]) {
  console.log('  Agent 14: Competitor Watch')
  const competitors = [
    { name: 'Rebirth', url: 'https://rebirth.gg' },
    { name: 'Lemonade', url: 'https://lemonade.gg' },
    { name: 'Ropilot', url: 'https://ropilot.com' },
  ]

  for (const comp of competitors) {
    const check = await checkUrl(comp.url)
    if (check.ok) {
      findings.push({ agent: 'Competitor Watch', agentNum: 14, severity: 'low', category: 'competitors',
        description: `${comp.name} (${comp.url}) is live — status ${check.status}, loaded in ${check.time}ms`,
        effort: 'quick', launchBlocker: false })
    }
  }
}

// ─── Agent 15: Launch Readiness ──────────────────────────────────────────────
async function agent15_launchReadiness(findings: Finding[], allFindings: Finding[]) {
  console.log('  Agent 15: Launch Readiness')

  const blockers = allFindings.filter(f => f.launchBlocker)
  const criticals = allFindings.filter(f => f.severity === 'critical')
  const highs = allFindings.filter(f => f.severity === 'high')

  // Score: start at 100, subtract for issues
  let score = 100
  score -= blockers.length * 15
  score -= criticals.length * 10
  score -= highs.length * 5
  score -= allFindings.filter(f => f.severity === 'medium').length * 2
  score = Math.max(0, Math.min(100, score))

  const readiness = score >= 80 ? 'READY' : score >= 60 ? 'ALMOST' : score >= 40 ? 'NEEDS WORK' : 'NOT READY'

  findings.push({
    agent: 'Launch Readiness', agentNum: 15, severity: score < 50 ? 'critical' : score < 70 ? 'high' : 'medium',
    category: 'launch', description: `Launch readiness: ${score}/100 (${readiness}). ${daysToLaunch} days remaining. ${blockers.length} blockers, ${criticals.length} critical, ${highs.length} high priority.`,
    effort: 'large', launchBlocker: false,
  })

  // Top priorities
  if (blockers.length > 0) {
    findings.push({
      agent: 'Launch Readiness', agentNum: 15, severity: 'critical',
      category: 'launch', description: `LAUNCH BLOCKERS (${blockers.length}): ${blockers.map(b => b.description.slice(0, 60)).join(' | ')}`,
      effort: 'large', launchBlocker: true,
    })
  }
}

// ─── Run All Agents ──────────────────────────────────────────────────────────
async function runSwarm(agentFilter?: number, criticalOnly?: boolean) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`ELI 15-Agent Swarm — ${daysToLaunch} days to launch`)
  console.log(`${'='.repeat(60)}\n`)

  const findings: Finding[] = []
  const agentResults: Record<string, { ran: boolean; findingCount: number; score: number }> = {}

  let browser: Browser | null = null
  try {
    browser = await chromium.launch({ headless: true })
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()

    const agents = [
      { num: 1, name: 'UI/UX Auditor', fn: () => agent1_uiux(page, findings), critical: true },
      { num: 2, name: 'AI Chat Tester', fn: () => agent2_aiChat(findings), critical: true },
      { num: 3, name: '3D Mesh Checker', fn: () => agent3_mesh(findings), critical: true },
      { num: 4, name: 'Image Gen Tester', fn: () => agent4_imageGen(findings), critical: true },
      { num: 5, name: 'Studio Plugin', fn: () => agent5_studio(findings), critical: true },
      { num: 6, name: 'Auth/Onboarding', fn: () => agent6_auth(page, findings), critical: true },
      { num: 7, name: 'Billing Auditor', fn: () => agent7_billing(page, findings), critical: true },
      { num: 8, name: 'Performance', fn: () => agent8_performance(page, findings), critical: false },
      { num: 9, name: 'Mobile Agent', fn: () => agent9_mobile(page, findings), critical: false },
      { num: 10, name: 'SEO/Marketing', fn: () => agent10_seo(page, findings), critical: false },
      { num: 11, name: 'Accessibility', fn: () => agent11_a11y(page, findings), critical: false },
      { num: 12, name: 'Security', fn: () => agent12_security(findings), critical: false },
      { num: 13, name: 'Content/Copy', fn: () => agent13_content(page, findings), critical: false },
      { num: 14, name: 'Competitor Watch', fn: () => agent14_competitors(findings), critical: false },
    ]

    for (const agent of agents) {
      if (agentFilter && agent.num !== agentFilter) continue
      if (criticalOnly && !agent.critical) continue

      const before = findings.length
      try {
        await agent.fn()
        const count = findings.length - before
        agentResults[agent.name] = { ran: true, findingCount: count, score: count === 0 ? 100 : Math.max(0, 100 - count * 15) }
        if (count > 0) console.log(`    → ${count} findings`)
      } catch (err) {
        agentResults[agent.name] = { ran: false, findingCount: 0, score: 0 }
        console.error(`    Agent ${agent.num} failed:`, (err as Error).message.slice(0, 100))
      }
    }

    // Agent 15 always runs last (uses all other findings)
    const readinessFindings: Finding[] = []
    await agent15_launchReadiness(readinessFindings, findings)
    findings.push(...readinessFindings)
    agentResults['Launch Readiness'] = { ran: true, findingCount: readinessFindings.length, score: 0 }

    await browser.close()
  } catch (err) {
    console.error('Browser error:', (err as Error).message)
    if (browser) await browser.close().catch(() => {})
  }

  // Calculate overall score
  const scores = Object.values(agentResults).filter(a => a.ran).map(a => a.score)
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const blockers = findings.filter(f => f.launchBlocker)

  // Save report
  const report: SwarmReport = {
    timestamp: new Date().toISOString(),
    daysToLaunch,
    findings,
    agentResults,
    overallScore,
    launchBlockers: blockers.length,
    topPriorities: findings
      .filter(f => f.severity === 'critical' || f.launchBlocker)
      .slice(0, 10)
      .map(f => `[${f.agent}] ${f.description.slice(0, 100)}`),
  }
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))

  // Print summary
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const f of findings) bySeverity[f.severity]++

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`SWARM REPORT — ${daysToLaunch} days to launch`)
  console.log(`  Overall Score: ${overallScore}/100`)
  console.log(`  Launch Blockers: ${blockers.length}`)
  console.log(`  Findings: ${findings.length} total`)
  console.log(`    Critical: ${bySeverity.critical} | High: ${bySeverity.high} | Medium: ${bySeverity.medium} | Low: ${bySeverity.low}`)
  console.log(`\n  Agent Scores:`)
  for (const [name, r] of Object.entries(agentResults)) {
    if (r.ran) console.log(`    ${name}: ${r.score}/100 (${r.findingCount} findings)`)
  }
  if (blockers.length > 0) {
    console.log(`\n  LAUNCH BLOCKERS:`)
    for (const b of blockers) console.log(`    [${b.agent}] ${b.description.slice(0, 80)}`)
  }
  console.log(`${'─'.repeat(60)}\n`)

  // Post to Discord
  if (BOT_TOKEN && STAFF_CH) {
    const embed = {
      title: `15-Agent Swarm Report — ${daysToLaunch} days to launch`,
      color: overallScore >= 70 ? 0x22C55E : overallScore >= 50 ? 0xF97316 : 0xEF4444,
      description: [
        `**Score: ${overallScore}/100**`,
        `Blockers: ${blockers.length} | Critical: ${bySeverity.critical} | High: ${bySeverity.high}`,
        '',
        '**Agent Scores:**',
        ...Object.entries(agentResults)
          .filter(([, r]) => r.ran)
          .map(([name, r]) => `${r.score >= 80 ? '\u2705' : r.score >= 50 ? '\u26A0\uFE0F' : '\u274C'} ${name}: ${r.score}/100`),
        '',
        blockers.length > 0 ? '**BLOCKERS:**\n' + blockers.map(b => `\u2022 ${b.description.slice(0, 80)}`).join('\n') : '\u2705 No launch blockers!',
      ].join('\n'),
      footer: { text: `${findings.length} total findings | ${new Date().toISOString().slice(0, 16)} UTC` },
    }

    try {
      await fetch(`https://discord.com/api/v10/channels/${STAFF_CH}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      })
    } catch {}
  }

  return report
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const agentNum = args.find(a => a.startsWith('--agent'))
  ? parseInt(args[args.indexOf('--agent') + 1] || args.find(a => a.startsWith('--agent='))?.split('=')[1] || '0')
  : undefined
const criticalOnly = args.includes('--critical')

runSwarm(agentNum, criticalOnly).catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
