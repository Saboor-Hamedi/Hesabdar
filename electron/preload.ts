import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('titlebarAPI', {
  minimize: () => ipcRenderer.send('titlebar:minimize'),
  maximize: () => ipcRenderer.send('titlebar:maximize'),
  close:    () => ipcRenderer.send('titlebar:close'),
  isMaximized: () => ipcRenderer.invoke('titlebar:isMaximized'),
  onMaximizeChange: (cb: (max: boolean) => void) => {
    const handler = (_e: unknown, max: boolean) => cb(max)
    ipcRenderer.on('titlebar:maximizeChange', handler)
    return () => ipcRenderer.off('titlebar:maximizeChange', handler)
  },
})