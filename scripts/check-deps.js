#!/usr/bin/env node
/**
 * scripts/check-deps.js
 *
 * Pre-flight dependency check. Run automatically before `npm run dev` via
 * the "predev" npm lifecycle script.
 *
 * Checks:
 *   1. Required npm packages are installed
 *   2. Prisma client is generated
 *   3. Redis is reachable (if REDIS_URL is set)
 *   4. MCP servers are reachable (if URLs are set)
 *
 * Exits 0 if all required checks pass (warnings are non-fatal).
 * Exits 1 if any required check fails.
 */

import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

// ── ANSI helpers ────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BOLD   = '\x1b[1m'
const RESET  = '\x1b[0m'

const ok   = (label) => console.log(`  ${GREEN}✓${RESET} ${label}`)
const fail = (label) => console.log(`  ${RED}✗${RESET} ${label}`)
const warn = (label) => console.log(`  ${YELLOW}⚠${RESET} ${label}`)

let hasErrors = false

function markFail(label) {
  fail(label)
  hasErrors = true
}

// ── 1. Required npm packages ─────────────────────────────────────────────────
console.log(`\n${BOLD}[check-deps] Checking npm packages...${RESET}`)

const REQUIRED_PACKAGES = [
  { name: 'next',               display: 'next' },
  { name: 'react',              display: 'react' },
  { name: '@clerk/nextjs',      display: '@clerk/nextjs' },
  { name: 'stripe',             display: 'stripe' },
  { name: '@prisma/client',     display: '@prisma/client' },
  { name: 'bullmq',             display: 'bullmq' },
  { name: 'ioredis',            display: 'ioredis' },
  { name: 'zod',                display: 'zod' },
  { name: 'resend',             display: 'resend' },
  { name: '@sentry/nextjs',     display: '@sentry/nextjs' },
]

const OPTIONAL_PACKAGES = [
  { name: '@modelcontextprotocol/sdk', display: '@modelcontextprotocol/sdk (MCP)' },
]

for (const pkg of REQUIRED_PACKAGES) {
  const pkgPath = resolve(ROOT, 'node_modules', pkg.name)
  if (existsSync(pkgPath)) {
    ok(pkg.display)
  } else {
    markFail(`${pkg.display} — run: npm install`)
  }
}

for (const pkg of OPTIONAL_PACKAGES) {
  const pkgPath = resolve(ROOT, 'node_modules', pkg.name)
  if (existsSync(pkgPath)) {
    ok(pkg.display)
  } else {
    warn(`${pkg.display} not installed (optional)`)
  }
}

// ── 2. Prisma client generated ───────────────────────────────────────────────
console.log(`\n${BOLD}[check-deps] Checking Prisma client...${RESET}`)

const prismaClientPath = resolve(ROOT, 'node_modules', '.prisma', 'client')
const prismaClientIndex = resolve(ROOT, 'node_modules', '@prisma', 'client', 'index.js')

if (existsSync(prismaClientPath) || existsSync(prismaClientIndex)) {
  ok('Prisma client generated')
} else {
  // Attempt auto-generation
  warn('Prisma client not found — running prisma generate...')
  try {
    execSync('npx prisma generate', { cwd: ROOT, stdio: 'pipe' })
    ok('Prisma client generated (just-in-time)')
  } catch {
    markFail('Prisma client generation failed — run: npx prisma generate')
  }
}

// ── 3. Redis reachability ────────────────────────────────────────────────────
console.log(`\n${BOLD}[check-deps] Checking Redis...${RESET}`)

const redisUrl = process.env.REDIS_URL
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL

if (!redisUrl && !upstashUrl) {
  warn('REDIS_URL / UPSTASH_REDIS_REST_URL not set — skipping Redis check')
} else if (upstashUrl) {
  // Upstash is HTTP-based; a real ping requires the token — just validate URL format
  warn('Upstash Redis configured — connectivity check skipped (HTTP REST API)')
} else {
  // Classic Redis — attempt a TCP connection via Node net
  const { createConnection } = await import('node:net')

  try {
    const url = new URL(redisUrl)
    const port = parseInt(url.port || '6379', 10)
    const host = url.hostname

    await new Promise((resolve, reject) => {
      const socket = createConnection({ host, port, timeout: 3000 })
      socket.on('connect', () => { socket.destroy(); resolve(true) })
      socket.on('timeout', () => { socket.destroy(); reject(new Error('timeout')) })
      socket.on('error', reject)
    })

    ok(`Redis reachable at ${host}:${port}`)
  } catch (err) {
    warn(`Redis not reachable (${err.message}) — BullMQ queues will be unavailable`)
  }
}

// ── 4. MCP server reachability ───────────────────────────────────────────────
console.log(`\n${BOLD}[check-deps] Checking MCP servers...${RESET}`)

const MCP_SERVERS = [
  { name: 'asset-alchemist', envKey: 'MCP_ASSET_ALCHEMIST_URL', defaultUrl: 'http://localhost:3002' },
  { name: 'city-architect',  envKey: 'MCP_CITY_ARCHITECT_URL',  defaultUrl: 'http://localhost:3003' },
  { name: 'terrain-forge',   envKey: 'MCP_TERRAIN_FORGE_URL',   defaultUrl: 'http://localhost:3004' },
]

for (const server of MCP_SERVERS) {
  const baseUrl = process.env[server.envKey] ?? server.defaultUrl
  const healthUrl = `${baseUrl}/health`

  // Only check if the env var is explicitly set, or if it's dev mode (default ports)
  const shouldCheck = Boolean(process.env[server.envKey]) || process.env.NODE_ENV !== 'production'

  if (!shouldCheck) {
    warn(`${server.name} — skipping (${server.envKey} not set)`)
    continue
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(healthUrl, { signal: controller.signal })
    clearTimeout(timer)

    if (res.ok) {
      ok(`${server.name} reachable at ${baseUrl}`)
    } else {
      warn(`${server.name} responded with HTTP ${res.status} — server may be misconfigured`)
    }
  } catch {
    warn(`${server.name} not running at ${baseUrl} — start with: npm run mcp:start`)
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('')
if (hasErrors) {
  console.log(`${RED}${BOLD}[check-deps] Some required checks failed. Fix the issues above before starting.${RESET}\n`)
  process.exit(1)
} else {
  console.log(`${GREEN}${BOLD}[check-deps] All required checks passed.${RESET}\n`)
  process.exit(0)
}
