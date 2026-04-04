const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let backendProcess

// ---------------------------------------------------------------------------
// Custom URI scheme: forjegames://
// Must be called before app.whenReady() on Windows/Linux.
// On macOS it is handled via open-url event instead.
// ---------------------------------------------------------------------------
if (process.platform !== 'darwin') {
  app.setAsDefaultProtocolClient('forjegames')
}

function handleDeepLink(url) {
  if (!url || !url.startsWith('forjegames://')) return

  // forjegames://install-plugin[?userId=xxx]
  if (url.startsWith('forjegames://install-plugin')) {
    const pluginInstaller = require('./plugin-installer')
    const result = pluginInstaller.install()

    if (mainWindow) {
      // Bring app window to front
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()

      // Send install result to the renderer so it can show status UI
      mainWindow.webContents.send('plugin-install-result', result)
    }
  }
}

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

app.whenReady().then(() => {
  // macOS: register URI scheme handler here (must be before createWindow on mac)
  if (process.platform === 'darwin') {
    app.setAsDefaultProtocolClient('forjegames')
  }

  createWindow()

  // Register all IPC handlers — defined in ipc-handlers.js
  const ipcHandlers = require('./ipc-handlers')
  ipcHandlers.register(ipcMain, app, mainWindow, dialog, safeStorage)

  // macOS: URI scheme arrives via open-url event
  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleDeepLink(url)
  })

  // Windows/Linux: URI scheme arrives as a second-instance argv
  app.on('second-instance', (_event, argv) => {
    const deepLinkUrl = argv.find((arg) => arg.startsWith('forjegames://'))
    if (deepLinkUrl) handleDeepLink(deepLinkUrl)

    // Focus the existing window instead of opening a new one
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
