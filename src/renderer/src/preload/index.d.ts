import { ElectronAPI } from '@electron-toolkit/preload'

export interface TitlebarAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (cb: (max: boolean) => void) => () => void
}

export interface AppAPI {
  language: {
    get: () => Promise<string>
    set: (lang: string) => Promise<string>
  }
  settings: {
    get: (key: string) => Promise<any>
    set: (key: string, val: any) => Promise<any>
    pickIcon: () => Promise<string | null>
    resetIcon: () => Promise<null>
    onIconChange: (cb: (iconUrl: string | null) => void) => () => void
  }
  backup?: {
    save: (data: string, defaultName: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
    restore: () => Promise<{ success: boolean; canceled?: boolean; content?: string; isExcel?: boolean; filePath?: string }>
  }
  print?: {
    toPDF: (options?: { defaultFilename?: string; landscape?: boolean; pageSize?: string }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>
    getPrinters: () => Promise<Array<{ name: string; displayName: string; isDefault: boolean; status: number }>>
    direct: (options?: { deviceName?: string; silent?: boolean }) => Promise<{ success: boolean; failureReason?: string }>
  }
  license?: {
    check: () => Promise<any>
    requestActivation: (params: { full_name: string; email: string; phone: string }) => Promise<any>
    getIdentity: () => Promise<any>
    onActivated: (cb: (identity: { full_name: string; email: string; phone: string }) => void) => () => void
    onStatusChange: (cb: (status: string) => void) => () => void
    onRevoked: (cb: () => void) => () => void
  }
  update?: {
    getVersion: () => Promise<string>
    check: () => Promise<{ success: boolean; updateInfo?: any; error?: string }>
    download: () => Promise<{ success: boolean; error?: string }>
    install: () => void
    onStatusChange: (cb: (status: any, data?: any) => void) => () => void
    onProgress: (cb: (progress: any) => void) => () => void
  }
  products?: any
}

declare global {
  interface Window {
    electron: ElectronAPI
    titlebarAPI: TitlebarAPI
    api: AppAPI
  }
}