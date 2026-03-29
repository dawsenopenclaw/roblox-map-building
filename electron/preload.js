const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('forjeDesktop', {
  // Roblox Studio integration
  launchStudio: (placeFile) => ipcRenderer.invoke('launch-studio', placeFile),
  installPlugin: () => ipcRenderer.invoke('install-plugin'),
  isStudioRunning: () => ipcRenderer.invoke('is-studio-running'),

  // File system
  openFile: (filters) => ipcRenderer.invoke('open-file', filters),
  saveFile: (data, defaultName) => ipcRenderer.invoke('save-file', data, defaultName),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => process.platform,

  // API key management
  setApiKey: (service, key) => ipcRenderer.invoke('set-api-key', service, key),
  getApiKey: (service) => ipcRenderer.invoke('get-api-key', service),
})
