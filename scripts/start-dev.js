#!/usr/bin/env node
/**
 * scripts/start-dev.js
 *
 * Full local development launcher.
 * Run via: npm run dev:full
 *
 * Sequence:
 *   1. Validate environment variables (warn on missing)
 *   2. Run prisma generate (idempotent — fast if already up to date)
 *   3. Start MCP servers in background (auto-restart on crash)
 *   4. Start mesh worker in background
 *   5. Start Next.js dev server (foreground)
 *   6. Print summary of everything running
 */

import { spawn, execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load .env.local into process.env (Next.js does this automatically, Node doesn't) ──
for (const envFile of ['.env.local', '.env']) {
  const envPath = resolve(ROOT, envFile)
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex < 0) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
    console.log(`${'\x1b[32m'}✓${'\x1b[0m'} Loaded ${envFile}`)
  }
}

// ── ANSI helpers ────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'
const RESET  = '\x1b[0m'

const log  = (tag, msg) => console.log(`${DIM}[${tag}]${RESET} ${msg}`)
const info = (msg) => console.log(`${CYAN}${BOLD}${msg}${RESET}`)
const ok   = (msg) => console.log(`  ${GREEN}✓${RESET} ${msg}`)
const warn = (msg) => console.log(`  ${YELLOW}⚠${RESET} ${msg}`)

// ── Step 1: Env validation ────────────────────────────────────────────────────
info('\n[1/5] Checking environment variables...')

const REQUIRED_ENV = [
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'DATABASE_URL',
]

const SOFT_REQUIRED = [
  { key: 'ANTHROPIC_API_KEY', fallback: 'AI chat will use demo mode — add key from console.anthropic.com' },
]

const OPTIONAL_ENV = [
  { key: 'STRIPE_SECRET_KEY',              fallback: 'billing features will show demo data' },
  { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', fallback: 'Stripe Elements will not render' },
  { key: 'MESHY_API_KEY',                  fallback: '3D generation will use demo mode' },
  { key: 'FAL_KEY',                        fallback: 'texture generation will use demo mode' },
  { key: 'REDIS_URL',                      fallback: 'BullMQ queues disabled — async generation unavailable', alt: 'UPSTASH_REDIS_REST_URL' },
  { key: 'ROBLOX_OPEN_CLOUD_API_KEY',      fallback: 'Roblox upload disabled' },
  { key: 'RESEND_API_KEY',                 fallback: 'email delivery disabled' },
  { key: 'SENTRY_DSN',                     fallback: 'error tracking disabled' },
  { key: 'CRON_SECRET',                    fallback: 'cron endpoints unprotected (ok in dev)' },
  { key: 'TOKEN_HASH_SECRET',              fallback: 'token hashing disabled (ok in dev)' },
]

let missingRequired = false

for (const key of REQUIRED_ENV) {
  if (process.env[key]) {
    ok(key)
  } else {
    console.log(`  ${RED}✗${RESET} ${key} ${RED}MISSING${RESET}`)
    missingRequired = true
  }
}

for (const { key, fallback } of SOFT_REQUIRED) {
  if (process.env[key]) {
    ok(key)
  } else {
    warn(`${key} not set — ${fallback}`)
  }
}

for (const { key, fallback, alt } of OPTIONAL_ENV) {
  if (process.env[key]) {
    ok(key)
  } else if (alt && process.env[alt]) {
    ok(`${key} (using ${alt})`)
  } else {
    warn(`${key} not set — ${fallback}`)
  }
}

if (missingRequired) {
  console.log(`\n${RED}${BOLD}Required env vars missing. Copy .env.example to .env.local and fill them in.${RESET}\n`)
  process.exit(1)
}

// ── Step 2: Prisma generate ───────────────────────────────────────────────────
info('\n[2/5] Running prisma generate...')

try {
  execSync('npx prisma generate', { cwd: ROOT, stdio: 'pipe' })
  ok('Prisma client up to date')
} catch (err) {
  warn(`prisma generate failed: ${err.message}`)
  warn('Continuing — client may be stale if schema changed')
}

// ── Background process registry ──────────────────────────────────────────────
const bgProcesses = []

function spawnBackground({ name, cmd, args, cwd, env = {} }) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean)
    for (const line of lines) process.stdout.write(`${DIM}[${name}]${RESET} ${line}\n`)
  })

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean)
    for (const line of lines) process.stderr.write(`${YELLOW}[${name}]${RESET} ${line}\n`)
  })

  child.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
      log(name, `exited (code=${code}) — restarting in 3s...`)
      setTimeout(() => spawnBackground({ name, cmd, args, cwd, env }), 3000)
    }
  })

  child.on('error', (err) => {
    log(name, `spawn error: ${err.message}`)
  })

  bgProcesses.push({ name, child })
  return child
}

// ── Step 3: MCP servers ───────────────────────────────────────────────────────
info('\n[3/5] Starting MCP servers...')

const mcpScript = resolve(ROOT, 'packages/mcp/start-all.js')

if (existsSync(mcpScript)) {
  spawnBackground({
    name: 'mcp',
    cmd: process.execPath, // node
    args: [mcpScript],
    cwd: ROOT,
  })
  ok('MCP servers starting (asset-alchemist :3002, city-architect :3003, terrain-forge :3004)')
} else {
  warn('packages/mcp/start-all.js not found — MCP servers not started')
}

// ── Step 4: Mesh worker ───────────────────────────────────────────────────────
info('\n[4/5] Starting mesh worker...')

const workerScript = resolve(ROOT, 'src/workers/mesh-worker.ts')
const workerScriptJs = resolve(ROOT, 'src/workers/mesh-worker.js')

const workerEntry = existsSync(workerScript) ? workerScript : (existsSync(workerScriptJs) ? workerScriptJs : null)

if (workerEntry) {
  const isTsx = workerEntry.endsWith('.ts')
  spawnBackground({
    name: 'worker',
    cmd: 'npx',
    args: isTsx ? ['tsx', workerEntry] : [process.execPath, workerEntry],
    cwd: ROOT,
    env: { WORKER_MODE: 'mesh' },
  })
  ok(`Mesh worker starting (${workerEntry.replace(ROOT, '.')})`)
} else {
  warn('Mesh worker not found at src/workers/mesh-worker.ts — skipping')
}

// ── Step 5: Next.js dev server ────────────────────────────────────────────────
info('\n[5/5] Starting Next.js dev server...')

// Wait 1.5s to let MCP servers get a head start before Next.js tries to connect
await new Promise((r) => setTimeout(r, 1500))

// Print running summary before handing off to Next.js output
console.log(`
${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
${BOLD}  ForjeGames — Dev Environment${RESET}
${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
  Next.js          →  http://localhost:3000
  Health check     →  http://localhost:3000/api/health
  asset-alchemist  →  http://localhost:3002/mcp
  city-architect   →  http://localhost:3003/mcp
  terrain-forge    →  http://localhost:3004/mcp
${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}
`)

// Graceful shutdown on Ctrl-C
function shutdown() {
  console.log('\n[start-dev] Shutting down...')
  for (const { name, child } of bgProcesses) {
    log(name, 'sending SIGTERM')
    child.kill('SIGTERM')
  }
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Hand off to Next.js — runs in foreground so its output streams naturally
const next = spawn('npx', ['next', 'dev', '--turbo'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env },
  shell: process.platform === 'win32',
})

next.on('exit', (code) => {
  console.log(`[start-dev] Next.js exited (code=${code})`)
  shutdown()
})
