const { exec, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

// Known Roblox Studio executable paths by platform
const STUDIO_PATHS = {
  win32: [
    path.join(process.env.LOCALAPPDATA || '', 'Roblox', 'Versions'),
    'C:\\Program Files (x86)\\Roblox\\Versions',
    'C:\\Program Files\\Roblox\\Versions',
  ],
  darwin: [
    '/Applications/RobloxStudio.app/Contents/MacOS/RobloxStudio',
    path.join(os.homedir(), 'Applications', 'RobloxStudio.app', 'Contents', 'MacOS', 'RobloxStudio'),
  ],
}

/**
 * Finds the Roblox Studio executable on the current platform.
 * Returns the full path or null if not found.
 */
function findStudioExecutable() {
  const platform = process.platform

  if (platform === 'darwin') {
    for (const p of STUDIO_PATHS.darwin) {
      if (fs.existsSync(p)) return p
    }
    return null
  }

  if (platform === 'win32') {
    for (const versionDir of STUDIO_PATHS.win32) {
      if (!fs.existsSync(versionDir)) continue
      try {
        const versions = fs.readdirSync(versionDir)
        for (const version of versions.sort().reverse()) {
          const exe = path.join(versionDir, version, 'RobloxStudioBeta.exe')
          if (fs.existsSync(exe)) return exe
        }
      } catch {}
    }
    return null
  }

  return null
}

/**
 * Returns true if Roblox Studio is installed.
 */
function isStudioInstalled() {
  return findStudioExecutable() !== null
}

/**
 * Launches Roblox Studio, optionally opening a specific .rbxl file.
 * @param {string|null} placeFile - Absolute path to .rbxl file, or null to just open Studio.
 * @returns {{ success: boolean, error?: string }}
 */
function launchStudio(placeFile) {
  const exe = findStudioExecutable()
  if (!exe) {
    return { success: false, error: 'Roblox Studio not found. Please install it from roblox.com.' }
  }

  try {
    const args = placeFile ? [placeFile] : []
    const child = spawn(exe, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })
    child.unref()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Detects whether Roblox Studio is currently running.
 * @returns {Promise<boolean>}
 */
function isStudioRunning() {
  return new Promise((resolve) => {
    const platform = process.platform

    if (platform === 'win32') {
      exec('tasklist /FI "IMAGENAME eq RobloxStudioBeta.exe" /NH', (err, stdout) => {
        resolve(!err && stdout.toLowerCase().includes('robloxstudiobeta'))
      })
    } else if (platform === 'darwin') {
      exec('pgrep -x "RobloxStudio"', (err, stdout) => {
        resolve(!err && stdout.trim().length > 0)
      })
    } else {
      resolve(false)
    }
  })
}

/**
 * Watches a .rbxl file for changes and calls the callback when modified.
 * Returns an fs.FSWatcher — call .close() to stop watching.
 * @param {string} filePath
 * @param {() => void} onChange
 */
function watchStudioFile(filePath, onChange) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return fs.watch(filePath, { persistent: false }, (eventType) => {
    if (eventType === 'change') onChange()
  })
}

module.exports = {
  findStudioExecutable,
  isStudioInstalled,
  launchStudio,
  isStudioRunning,
  watchStudioFile,
}
