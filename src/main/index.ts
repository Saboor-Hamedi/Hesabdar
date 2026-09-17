import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join, extname } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  checkLicense,
  generateHWID,
  saveLicense,
  backgroundRevocationCheck,
  type LicensePayload
} from './licenseManager'
import {
  signInAnonymously,
  registerDevice,
  subscribeToApproval,
  unsubscribeApproval,
  getDeviceRecord,
  SUPABASE_URL,
  SUPABASE_KEY
} from './supabaseMain'
import { setupUpdater } from './updater'

const getLanguageFilePath = (): string => join(app.getPath('userData'), 'language.json')
const getSettingsFilePath = (): string => join(app.getPath('userData'), 'settings.json')

async function getSavedLanguage(): Promise<string> {
  try {
    const data = await fs.readFile(getLanguageFilePath(), 'utf-8')
    const parsed = JSON.parse(data)
    return parsed.language || 'en'
  } catch {
    return 'en'
  }
}

async function saveLanguage(lang: string): Promise<void> {
  try {
    await fs.writeFile(getLanguageFilePath(), JSON.stringify({ language: lang }, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save language:', err)
  }
}

async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(getSettingsFilePath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function getSettingValue(key: string): Promise<any> {
  if (key === 'language') return await getSavedLanguage()
  const settings = await getAllSettings()
  return settings[key] ?? null
}

async function saveSettingValue(key: string, value: any): Promise<void> {
  if (key === 'language') {
    await saveLanguage(value)
    return
  }
  const settings = await getAllSettings()
  settings[key] = value
  await fs.writeFile(getSettingsFilePath(), JSON.stringify(settings, null, 2), 'utf-8')
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 860,
    minHeight: 600,
    center: true,
    show: false,
    frame: false,
    thickFrame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setMenuBarVisibility(false)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('titlebar:maximizeChange', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('titlebar:maximizeChange', false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Disable native menus entirely
  Menu.setApplicationMenu(null)

  // ── License System Bootstrap ──────────────────────────────────────────────
  const licenseResult = await checkLicense()
  let licenseStatus: 'valid' | 'locked' = licenseResult.valid ? 'valid' : 'locked'
  let licenseIdentity = licenseResult.valid
    ? { full_name: licenseResult.full_name!, email: licenseResult.email!, phone: licenseResult.phone! }
    : null

  // If local license is missing, check if Supabase already approved this machine
  if (licenseStatus !== 'valid') {
    try {
      const hwid = generateHWID()
      const device = await getDeviceRecord(hwid)
      if (device?.status === 'approved' && device?.license_token) {
        const payload: LicensePayload = JSON.parse(
          Buffer.from(device.license_token, 'base64').toString('utf-8')
        )
        await saveLicense(payload)
        licenseStatus = 'valid'
        licenseIdentity = { full_name: payload.full_name, email: payload.email, phone: payload.phone }
      }
    } catch (err) {
      console.error('Remote check on startup error:', err)
    }
  }

  // IPC: renderer asks for license status on mount
  ipcMain.handle('license:check', async () => {
    if (licenseStatus === 'valid') {
      return { valid: true, ...licenseIdentity }
    }
    try {
      const hwid = generateHWID()
      const device = await getDeviceRecord(hwid)
      if (device?.status === 'approved' && device?.license_token) {
        const payload: LicensePayload = JSON.parse(
          Buffer.from(device.license_token, 'base64').toString('utf-8')
        )
        await saveLicense(payload)
        licenseStatus = 'valid'
        licenseIdentity = { full_name: payload.full_name, email: payload.email, phone: payload.phone }
        return { valid: true, ...licenseIdentity }
      }
    } catch {}
    return { valid: false }
  })

  // IPC: renderer gets identity after activation
  ipcMain.handle('license:get-identity', async () => {
    return licenseIdentity
  })

  // IPC: renderer sends activation request (name, email, phone)
  ipcMain.handle('license:request-activation', async (_e, params: { full_name: string; email: string; phone: string }) => {
    try {
      // Sign in anonymously to get auth.uid for RLS
      await signInAnonymously()

      const hwid = generateHWID()

      // Register device in Supabase
      const result = await registerDevice({ hwid, ...params })
      if (!result.success) return { success: false, error: result.error }

      // Subscribe to Realtime approval channel (fires when you approve in Supabase)
      subscribeToApproval(
        hwid,
        async (licenseToken: string) => {
          // Parse the signed token from the Edge Function
          try {
            const payload: LicensePayload = JSON.parse(
              Buffer.from(licenseToken, 'base64').toString('utf-8')
            )
            await saveLicense(payload)
            licenseStatus = 'valid'
            licenseIdentity = { full_name: payload.full_name, email: payload.email, phone: payload.phone }

            // Notify renderer to unlock
            BrowserWindow.getAllWindows().forEach(w =>
              w.webContents.send('license:activated', licenseIdentity)
            )

            unsubscribeApproval()
          } catch (err) {
            console.error('Failed to save license after approval:', err)
          }
        },
        (status: string) => {
          // Forward status changes to renderer (pending, rejected, etc.)
          BrowserWindow.getAllWindows().forEach(w =>
            w.webContents.send('license:status-change', status)
          )
        }
      )

      return { success: true, hwid }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Unknown error' }
    }
  })
  // ── End License Bootstrap ─────────────────────────────────────────────────

  // Language settings IPC
  ipcMain.handle('language:get', async () => {
    return await getSavedLanguage()
  })
  ipcMain.handle('language:set', async (_e, lang: string) => {
    await saveLanguage(lang)
    return lang
  })

  // Settings IPC
  ipcMain.handle('settings:get', async (_e, key: string) => {
    return await getSettingValue(key)
  })
  ipcMain.handle('settings:set', async (_e, key: string, value: any) => {
    await saveSettingValue(key, value)
    return value
  })
  ipcMain.handle('settings:pickIcon', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select App Icon',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] }]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const src = result.filePaths[0]
    const ext = extname(src).replace('.', '').toLowerCase()
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
    const buffer = await fs.readFile(src)
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
    await saveSettingValue('userIcon', dataUrl)
    BrowserWindow.getAllWindows().forEach((w) => {
      w.webContents.send('settings:iconChanged', dataUrl)
    })
    return dataUrl
  })
  ipcMain.handle('settings:resetIcon', async () => {
    await saveSettingValue('userIcon', null)
    BrowserWindow.getAllWindows().forEach((w) => {
      w.webContents.send('settings:iconChanged', null)
    })
    return null
  })

  // Database Backup & Restore IPC with Native Dialogs (Supports Excel & JSON)
  ipcMain.handle('backup:save', async (e, base64Data: string, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return { success: false, canceled: true }
    const isExcel = defaultName.endsWith('.xlsx')
    const result = await dialog.showSaveDialog(win, {
      title: 'Save Hesabdar Database Backup',
      defaultPath: defaultName,
      filters: isExcel
        ? [{ name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx'] }, { name: 'All Files', extensions: ['*'] }]
        : [{ name: 'JSON Backup (*.json)', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }]
    })
    if (result.canceled || !result.filePath) return { success: false, canceled: true }
    const buffer = Buffer.from(base64Data, 'base64')
    await fs.writeFile(result.filePath, buffer)
    return { success: true, filePath: result.filePath }
  })

  ipcMain.handle('backup:restore', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return { success: false, canceled: true }
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Hesabdar Database Backup File (Excel or JSON)',
      properties: ['openFile'],
      filters: [
        { name: 'Excel Workbook (*.xlsx)', extensions: ['xlsx', 'xls'] },
        { name: 'JSON Backup (*.json)', extensions: ['json'] },
        { name: 'All Supported', extensions: ['xlsx', 'xls', 'json'] }
      ]
    })
    if (result.canceled || !result.filePaths[0]) return { success: false, canceled: true }
    const filePath = result.filePaths[0]
    const buffer = await fs.readFile(filePath)
    const base64Content = buffer.toString('base64')
    const isExcel = filePath.toLowerCase().endsWith('.xlsx') || filePath.toLowerCase().endsWith('.xls')
    return { success: true, content: base64Content, isExcel, filePath }
  })

  // Native PDF Generation and Direct Printing IPC
  ipcMain.handle('print:toPDF', async (e, options?: { defaultFilename?: string; landscape?: boolean; pageSize?: string }) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return { success: false, canceled: true, error: 'Window not found' }
    try {
      const defaultName = options?.defaultFilename || `Customer_Statement_${Date.now()}.pdf`
      let defaultPath: string
      try {
        defaultPath = join(app.getPath('documents'), defaultName)
      } catch {
        defaultPath = defaultName
      }

      const result = await dialog.showSaveDialog(win, {
        title: 'Save Statement / Document as PDF',
        defaultPath,
        filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
      })
      if (result.canceled || !result.filePath) return { success: false, canceled: true }

      const pdfBuffer = await win.webContents.printToPDF({
        landscape: options?.landscape ?? false,
        printBackground: true,
        pageSize: (options?.pageSize as any) ?? 'A4',
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
      })

      await fs.writeFile(result.filePath, pdfBuffer)
      return { success: true, filePath: result.filePath }
    } catch (err: any) {
      console.error('printToPDF error:', err)
      return { success: false, error: err?.message || 'Failed to generate PDF' }
    }
  })

  ipcMain.handle('print:getPrinters', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return []
    try {
      return await win.webContents.getPrintersAsync()
    } catch (err) {
      console.error('getPrinters error:', err)
      return []
    }
  })

  ipcMain.handle('print:direct', async (e, options?: { deviceName?: string; silent?: boolean }) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return { success: false, failureReason: 'Window not found' }
    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: options?.silent ?? false,
          printBackground: true,
          deviceName: options?.deviceName || ''
        },
        (success, failureReason) => {
          resolve({ success, failureReason })
        }
      )
    })
  })

  // Titlebar IPC handlers
  ipcMain.on('titlebar:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.on('titlebar:maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.on('titlebar:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
  ipcMain.handle('titlebar:isMaximized', (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  setupUpdater()

  // Background revocation check — 8 seconds after startup, non-blocking
  if (licenseStatus === 'valid' && licenseIdentity) {
    setTimeout(async () => {
      const hwid = generateHWID()
      await backgroundRevocationCheck(hwid, SUPABASE_URL, SUPABASE_KEY, () => {
        licenseStatus = 'locked'
        licenseIdentity = null
        BrowserWindow.getAllWindows().forEach(w =>
          w.webContents.send('license:revoked')
        )
      })
    }, 8000)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
