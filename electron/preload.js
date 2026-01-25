const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - runs before web page loads
 * Exposes safe IPC methods to renderer process
 */

contextBridge.exposeInMainWorld('electron', {
    // Get user data directory path
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Get backend port
    getBackendPort: () => ipcRenderer.invoke('get-backend-port'),

    // Export backup
    exportBackup: (data) => ipcRenderer.invoke('export-backup', data),

    // Import backup
    importBackup: () => ipcRenderer.invoke('import-backup'),

    // Check if running in Electron
    isElectron: true,

    // Platform info
    platform: process.platform,
});
