/**
 * updater.ts — In-app Auto Updater using electron-updater
 *
 * Handles:
 * - Checking GitHub releases for new versions
 * - Downloading update with real-time progress
 * - Quitting and installing / restarting into the new version
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { ipcMain, BrowserWindow, app } from 'electron'

export function setupUpdater(): void {
  // Do not auto-download without user consent
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Logging
  autoUpdater.logger = console

  const broadcast = (channel: string, ...args: any[]): void => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args)
      }
    })
  }

  // ── AutoUpdater Events ──────────────────────────────────────────────────────
  autoUpdater.on('checking-for-update', () => {
    broadcast('update:status', 'checking')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    broadcast('update:status', 'available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    broadcast('update:status', 'not-available', {
      version: info.version
    })
  })

  autoUpdater.on('error', (err: Error) => {
    broadcast('update:status', 'error', {
      message: err?.message || 'Unknown update error'
    })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    broadcast('update:progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    broadcast('update:status', 'downloaded', {
      version: info.version
    })
  })

  // ── IPC Handlers ────────────────────────────────────────────────────────────
  ipcMain.handle('update:get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, updateInfo: result?.updateInfo }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to check for updates' }
    }
  })

  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to download update' }
    }
  })

  ipcMain.handle('update:install', () => {
    // isSilent = true (silent background update, no wizard), isForceRunAfter = true (auto-restart app)
    autoUpdater.quitAndInstall(true, true)
  })
}
