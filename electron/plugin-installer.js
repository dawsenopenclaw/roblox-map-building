/**
 * plugin-installer.js
 * Installs the ForjeGames Roblox Studio plugin (.rbxm) into the
 * platform-specific Roblox Plugins directory.
 *
 * Return shape:
 *   { installed: boolean, path: string, needsRestart: boolean, error?: string }
 */

const fs   = require('fs')
const path = require('path')
const os   = require('os')

const PLUGIN_NAME    = 'ForjeGames.rbxm'
const PLUGIN_VERSION = '1.0.0' // bump this when the bundled plugin changes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the platform-specific Roblox Plugins directory path.
 * Throws if the platform is unsupported or a required env var is missing.
 */
function getPluginsDir() {
  const platform = process.platform

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA
    if (!localAppData) {
      throw new Error('LOCALAPPDATA environment variable is not set.')
    }
    return path.join(localAppData, 'Roblox', 'Plugins')
  }

  if (platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Roblox',
      'Plugins'
    )
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

/**
 * Returns the absolute path to the bundled plugin file shipped with the app.
 * Expects: <project-root>/public/plugin/ForjeGames.rbxm
 */
function getSourcePath() {
  // __dirname is electron/ — go up one level to project root
  return path.join(__dirname, '..', 'public', 'plugin', PLUGIN_NAME)
}

/**
 * Reads a version tag embedded as a comment inside the .rbxm XML.
 * Falls back to null if the file is binary or the tag is absent.
 * Format expected anywhere in the file:  <!-- version:1.2.3 -->
 */
function readEmbeddedVersion(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const match   = content.match(/<!--\s*version:([\d.]+)\s*-->/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Compares two SemVer strings.
 * Returns  1 if a > b,  -1 if a < b,  0 if equal.
 */
function compareSemVer(a, b) {
  const parse = (v) => (v || '0.0.0').split('.').map(Number)
  const [aMaj, aMin, aPat] = parse(a)
  const [bMaj, bMin, bPat] = parse(b)

  if (aMaj !== bMaj) return aMaj > bMaj ? 1 : -1
  if (aMin !== bMin) return aMin > bMin ? 1 : -1
  if (aPat !== bPat) return aPat > bPat ? 1 : -1
  return 0
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Checks whether the plugin is currently installed.
 *
 * @returns {{ installed: boolean, path: string, needsRestart: boolean }}
 */
function check() {
  try {
    const pluginsDir  = getPluginsDir()
    const destination = path.join(pluginsDir, PLUGIN_NAME)
    const installed   = fs.existsSync(destination)

    if (!installed) {
      return { installed: false, path: destination, needsRestart: false }
    }

    // Check whether the installed version is older than the bundled one
    const sourcePath     = getSourcePath()
    const installedMtime = fs.statSync(destination).mtimeMs
    const sourceMtime    = fs.existsSync(sourcePath)
      ? fs.statSync(sourcePath).mtimeMs
      : 0

    const installedVer = readEmbeddedVersion(destination)
    const sourceVer    = readEmbeddedVersion(sourcePath)

    let needsUpdate = false
    if (installedVer && sourceVer) {
      needsUpdate = compareSemVer(sourceVer, installedVer) > 0
    } else {
      // Fall back to mtime comparison when version tags are absent
      needsUpdate = sourceMtime > installedMtime
    }

    return {
      installed:    true,
      path:         destination,
      needsRestart: needsUpdate, // update available → Studio restart needed after reinstall
      version:      installedVer || 'unknown',
    }
  } catch (err) {
    return {
      installed:    false,
      path:         '',
      needsRestart: false,
      error:        err.message,
    }
  }
}

/**
 * Installs (or updates) the ForjeGames plugin into the Roblox Plugins directory.
 *
 * @returns {{ installed: boolean, path: string, needsRestart: boolean, error?: string }}
 */
function install() {
  try {
    const sourcePath = getSourcePath()

    if (!fs.existsSync(sourcePath)) {
      return {
        installed:    false,
        path:         '',
        needsRestart: false,
        error:        `Plugin source not found at: ${sourcePath}. Run the build-plugin script first.`,
      }
    }

    const pluginsDir  = getPluginsDir()
    const destination = path.join(pluginsDir, PLUGIN_NAME)

    // Create Plugins directory if missing (first-time install)
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true })
    }

    const alreadyInstalled = fs.existsSync(destination)

    // Copy (overwrites existing if updating)
    fs.copyFileSync(sourcePath, destination)

    return {
      installed:    true,
      path:         destination,
      // Studio must be restarted to load a newly installed/updated plugin
      needsRestart: true,
    }
  } catch (err) {
    // Permission denied is the most common real-world failure
    const isPermissionError = err.code === 'EACCES' || err.code === 'EPERM'
    return {
      installed:    false,
      path:         '',
      needsRestart: false,
      error:        isPermissionError
        ? `Permission denied writing to Roblox Plugins directory. Try running as administrator.`
        : err.message,
    }
  }
}

/**
 * Removes the installed plugin from the Roblox Plugins directory.
 *
 * @returns {{ success: boolean, error?: string }}
 */
function uninstall() {
  try {
    const pluginsDir  = getPluginsDir()
    const destination = path.join(pluginsDir, PLUGIN_NAME)

    if (fs.existsSync(destination)) {
      fs.unlinkSync(destination)
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  install,
  uninstall,
  check,
  getPluginsDir,
  PLUGIN_NAME,
  PLUGIN_VERSION,
}
