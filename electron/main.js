const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let backendProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // macOS frameless
    backgroundColor: '#0A0E27',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icons/icon-512.svg'),
  })

  // In dev: load from Next.js dev server
  // In prod: load from built files
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000/editor')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL('https://forjegames.com/editor')
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC handlers
const studio = require('./studio')
const pluginInstaller = require('./plugin-installer')
const { dialog } = require('electron')
const fs = require('fs')

ipcMain.handle('launch-studio', async (event, placeFile) => {
  return studio.launchStudio(placeFile)
})

ipcMain.handle('install-plugin', async () => {
  return pluginInstaller.install()
})

ipcMain.handle('is-studio-running', async () => {
  return studio.isStudioRunning()
})

ipcMain.handle('open-file', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('save-file', async (event, data, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'untitled',
  })
  if (result.canceled || !result.filePath) return null
  fs.writeFileSync(result.filePath, data)
  return result.filePath
})

ipcMain.handle('get-version', () => {
  return app.getVersion()
})

// Secure API key storage using electron safeStorage
const { safeStorage } = require('electron')
const keyStorePath = path.join(app.getPath('userData'), 'api-keys.json')

function loadKeyStore() {
  try {
    if (fs.existsSync(keyStorePath)) {
      const raw = fs.readFileSync(keyStorePath)
      return JSON.parse(raw)
    }
  } catch {}
  return {}
}

function saveKeyStore(store) {
  fs.writeFileSync(keyStorePath, JSON.stringify(store))
}

ipcMain.handle('set-api-key', async (event, service, key) => {
  const store = loadKeyStore()
  if (safeStorage.isEncryptionAvailable()) {
    store[service] = safeStorage.encryptString(key).toString('base64')
  } else {
    store[service] = Buffer.from(key).toString('base64')
  }
  saveKeyStore(store)
  return true
})

ipcMain.handle('get-api-key', async (event, service) => {
  const store = loadKeyStore()
  if (!store[service]) return null
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(store[service], 'base64'))
    } else {
      return Buffer.from(store[service], 'base64').toString()
    }
  } catch {
    return null
  }
})
