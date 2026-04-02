#!/usr/bin/env node
/**
 * packages/mcp/start-all.js
 *
 * Starts all three MCP servers as child processes:
 *   asset-alchemist  → http://localhost:3002/mcp
 *   city-architect   → http://localhost:3003/mcp
 *   terrain-forge    → http://localhost:3004/mcp
 *
 * Run via:  node packages/mcp/start-all.js
 *       or: npm run mcp:start  (from repo root)
 *
 * Each server is started with `tsx` (TypeScript runner) so source changes
 * are reflected without a build step during development.
 *
 * Pass --prod to run compiled JS instead of TypeScript source:
 *   node packages/mcp/start-all.js --prod
 */

import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProd = process.argv.includes('--prod')

const SERVERS = [
  {
    name: 'asset-alchemist',
    port: 3002,
    dir: resolve(__dirname, 'asset-alchemist'),
    src: 'src/index.ts',
    dist: 'dist/index.js',
  },
  {
    name: 'city-architect',
    port: 3003,
    dir: resolve(__dirname, 'city-architect'),
    src: 'src/index.ts',
    dist: 'dist/index.js',
  },
  {
    name: 'terrain-forge',
    port: 3004,
    dir: resolve(__dirname, 'terrain-forge'),
    src: 'src/index.ts',
    dist: 'dist/index.js',
  },
]

const children = []

function startServer(server) {
  const entry = isProd ? server.dist : server.src
  const cmd = isProd ? 'node' : 'npx'
  const args = isProd ? [entry] : ['tsx', entry]

  console.log(`[mcp:start] Starting ${server.name} on port ${server.port} (${isProd ? 'prod' : 'dev'})`)

  const child = spawn(cmd, args, {
    cwd: server.dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: isProd ? 'production' : 'development',
    },
  })

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${server.name}] ${data}`)
  })

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${server.name}] ${data}`)
  })

  child.on('exit', (code, signal) => {
    if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
      console.error(`[mcp:start] ${server.name} exited unexpectedly (code=${code}, signal=${signal})`)
      // Restart after 3 seconds
      setTimeout(() => startServer(server), 3_000)
    }
  })

  child.on('error', (err) => {
    console.error(`[mcp:start] Failed to start ${server.name}: ${err.message}`)
  })

  children.push(child)
  return child
}

// Start all servers
for (const server of SERVERS) {
  startServer(server)
}

console.log(`[mcp:start] All MCP servers starting...`)
console.log(`  asset-alchemist  → http://localhost:3002/mcp  (health: http://localhost:3002/health)`)
console.log(`  city-architect   → http://localhost:3003/mcp  (health: http://localhost:3003/health)`)
console.log(`  terrain-forge    → http://localhost:3004/mcp  (health: http://localhost:3004/health)`)

// Graceful shutdown
function shutdown() {
  console.log('\n[mcp:start] Shutting down all MCP servers...')
  for (const child of children) {
    child.kill('SIGTERM')
  }
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
