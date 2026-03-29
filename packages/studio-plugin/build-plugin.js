#!/usr/bin/env node
/**
 * build-plugin.js
 * Packages the ForjeGames Studio Plugin Lua source files into a .rbxm
 * (Roblox Model) file that Roblox Studio can load directly from its
 * Plugins directory.
 *
 * .rbxm format
 * ─────────────
 * A .rbxm file is simply a Roblox binary or XML model file.  The XML
 * variant ("rbxmx") is human-readable and straightforward to generate
 * without the Roblox engine.  Roblox Studio accepts both extensions;
 * we output <name>.rbxm but fill it with well-formed rbxmx XML.
 *
 * Rojo note
 * ─────────
 * If you have Rojo installed you can alternatively run:
 *   rojo build default.project.json --output dist/ForjeGames.rbxm
 * This script is the no-Rojo fallback that can run in CI/CD pipelines.
 *
 * Usage
 * ─────
 *   node packages/studio-plugin/build-plugin.js
 *   node packages/studio-plugin/build-plugin.js --out public/plugin/ForjeGames.rbxm
 *   node packages/studio-plugin/build-plugin.js --version 1.2.0
 */

const fs   = require('fs')
const path = require('path')

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag)
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PLUGIN_VERSION = getArg('--version', '1.0.0')
const SCRIPT_DIR     = __dirname               // packages/studio-plugin/
const PROJECT_ROOT   = path.join(SCRIPT_DIR, '..', '..') // repo root

const DEFAULT_OUT    = path.join(PROJECT_ROOT, 'public', 'plugin', 'ForjeGames.rbxm')
const OUT_PATH       = getArg('--out', DEFAULT_OUT)

// The Lua files that make up the plugin, in load order.
// Plugin.lua is the root script; the rest are ModuleScripts.
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
 * CDATA cannot contain "]]>" — we replace it with "]]]]><![CDATA[>".
 */
function escapeCDATA(str) {
  return str.replace(/]]>/g, ']]]]><![CDATA[>')
}

/**
 * Escapes standard XML special characters for use in attributes/text nodes.
 */
function escapeXML(str) {
  return str
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
 * Builds an rbxmx XML string for one Lua source file.
 *
 * @param {string} name       - Instance name visible in Studio Explorer
 * @param {string} className  - 'Script' | 'ModuleScript' | 'LocalScript'
 * @param {string} source     - Raw Lua source code
 * @param {string} referentId - Unique referent string (e.g. "RBX0001")
 * @returns {string}
 */
function buildScriptItem(name, className, source, referentId) {
  // Disabled = true so Plugin.lua acts as a plugin entry, not a plain Script
  const disabled = className === 'Script' ? 'true' : 'false'

  return `    <Item class="${escapeXML(className)}" referent="${escapeXML(referentId)}">
      <Properties>
        <string name="Name">${escapeXML(name)}</string>
        <ProtectedString name="Source"><![CDATA[${escapeCDATA(source)}]]></ProtectedString>
        <bool name="Disabled">${disabled}</bool>
      </Properties>
    </Item>`
}

/**
 * Assembles the full rbxmx document containing all plugin scripts.
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
  <!-- version:${version} -->
  <!-- Built by ForjeGames build-plugin.js on ${new Date().toISOString()} -->
  <Item class="Folder" referent="ROOT0001">
    <Properties>
      <string name="Name">ForjeGames</string>
    </Properties>
${items}
  </Item>
</roblox>`
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build() {
  console.log(`[build-plugin] ForjeGames Studio Plugin v${PLUGIN_VERSION}`)
  console.log(`[build-plugin] Source: ${SCRIPT_DIR}`)
  console.log(`[build-plugin] Output: ${OUT_PATH}`)

  const scripts = []
  const missing  = []

  for (const entry of LUA_FILES) {
    const filePath = path.join(SCRIPT_DIR, entry.file)

    if (!fs.existsSync(filePath)) {
      missing.push(entry.file)
      continue
    }

    const source = fs.readFileSync(filePath, 'utf8')
    scripts.push({
      name:      entry.name,
      className: entry.className,
      source,
    })

    console.log(`[build-plugin]   + ${entry.file} (${source.length} chars)`)
  }

  if (missing.length > 0) {
    console.error(`[build-plugin] ERROR: Missing source files: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUT_PATH)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
    console.log(`[build-plugin] Created output directory: ${outDir}`)
  }

  const xml = buildRbxmx(scripts, PLUGIN_VERSION)
  fs.writeFileSync(OUT_PATH, xml, 'utf8')

  const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1)
  console.log(`[build-plugin] Written ${sizeKb} KB -> ${OUT_PATH}`)
  console.log('[build-plugin] Done. Copy the .rbxm to Roblox Studio Plugins directory,')
  console.log('[build-plugin] or run: node electron/plugin-installer.js')
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

build()
