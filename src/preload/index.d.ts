import { ElectronAPI } from '@electron-toolkit/preload'

export interface TitlebarAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (cb: (max: boolean) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    titlebarAPI: TitlebarAPI
    api: any
  }
}
