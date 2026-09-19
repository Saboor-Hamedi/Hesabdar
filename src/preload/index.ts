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
  },
  license: {
    check: () => ipcRenderer.invoke('license:check'),
    requestActivation: (params: { full_name: string; email: string; phone: string }) =>
      ipcRenderer.invoke('license:request-activation', params),
    getIdentity: () => ipcRenderer.invoke('license:get-identity'),
    onActivated: (cb: (identity: { full_name: string; email: string; phone: string }) => void) => {
      const handler = (_e: unknown, identity: any) => cb(identity)
      ipcRenderer.on('license:activated', handler)
      return () => ipcRenderer.off('license:activated', handler)
    },
    onStatusChange: (cb: (status: string) => void) => {
      const handler = (_e: unknown, status: string) => cb(status)
      ipcRenderer.on('license:status-change', handler)
      return () => ipcRenderer.off('license:status-change', handler)
    },
    onRevoked: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on('license:revoked', handler)
      return () => ipcRenderer.off('license:revoked', handler)
    }
  },
  update: {
    getVersion: () => ipcRenderer.invoke('update:get-version'),
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onStatusChange: (cb: (status: string, data?: any) => void) => {
      const handler = (_e: unknown, status: string, data?: any) => cb(status, data)
      ipcRenderer.on('update:status', handler)
      return () => ipcRenderer.off('update:status', handler)
    },
    onProgress: (cb: (progress: any) => void) => {
      const handler = (_e: unknown, progress: any) => cb(progress)
      ipcRenderer.on('update:progress', handler)
      return () => ipcRenderer.off('update:progress', handler)
    }
  },
  admin: {
    getDevices: () => ipcRenderer.invoke('admin:get-devices'),
    getCurrentHwid: () => ipcRenderer.invoke('admin:get-current-hwid'),
    approveDevice: (hwid: string) => ipcRenderer.invoke('admin:approve-device', hwid),
    revokeDevice: (hwid: string) => ipcRenderer.invoke('admin:revoke-device', hwid),
    deleteDevice: (hwid: string) => ipcRenderer.invoke('admin:delete-device', hwid),
    onDevicesChanged: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on('admin:devices-changed', handler)
      return () => ipcRenderer.off('admin:devices-changed', handler)
    }
  },
  catalog: {
    getAll: (): Promise<any[]> => ipcRenderer.invoke('catalog:getAll'),
    seed: (items: any[]): Promise<{ seeded: number }> => ipcRenderer.invoke('catalog:seed', items),
    search: (query: string): Promise<any[]> => ipcRenderer.invoke('catalog:search', query)
  },
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    search: (query: string) => ipcRenderer.invoke('products:search', query),
    create: (input: any) => ipcRenderer.invoke('products:create', input),
    update: (id: number, updates: any) => ipcRenderer.invoke('products:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('products:delete', id),
    adjustStock: (id: number, delta: number) => ipcRenderer.invoke('products:adjustStock', id, delta)
  },
  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    create: (input: any) => ipcRenderer.invoke('customers:create', input),
    update: (id: number, updates: any) => ipcRenderer.invoke('customers:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id),
    adjustBalance: (id: number, delta: number) => ipcRenderer.invoke('customers:adjustBalance', id, delta),
    getPayments: (customerId?: number) => ipcRenderer.invoke('customers:getPayments', customerId),
    recordPayment: (customerId: number, amount: number, note?: string) =>
      ipcRenderer.invoke('customers:recordPayment', customerId, amount, note),
    deletePayment: (paymentId: number) => ipcRenderer.invoke('customers:deletePayment', paymentId)
  },
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers:getAll'),
    create: (input: any) => ipcRenderer.invoke('suppliers:create', input),
    update: (id: number, updates: any) => ipcRenderer.invoke('suppliers:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('suppliers:delete', id),
    adjustBalance: (id: number, delta: number) => ipcRenderer.invoke('suppliers:adjustBalance', id, delta)
  },
  sales: {
    getAll: () => ipcRenderer.invoke('sales:getAll'),
    record: (saleData: any) => ipcRenderer.invoke('sales:record', saleData),
    delete: (id: number, restoreStock?: boolean) => ipcRenderer.invoke('sales:delete', id, restoreStock)
  },
  db: {
    getAllData: () => ipcRenderer.invoke('db:getAllData'),
    migrate: (dump: any) => ipcRenderer.invoke('db:migrate', dump)
  },
  notes: {
    getAll: () => ipcRenderer.invoke('notes:getAll'),
    saveAll: (items: any[]) => ipcRenderer.invoke('notes:saveAll', items),
    delete: (id: string) => ipcRenderer.invoke('notes:delete', id),
    clear: () => ipcRenderer.invoke('notes:clear')
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

