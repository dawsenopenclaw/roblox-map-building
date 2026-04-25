#!/usr/bin/env node
/**
 * Add Gemini API keys to .env file.
 *
 * Usage:
 *   node scripts/add-gemini-keys.js KEY1 KEY2 KEY3 ...
 *
 * Or paste keys one per line:
 *   node scripts/add-gemini-keys.js < keys.txt
 *
 * This appends/updates the GEMINI_API_KEYS line in .env
 * with a comma-separated list of all keys.
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const ENV_PATH = path.join(__dirname, '..', '.env')

async function main() {
  let newKeys = process.argv.slice(2).filter(k => k.startsWith('AIza'))

  // If no args, read from stdin
  if (newKeys.length === 0) {
    const rl = readline.createInterface({ input: process.stdin })
    for await (const line of rl) {
      const key = line.trim()
      if (key.startsWith('AIza')) newKeys.push(key)
    }
  }

  if (newKeys.length === 0) {
    console.log('Usage: node scripts/add-gemini-keys.js KEY1 KEY2 KEY3 ...')
    console.log('Keys must start with "AIza"')
    process.exit(1)
  }

  // Read existing .env
  let env = fs.readFileSync(ENV_PATH, 'utf-8')

  // Get existing keys from GEMINI_API_KEYS or GEMINI_API_KEY
  const existingMulti = env.match(/^GEMINI_API_KEYS=(.*)$/m)?.[1] || ''
  const existingSingle = env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1] || ''

  const allKeys = new Set([
    ...existingMulti.split(',').map(k => k.trim()).filter(Boolean),
    ...(existingSingle ? [existingSingle.trim()] : []),
    ...newKeys,
  ])

  const keyList = Array.from(allKeys).join(',')

  // Update or add GEMINI_API_KEYS
  if (env.includes('GEMINI_API_KEYS=')) {
    env = env.replace(/^GEMINI_API_KEYS=.*$/m, `GEMINI_API_KEYS=${keyList}`)
  } else {
    // Add after GEMINI_API_KEY line
    env = env.replace(/^(GEMINI_API_KEY=.*)$/m, `$1\nGEMINI_API_KEYS=${keyList}`)
  }

  fs.writeFileSync(ENV_PATH, env)
  console.log(`✓ ${allKeys.size} Gemini keys saved to .env (${newKeys.length} new)`)
  console.log(`  Keys: ${Array.from(allKeys).map(k => '...' + k.slice(-4)).join(', ')}`)
}

main().catch(console.error)
