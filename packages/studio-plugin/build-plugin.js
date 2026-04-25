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
 *   rojo build default.project.json --output dist/ForjeGames.rbxmx
 * This script is the no-Rojo fallback for CI/CD pipelines.
 *
 * Usage
 * ─────
 *   node packages/studio-plugin/build-plugin.js
 *   node packages/studio-plugin/build-plugin.js --out public/plugin/ForjeGames.rbxmx
 *   node packages/studio-plugin/build-plugin.js --version 1.2.0
 *
 * Installation
 * ────────────
 *   Windows: %LOCALAPPDATA%\Roblox\Plugins\ForjeGames.rbxmx
 *   macOS:   ~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxmx
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

const DEFAULT_OUT = path.join(PROJECT_ROOT, 'public', 'plugin', 'ForjeGames.rbxmx')
const OUT_PATH    = getArg('--out', DEFAULT_OUT)

// Whether to also copy to the local Roblox Plugins directory
const AUTO_INSTALL = hasFlag('--install')

// The Lua files that make up the plugin.
// Plugin.lua is the root Script entry point; the rest are ModuleScripts.
// ModuleScripts are children of the Script (not siblings in a Folder)
// so `script:FindFirstChild("Auth")` etc. resolve correctly.
// This ensures Studio auto-runs the Script when placed in the Plugins folder.
const LUA_FILES = [
  { file: 'Plugin.lua',       className: 'Script',       name: 'Plugin'       },
  { file: 'Auth.lua',         className: 'ModuleScript', name: 'Auth'         },
  { file: 'UI.lua',           className: 'ModuleScript', name: 'UI'           },
  { file: 'Sync.lua',         className: 'ModuleScript', name: 'Sync'         },
  { file: 'AssetManager.lua', className: 'ModuleScript', name: 'AssetManager' },
  { file: 'History.lua',      className: 'ModuleScript', name: 'History'      },
  { file: 'AutoUpdater.lua',  className: 'ModuleScript', name: 'AutoUpdater'  },
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
function buildModuleItem(name, source, referentId, indent) {
  return `${indent}<Item class="ModuleScript" referent="${escapeXML(referentId)}">
${indent}  <Properties>
${indent}    <string name="Name">${escapeXML(name)}</string>
${indent}    <ProtectedString name="Source"><![CDATA[${escapeCDATA(source)}]]></ProtectedString>
${indent}    <bool name="Disabled">false</bool>
${indent}  </Properties>
${indent}</Item>`
}

/**
 * Assemble the full rbxmx document.
 *
 * Structure:
 *   Script "ForjeGames"          (root — auto-runs as plugin entry point)
 *     ModuleScript "Auth"        (child of Script)
 *     ModuleScript "UI"          (child of Script)
 *     ModuleScript "Sync"        (child of Script)
 *     ModuleScript "AssetManager"
 *     ModuleScript "History"
 *
 * Studio auto-runs Scripts that are direct children of the Plugins folder.
 * By making the Script the root item (no Folder wrapper), drag-and-drop
 * installation works on any PC without extra steps.
 * ModuleScripts are children of the Script so `script:FindFirstChild("Auth")` works.
 *
 * @param {Array<{ name: string, className: string, source: string }>} scripts
 * @param {string} version
 * @returns {string}
 */
function buildRbxmx(scripts, version) {
  const mainScript = scripts.find(s => s.className === 'Script')
  const modules = scripts.filter(s => s.className === 'ModuleScript')

  const moduleItems = modules
    .map((s, i) =>
      buildModuleItem(s.name, s.source, `RBX${String(i + 2).padStart(4, '0')}`, '    ')
    )
    .join('\n')

  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <!-- ForjeGames Studio Plugin v${version} -->
  <!-- Built by build-plugin.js on ${new Date().toISOString()} -->
  <Item class="Script" referent="RBX0001">
    <Properties>
      <string name="Name">ForjeGames</string>
      <ProtectedString name="Source"><![CDATA[${escapeCDATA(mainScript.source)}]]></ProtectedString>
      <bool name="Disabled">false</bool>
      <token name="RunContext">Plugin</token>
    </Properties>
${moduleItems}
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
    const dest = path.join(pluginsDir, 'ForjeGames.rbxmx')

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
    console.log(`[build-plugin]    Windows: ${path.join(appData, 'Roblox', 'Plugins', 'ForjeGames.rbxmx')}`)
  } else if (platform === 'darwin') {
    console.log('[build-plugin]    macOS: ~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxmx')
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
