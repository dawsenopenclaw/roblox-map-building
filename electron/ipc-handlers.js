/**
 * ipc-handlers.js
 * Registers all Electron IPC handlers for the ForjeGames desktop app.
 *
 * Call register(ipcMain, app) once from main.js after the app is ready.
 * Keeping handlers in one file makes them easy to test in isolation and
 * keeps main.js lean.
 */

const path           = require('path')
const fs             = require('fs')
const studioDetector = require('./studio-detector')
const pluginInstaller = require('./plugin-installer')

// ---------------------------------------------------------------------------
// Secure API-key storage (using Electron safeStorage + a JSON file)
// ---------------------------------------------------------------------------

let _keyStorePath = null

function getKeyStorePath(app) {
  if (!_keyStorePath) {
    _keyStorePath = path.join(app.getPath('userData'), 'api-keys.json')
  }
  return _keyStorePath
}

function loadKeyStore(app) {
  try {
    const p = getKeyStorePath(app)
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'))
    }
  } catch {
    // Corrupted file — start fresh
  }
  return {}
}

function saveKeyStore(app, store) {
  const p = getKeyStorePath(app)
  fs.writeFileSync(p, JSON.stringify(store, null, 2), 'utf8')
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Registers all IPC handlers.
 *
 * @param {Electron.IpcMain}       ipcMain
 * @param {Electron.App}           app
 * @param {Electron.BrowserWindow} mainWindow - needed for dialog handlers
 * @param {Electron.Dialog}        dialog
 * @param {Electron.SafeStorage}   safeStorage
 */
function register(ipcMain, app, mainWindow, dialog, safeStorage) {

  // ---- Studio: launch -------------------------------------------------------
  // Args:   filePath? (string) — optional .rbxl to open
  // Return: { success: boolean, error?: string }
  ipcMain.handle('launch-studio', async (_event, filePath) => {
    return studioDetector.launchStudio(filePath || null)
  })

  // ---- Plugin: install -------------------------------------------------------
  // Return: { installed: boolean, path: string, needsRestart: boolean, error?: string }
  ipcMain.handle('install-plugin', async () => {
    return pluginInstaller.install()
  })

  // ---- Plugin: check --------------------------------------------------------
  // Return: { installed: boolean, path: string, needsRestart: boolean, version?: string }
  ipcMain.handle('check-plugin', async () => {
    return pluginInstaller.check()
  })

  // ---- Studio: running state ------------------------------------------------
  // Return: boolean
  ipcMain.handle('is-studio-running', async () => {
    return studioDetector.isRunning()
  })

  // ---- Studio: full status --------------------------------------------------
  // Return: { installed: boolean, running: boolean, version?: string, path: string }
  ipcMain.handle('get-studio-status', async () => {
    return studioDetector.getStatus()
  })

  // ---- App: version ---------------------------------------------------------
  // Return: string (semver from package.json)
  ipcMain.handle('get-version', () => {
    return app.getVersion()
  })

  // ---- File: open dialog ----------------------------------------------------
  // Args:   filters? ({ name: string, extensions: string[] }[])
  // Return: string | null
  ipcMain.handle('open-file', async (_event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters:    filters || [{ name: 'All Files', extensions: ['*'] }],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // ---- File: save dialog ----------------------------------------------------
  // Args:   data (string | Buffer), defaultName? (string)
  // Return: string | null
  ipcMain.handle('save-file', async (_event, data, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName || 'untitled',
    })
    if (result.canceled || !result.filePath) return null
    fs.writeFileSync(result.filePath, data)
    return result.filePath
  })

  // ---- API keys: set --------------------------------------------------------
  // Args:   service (string), key (string)
  // Return: boolean
  ipcMain.handle('set-api-key', async (_event, service, key) => {
    if (!service || typeof key !== 'string') return false
    const store = loadKeyStore(app)

    try {
      store[service] = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(key).toString('base64')
        : Buffer.from(key).toString('base64')
    } catch {
      // safeStorage not available in some environments (e.g. CI)
      store[service] = Buffer.from(key).toString('base64')
    }

    saveKeyStore(app, store)
    return true
  })

  // ---- API keys: get --------------------------------------------------------
  // Args:   service (string)
  // Return: string | null
  ipcMain.handle('get-api-key', async (_event, service) => {
    if (!service) return null
    const store = loadKeyStore(app)
    if (!store[service]) return null

    try {
      return safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(Buffer.from(store[service], 'base64'))
        : Buffer.from(store[service], 'base64').toString()
    } catch {
      return null
    }
  })

  // ---- API keys: delete -----------------------------------------------------
  // Args:   service (string)
  // Return: boolean
  ipcMain.handle('delete-api-key', async (_event, service) => {
    if (!service) return false
    const store = loadKeyStore(app)
    if (!store[service]) return false
    delete store[service]
    saveKeyStore(app, store)
    return true
  })
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { register }
