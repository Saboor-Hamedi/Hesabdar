import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const titlebarAPI = {
  minimize: () => ipcRenderer.send('titlebar:minimize'),
  maximize: () => ipcRenderer.send('titlebar:maximize'),
  close: () => ipcRenderer.send('titlebar:close'),
  isMaximized: () => ipcRenderer.invoke('titlebar:isMaximized'),
  onMaximizeChange: (cb: (max: boolean) => void) => {
    const handler = (_e: unknown, max: boolean) => cb(max)
    ipcRenderer.on('titlebar:maximizeChange', handler)
    return () => ipcRenderer.off('titlebar:maximizeChange', handler)
  }
}

// Custom APIs for renderer
const api = {
  language: {
    get: () => ipcRenderer.invoke('language:get'),
    set: (lang: string) => ipcRenderer.invoke('language:set', lang)
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    pickIcon: () => ipcRenderer.invoke('settings:pickIcon'),
    resetIcon: () => ipcRenderer.invoke('settings:resetIcon'),
    onIconChange: (cb: (iconUrl: string | null) => void) => {
      const handler = (_e: unknown, iconUrl: string | null) => cb(iconUrl)
      ipcRenderer.on('settings:iconChanged', handler)
      return () => ipcRenderer.off('settings:iconChanged', handler)
    }
  },
  backup: {
    save: (data: string, defaultName: string) => ipcRenderer.invoke('backup:save', data, defaultName),
    restore: () => ipcRenderer.invoke('backup:restore')
  },
  print: {
    toPDF: (options?: { defaultFilename?: string; landscape?: boolean; pageSize?: string }) =>
      ipcRenderer.invoke('print:toPDF', options),
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
    direct: (options?: { deviceName?: string; silent?: boolean }) =>
      ipcRenderer.invoke('print:direct', options)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('titlebarAPI', titlebarAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.titlebarAPI = titlebarAPI
  // @ts-ignore (define in dts)
  window.api = api
}

