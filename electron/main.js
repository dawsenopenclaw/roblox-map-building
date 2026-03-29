const { app, BrowserWindow, ipcMain, shell, dialog, safeStorage } = require('electron')
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

app.whenReady().then(() => {
  createWindow()

  // Register all IPC handlers — defined in ipc-handlers.js
  const ipcHandlers = require('./ipc-handlers')
  ipcHandlers.register(ipcMain, app, mainWindow, dialog, safeStorage)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
