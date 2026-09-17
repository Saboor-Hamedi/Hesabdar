const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('titlebarAPI', {
  minimize: () => window.api.titlebarAPI.minimize(),
  maximize: () => window.api.titlebarAPI.maximize(),
  close:    () => window.api.titlebarAPI.close(),
  isMaximized: () => window.api.titlebarAPI.isMaximized(),
  onMaximizeChange: (cb) => {
    const handler = (e, max) => cb(max)
    window.api.ipcRenderer.on('titlebar:maximizeChange', handler)
    return () => window.api.ipcRenderer.off('titlebar:maximizeChange', handler)
  },
})