#!/usr/bin/env node
/**
 * build-plugin.js
 * Packages the ForjeGames Studio Plugin Lua source files into a .rbxmx file
 * (Roblox XML model) that Roblox Studio can load as an installed plugin.
 *
 * Output file structure (rbxmx):
 *
 *   Folder "ForjeGames"          (root container)
 *     Script "Plugin"            (entry point — RunContext=Plugin, Disabled=false)
 *       ModuleScript "Auth"
 *       ModuleScript "UI"
 *       ModuleScript "Sync"
 *       ModuleScript "AssetManager"
 *       ModuleScript "History"
 *
 * The Script must be a child of the Folder so `script.Parent` resolves to the
 * Folder, and all sibling ModuleScripts are found via `script.Parent:FindFirstChild`.
 * BUT — to match the actual hierarchy used in Plugin.lua (`script.Parent`), the
 * ModuleScripts must be siblings of the Script inside the root Folder.
 *
 * Rojo note
 * ─────────
 * If you have Rojo installed, run:
 *   rojo build default.project.json --output dist/ForjeGames.rbxm
 * This script is the no-Rojo fallback for CI/CD pipelines.
 *
 * Usage
 * ─────
 *   node packages/studio-plugin/build-plugin.js
 *   node packages/studio-plugin/build-plugin.js --out public/plugin/ForjeGames.rbxm
 *   node packages/studio-plugin/build-plugin.js --version 1.2.0
 *
 * Installation
 * ────────────
 *   Windows: %LOCALAPPDATA%\Roblox\Plugins\ForjeGames.rbxm
 *   macOS:   ~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxm
 *   Then restart Roblox Studio.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue
}

const hasFlag = (flag) => args.includes(flag)

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PLUGIN_VERSION = getArg('--version', '1.0.0')
const SCRIPT_DIR     = __dirname
const PROJECT_ROOT   = path.join(SCRIPT_DIR, '..', '..')

const DEFAULT_OUT = path.join(PROJECT_ROOT, 'public', 'plugin', 'ForjeGames.rbxm')
const OUT_PATH    = getArg('--out', DEFAULT_OUT)

// Whether to also copy to the local Roblox Plugins directory
const AUTO_INSTALL = hasFlag('--install')

// The Lua files that make up the plugin.
// Plugin.lua is the root Script entry point; the rest are ModuleScripts.
// All ModuleScripts are siblings of the Plugin Script inside the root Folder
// so `script.Parent:FindFirstChild("Auth")` etc. resolve correctly.
const LUA_FILES = [
  { file: 'Plugin.lua',       className: 'Script',       name: 'Plugin'       },
  { file: 'Auth.lua',         className: 'ModuleScript', name: 'Auth'         },
  { file: 'UI.lua',           className: 'ModuleScript', name: 'UI'           },
  { file: 'Sync.lua',         className: 'ModuleScript', name: 'Sync'         },
  { file: 'AssetManager.lua', className: 'ModuleScript', name: 'AssetManager' },
  { file: 'History.lua',      className: 'ModuleScript', name: 'History'      },
]

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

/**
 * Escapes characters that are invalid inside XML CDATA sections.
 * CDATA cannot contain "]]>" — we split it: ]]]]><![CDATA[>
 */
function escapeCDATA(str) {
  return str.replace(/]]>/g, ']]]]><![CDATA[>')
}

/**
 * Escapes standard XML special characters for attributes/text nodes.
 */
function escapeXML(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;')
}

// ---------------------------------------------------------------------------
// .rbxmx generation
// ---------------------------------------------------------------------------

/**
 * Build an <Item> element for a single Lua source file.
 *
 * @param {string} name       - Instance name visible in Studio Explorer
 * @param {string} className  - 'Script' | 'ModuleScript' | 'LocalScript'
 * @param {string} source     - Raw Lua source code
 * @param {string} referentId - Unique referent string (e.g. "RBX0001")
 * @param {string} [parentRef]- Parent referent (unused in flat-list XML but kept for clarity)
 * @returns {string}
 */
function buildScriptItem(name, className, source, referentId) {
  // Plugin Scripts in the Plugins folder must have Disabled=false.
  // Studio recognises them as plugin entry points via their location,
  // not via a special property — so we keep Disabled=false for all.
  const disabled = 'false'

  // RunContext property is available in newer rbxmx; older Studio ignores it.
  const runContextProp = className === 'Script'
    ? `\n        <token name="RunContext">Plugin</token>`
    : ''

  return `    <Item class="${escapeXML(className)}" referent="${escapeXML(referentId)}">
      <Properties>
        <string name="Name">${escapeXML(name)}</string>
        <ProtectedString name="Source"><![CDATA[${escapeCDATA(source)}]]></ProtectedString>
        <bool name="Disabled">${disabled}</bool>${runContextProp}
      </Properties>
    </Item>`
}

/**
 * Assemble the full rbxmx document.
 * All Scripts + ModuleScripts are children of the root Folder so that
 * `script.Parent` inside Plugin.lua resolves to the Folder, and
 * `script.Parent:FindFirstChild("Auth")` finds the Auth ModuleScript.
 *
 * @param {Array<{ name: string, className: string, source: string }>} scripts
 * @param {string} version
 * @returns {string}
 */
function buildRbxmx(scripts, version) {
  const items = scripts
    .map((s, i) =>
      buildScriptItem(s.name, s.className, s.source, `RBX${String(i + 1).padStart(4, '0')}`)
    )
    .join('\n')

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <!-- ForjeGames Studio Plugin v${version} -->
  <!-- Built by build-plugin.js on ${new Date().toISOString()} -->
  <Item class="Folder" referent="ROOT0001">
    <Properties>
      <string name="Name">ForjeGames</string>
    </Properties>
${items}
  </Item>
</roblox>`
}

// ---------------------------------------------------------------------------
// Resolve local Roblox Plugins directory for --install flag
// ---------------------------------------------------------------------------

function getLocalPluginsDir() {
  const platform = os.platform()
  if (platform === 'win32') {
    const appData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
    return path.join(appData, 'Roblox', 'Plugins')
  }
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Roblox', 'Plugins')
  }
  // Linux (Wine/Roblox Studio via Wine)
  return path.join(os.homedir(), '.wine', 'drive_c', 'users', os.userInfo().username,
    'AppData', 'Local', 'Roblox', 'Plugins')
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build() {
  console.log(`[build-plugin] ForjeGames Studio Plugin v${PLUGIN_VERSION}`)
  console.log(`[build-plugin] Source : ${SCRIPT_DIR}`)
  console.log(`[build-plugin] Output : ${OUT_PATH}`)

  // ── Read source files ──────────────────────────────────────────────────────
  const scripts = []
  const missing  = []

  for (const entry of LUA_FILES) {
    const filePath = path.join(SCRIPT_DIR, entry.file)

    if (!fs.existsSync(filePath)) {
      missing.push(entry.file)
      continue
    }

    const source = fs.readFileSync(filePath, 'utf8')
    scripts.push({ name: entry.name, className: entry.className, source })
    console.log(`[build-plugin]   + ${entry.file} (${source.length.toLocaleString()} chars)`)
  }

  if (missing.length > 0) {
    console.error(`[build-plugin] ERROR: Missing source files: ${missing.join(', ')}`)
    process.exit(1)
  }

  // ── Ensure output directory exists ────────────────────────────────────────
  const outDir = path.dirname(OUT_PATH)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
    console.log(`[build-plugin] Created output dir: ${outDir}`)
  }

  // ── Write .rbxm (rbxmx XML) ───────────────────────────────────────────────
  const xml = buildRbxmx(scripts, PLUGIN_VERSION)
  fs.writeFileSync(OUT_PATH, xml, 'utf8')

  const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1)
  console.log(`[build-plugin] Written ${sizeKb} KB -> ${OUT_PATH}`)

  // ── Optional: copy to local Roblox Plugins dir ────────────────────────────
  if (AUTO_INSTALL) {
    const pluginsDir = getLocalPluginsDir()
    const dest = path.join(pluginsDir, 'ForjeGames.rbxm')

    if (!fs.existsSync(pluginsDir)) {
      console.warn(`[build-plugin] Plugins directory not found: ${pluginsDir}`)
      console.warn('[build-plugin] Skipping auto-install — copy manually.')
    } else {
      fs.copyFileSync(OUT_PATH, dest)
      console.log(`[build-plugin] Installed -> ${dest}`)
    }
  }

  // ── Installation instructions ─────────────────────────────────────────────
  console.log('')
  console.log('[build-plugin] ── INSTALLATION ──────────────────────────────────')
  console.log('[build-plugin] 1. Close Roblox Studio if it is open.')
  console.log('[build-plugin] 2. Copy the .rbxm file to your Plugins folder:')
  console.log('')

  const platform = os.platform()
  if (platform === 'win32') {
    const appData = process.env.LOCALAPPDATA || '%LOCALAPPDATA%'
    console.log(`[build-plugin]    Windows: ${path.join(appData, 'Roblox', 'Plugins', 'ForjeGames.rbxm')}`)
  } else if (platform === 'darwin') {
    console.log('[build-plugin]    macOS: ~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxm')
  }

  console.log('')
  console.log('[build-plugin] 3. Reopen Roblox Studio.')
  console.log('[build-plugin] 4. Click Plugins → ForjeGames in the Studio toolbar.')
  console.log('[build-plugin] 5. Enter your 6-char code from forjegames.com/settings/studio.')
  console.log('[build-plugin] ────────────────────────────────────────────────────')
  console.log('[build-plugin] Or run with --install to copy automatically:')
  console.log('[build-plugin]    node packages/studio-plugin/build-plugin.js --install')
  console.log('[build-plugin] Done.')
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

build()
