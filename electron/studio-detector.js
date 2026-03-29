/**
 * studio-detector.js
 * Detects Roblox Studio installation, running state, and handles launching.
 *
 * Return shape for getStatus():
 *   { installed: boolean, running: boolean, version?: string, path: string }
 */

const { exec, execFile, spawn } = require('child_process')
const path = require('path')
const fs   = require('fs')
const os   = require('os')

// ---------------------------------------------------------------------------
// Platform-specific search paths
// ---------------------------------------------------------------------------

const VERSIONS_DIRS = {
  win32: [
    path.join(process.env.LOCALAPPDATA || '', 'Roblox', 'Versions'),
    'C:\\Program Files (x86)\\Roblox\\Versions',
    'C:\\Program Files\\Roblox\\Versions',
  ],
  darwin: [
    '/Applications/RobloxStudio.app',
    path.join(os.homedir(), 'Applications', 'RobloxStudio.app'),
  ],
}

// ---------------------------------------------------------------------------
// Installation detection
// ---------------------------------------------------------------------------

/**
 * Finds the newest RobloxStudioBeta.exe under the versioned install dirs.
 * Returns { exe, version } or null on Windows, app bundle path on macOS.
 *
 * @returns {{ exe: string, version: string } | null}
 */
function findStudioInstall() {
  const platform = process.platform

  // ----- macOS -----
  if (platform === 'darwin') {
    for (const appBundle of VERSIONS_DIRS.darwin) {
      if (fs.existsSync(appBundle)) {
        const exePath = path.join(
          appBundle,
          'Contents',
          'MacOS',
          'RobloxStudio'
        )
        return {
          exe:     exePath,
          version: readMacVersion(appBundle),
          bundle:  appBundle,
        }
      }
    }
    return null
  }

  // ----- Windows -----
  if (platform === 'win32') {
    for (const versionsDir of VERSIONS_DIRS.win32) {
      if (!fs.existsSync(versionsDir)) continue

      let entries
      try {
        entries = fs.readdirSync(versionsDir)
      } catch {
        continue
      }

      // Sort descending so the newest version is first
      const sorted = entries.sort().reverse()

      for (const entry of sorted) {
        const exe = path.join(versionsDir, entry, 'RobloxStudioBeta.exe')
        if (fs.existsSync(exe)) {
          return { exe, version: entry }
        }
      }
    }
    return null
  }

  return null
}

/**
 * Reads the CFBundleShortVersionString from a macOS app bundle's Info.plist.
 * Returns 'unknown' if the plist cannot be parsed.
 *
 * @param {string} appBundle - path to .app directory
 * @returns {string}
 */
function readMacVersion(appBundle) {
  try {
    const plist = fs.readFileSync(
      path.join(appBundle, 'Contents', 'Info.plist'),
      'utf8'
    )
    const match = plist.match(
      /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/
    )
    return match ? match[1] : 'unknown'
  } catch {
    return 'unknown'
  }
}

// ---------------------------------------------------------------------------
// Running state
// ---------------------------------------------------------------------------

/**
 * Checks whether Roblox Studio is currently running.
 *
 * @returns {Promise<boolean>}
 */
function isRunning() {
  return new Promise((resolve) => {
    const platform = process.platform

    if (platform === 'win32') {
      // tasklist /FI filters by image name; /NH suppresses header
      exec(
        'tasklist /FI "IMAGENAME eq RobloxStudioBeta.exe" /NH /FO CSV',
        (err, stdout) => {
          resolve(!err && stdout.toLowerCase().includes('robloxstudiobeta'))
        }
      )
      return
    }

    if (platform === 'darwin') {
      exec('pgrep -f RobloxStudio', (err, stdout) => {
        resolve(!err && stdout.trim().length > 0)
      })
      return
    }

    resolve(false)
  })
}

// ---------------------------------------------------------------------------
// Launch
// ---------------------------------------------------------------------------

/**
 * Launches Roblox Studio, optionally opening a .rbxl file.
 *
 * @param {string|null} filePath - Optional absolute path to a .rbxl file.
 * @returns {{ success: boolean, error?: string }}
 */
function launchStudio(filePath) {
  const install = findStudioInstall()

  if (!install) {
    return {
      success: false,
      error:   'Roblox Studio is not installed. Download it from roblox.com.',
    }
  }

  try {
    const platform = process.platform

    if (platform === 'win32') {
      const args  = filePath ? [filePath] : []
      const child = spawn(install.exe, args, {
        detached:    true,
        stdio:       'ignore',
        windowsHide: false,
      })
      child.unref()
      return { success: true }
    }

    if (platform === 'darwin') {
      // Use `open -a` so the .app bundle is launched properly
      const args = filePath
        ? ['-a', 'Roblox Studio', filePath]
        : ['-a', 'Roblox Studio']
      const child = spawn('open', args, { detached: true, stdio: 'ignore' })
      child.unref()
      return { success: true }
    }

    return { success: false, error: `Unsupported platform: ${platform}` }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ---------------------------------------------------------------------------
// Composite status
// ---------------------------------------------------------------------------

/**
 * Returns a full status object for the Studio installation.
 *
 * @returns {Promise<{ installed: boolean, running: boolean, version?: string, path: string }>}
 */
async function getStatus() {
  const install = findStudioInstall()
  const running = await isRunning()

  if (!install) {
    return {
      installed: false,
      running:   false,
      path:      '',
    }
  }

  return {
    installed: true,
    running,
    version:   install.version,
    path:      install.exe,
  }
}

/**
 * Synchronous installation check — use when you only need installed/path.
 *
 * @returns {{ installed: boolean, path: string, version?: string }}
 */
function checkInstalled() {
  const install = findStudioInstall()
  if (!install) return { installed: false, path: '' }
  return { installed: true, path: install.exe, version: install.version }
}

/**
 * Watches a .rbxl file and invokes a callback on changes.
 * Returns the fs.FSWatcher — call .close() to stop.
 *
 * @param {string} watchPath
 * @param {() => void} onChange
 * @returns {fs.FSWatcher}
 */
function watchFile(watchPath, onChange) {
  if (!fs.existsSync(watchPath)) {
    throw new Error(`File not found: ${watchPath}`)
  }
  return fs.watch(watchPath, { persistent: false }, (eventType) => {
    if (eventType === 'change') onChange()
  })
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  getStatus,
  checkInstalled,
  isRunning,
  launchStudio,
  watchFile,
  // expose internals for testing / advanced use
  findStudioInstall,
}
