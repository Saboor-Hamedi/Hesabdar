import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join, extname } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  checkLicense,
  generateHWID,
  saveLicense,
  deleteLicense,
  backgroundRevocationCheck,
  type LicensePayload
} from './licenseManager'
import {
  signInAnonymously,
  registerDevice,
  subscribeToApproval,
  subscribeToDeviceLifecycle,
  getDeviceRecord,
  getAllDevices,
  approveDeviceByAdmin,
  revokeDeviceByAdmin,
  deleteDeviceByAdmin,
  subscribeToAllDevices,
  SUPABASE_URL,
  SUPABASE_KEY
} from './supabaseMain'
import { setupUpdater } from './updater'
import { runMigrations } from './db/index'
import { getAllProducts, searchProducts, createProduct, updateProduct, deleteProduct, adjustProductStock } from './db/products'
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, adjustCustomerBalance, getCustomerPayments, recordCustomerPayment, deleteCustomerPayment } from './db/customers'
import { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier, adjustSupplierBalance } from './db/suppliers'
import { getAllSales, recordSale, deleteSale } from './db/sales'
import { getAllCatalogItems, searchCatalogItems, seedCatalogItems } from './db/catalog'

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
    icon,
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

  // ── Database Bootstrap ────────────────────────────────────────────────────
  runMigrations()
  // ─────────────────────────────────────────────────────────────────────────

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
  let isAdmin = process.env.IS_ADMIN === 'true' || process.env.VITE_IS_ADMIN === 'true'

  try {
    const hwid = generateHWID()
    let device = await getDeviceRecord(hwid)
    if (device && (device.is_admin || device.role === 'admin')) {
      isAdmin = true
    }

    if (isAdmin) {
      // Admin is permanently licensed and exempt from customer licensing checks
      licenseStatus = 'valid'
      licenseIdentity = {
        full_name: device?.full_name || 'Administrator',
        email: device?.email || 'admin@hesabdar.local',
        phone: device?.phone || ''
      }
      subscribeToAllDevices(() => {
        BrowserWindow.getAllWindows().forEach((w) => {
          w.webContents.send('admin:devices-changed')
        })
      })
    } else {
      // Customer machine check
      if (device && (device.status === 'revoked' || device.status === 'rejected' || device.is_approved === false)) {
        await deleteLicense()
        licenseStatus = 'locked'
        licenseIdentity = null
      } else if (licenseStatus !== 'valid') {
        const isDeviceApproved = device && device.status === 'approved' && device.is_approved === true && device.status !== 'revoked'
        if (isDeviceApproved && device.license_token) {
          try {
            const payload: LicensePayload = JSON.parse(
              Buffer.from(device.license_token, 'base64').toString('utf-8')
            )
            await saveLicense(payload)
            licenseStatus = 'valid'
            licenseIdentity = { full_name: payload.full_name, email: payload.email, phone: payload.phone }
          } catch {}
        }
      }

      // Continuous Realtime listener for customer device updates (instant approve & instant revoke)
      subscribeToDeviceLifecycle(hwid, {
        onApproved: async (licenseToken: string) => {
          try {
            const payload: LicensePayload = JSON.parse(
              Buffer.from(licenseToken, 'base64').toString('utf-8')
            )
            await saveLicense(payload)
            licenseStatus = 'valid'
            licenseIdentity = { full_name: payload.full_name, email: payload.email, phone: payload.phone }
            BrowserWindow.getAllWindows().forEach((w) =>
              w.webContents.send('license:activated', licenseIdentity)
            )
          } catch (err) {
            console.error('Realtime approval save error:', err)
          }
        },
        onRevoked: async () => {
          await deleteLicense()
          licenseStatus = 'locked'
          licenseIdentity = null
          BrowserWindow.getAllWindows().forEach((w) =>
            w.webContents.send('license:revoked')
          )
        },
        onStatusChange: (status: string) => {
          BrowserWindow.getAllWindows().forEach((w) =>
            w.webContents.send('license:status-change', status)
          )
        }
      })
    }
  } catch (err) {
    console.error('Remote check on startup error:', err)
  }

  // IPC: renderer asks for license status on mount
  ipcMain.handle('license:check', async () => {
    if (isAdmin) {
      return { valid: true, isAdmin: true, ...licenseIdentity }
    }

    if (licenseStatus === 'valid') {
      return { valid: true, isAdmin: false, ...licenseIdentity }
    }

    try {
      const hwid = generateHWID()
      let device = await getDeviceRecord(hwid)
      if (device && (device.is_admin || device.role === 'admin')) {
        isAdmin = true
        return { valid: true, isAdmin: true, ...licenseIdentity }
      }

      if (device && (device.status === 'revoked' || device.status === 'rejected' || device.is_approved === false)) {
        await deleteLicense()
        licenseStatus = 'locked'
        licenseIdentity = null
        return { valid: false, status: 'revoked', isAdmin: false }
      }

      if (device?.status === 'pending') {
        return { valid: false, pending: true, full_name: device.full_name, email: device.email, phone: device.phone, isAdmin: false }
      }

      if (device && device.status === 'approved' && device.is_approved === true && device.license_token) {
        const payload: LicensePayload = JSON.parse(
          Buffer.from(device.license_token, 'base64').toString('utf-8')
        )
        await saveLicense(payload)
        licenseStatus = 'valid'
        licenseIdentity = { full_name: payload.full_name, email: payload.email, phone: payload.phone }
        return { valid: true, isAdmin: false, ...licenseIdentity }
      }
    } catch {}

    return { valid: false, isAdmin: false }
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

            // Notify renderer of activation success
            BrowserWindow.getAllWindows().forEach(w =>
              w.webContents.send('license:activated', licenseIdentity)
            )
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

  // ── Admin Device Management IPC ──────────────────────────────────────────
  ipcMain.handle('admin:get-devices', async () => {
    if (!isAdmin) return []
    return await getAllDevices()
  })

  ipcMain.handle('admin:get-current-hwid', async () => {
    return generateHWID()
  })

  ipcMain.handle('admin:approve-device', async (_e, hwid: string) => {
    if (!isAdmin) return { success: false, error: 'Unauthorized' }
    const myHwid = generateHWID()
    if (hwid === myHwid) {
      return { success: false, error: 'Administrator machine does not need manual approval.' }
    }
    const target = await getDeviceRecord(hwid)
    if (target?.is_admin) {
      return { success: false, error: 'Administrator device does not need manual approval.' }
    }

    const result = await approveDeviceByAdmin(hwid)
    if (result.success) {
      BrowserWindow.getAllWindows().forEach((w) => {
        w.webContents.send('admin:devices-changed')
      })
    }
    return result
  })

  ipcMain.handle('admin:revoke-device', async (_e, hwid: string) => {
    if (!isAdmin) return { success: false, error: 'Unauthorized' }
    const myHwid = generateHWID()
    if (hwid === myHwid) {
      return { success: false, error: 'You cannot revoke the Administrator account.' }
    }
    const target = await getDeviceRecord(hwid)
    if (target?.is_admin) {
      return { success: false, error: 'Cannot revoke an administrator account.' }
    }

    const result = await revokeDeviceByAdmin(hwid)
    if (result.success) {
      BrowserWindow.getAllWindows().forEach((w) => {
        w.webContents.send('admin:devices-changed')
      })
    }
    return result
  })

  ipcMain.handle('admin:delete-device', async (_e, hwid: string) => {
    if (!isAdmin) return { success: false, error: 'Unauthorized' }
    const myHwid = generateHWID()
    if (hwid === myHwid) {
      return { success: false, error: 'You cannot delete the Administrator account.' }
    }
    const target = await getDeviceRecord(hwid)
    if (target?.is_admin) {
      return { success: false, error: 'Cannot delete an administrator device.' }
    }

    const result = await deleteDeviceByAdmin(hwid)
    if (result.success) {
      BrowserWindow.getAllWindows().forEach((w) => {
        w.webContents.send('admin:devices-changed')
      })
    }
    return result
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

  // ── Products IPC ──────────────────────────────────────────────────────────
  ipcMain.handle('products:getAll', () => getAllProducts())
  ipcMain.handle('products:search', (_e, query: string) => searchProducts(query))
  ipcMain.handle('products:create', (_e, input) => createProduct(input))
  ipcMain.handle('products:update', (_e, id: number, updates) => updateProduct(id, updates))
  ipcMain.handle('products:delete', (_e, id: number) => deleteProduct(id))
  ipcMain.handle('products:adjustStock', (_e, id: number, delta: number) => adjustProductStock(id, delta))

  // ── Customers IPC ─────────────────────────────────────────────────────────
  ipcMain.handle('customers:getAll', () => getAllCustomers())
  ipcMain.handle('customers:create', (_e, input) => createCustomer(input))
  ipcMain.handle('customers:update', (_e, id: number, updates) => updateCustomer(id, updates))
  ipcMain.handle('customers:delete', (_e, id: number) => deleteCustomer(id))
  ipcMain.handle('customers:adjustBalance', (_e, id: number, delta: number) => adjustCustomerBalance(id, delta))
  ipcMain.handle('customers:getPayments', (_e, customerId?: number) => getCustomerPayments(customerId))
  ipcMain.handle('customers:recordPayment', (_e, customerId: number, amount: number, note?: string) => recordCustomerPayment(customerId, amount, note))
  ipcMain.handle('customers:deletePayment', (_e, paymentId: number) => deleteCustomerPayment(paymentId))

  // ── Suppliers IPC ─────────────────────────────────────────────────────────
  ipcMain.handle('suppliers:getAll', () => getAllSuppliers())
  ipcMain.handle('suppliers:create', (_e, input) => createSupplier(input))
  ipcMain.handle('suppliers:update', (_e, id: number, updates) => updateSupplier(id, updates))
  ipcMain.handle('suppliers:delete', (_e, id: number) => deleteSupplier(id))
  ipcMain.handle('suppliers:adjustBalance', (_e, id: number, delta: number) => adjustSupplierBalance(id, delta))

  // ── Sales IPC ─────────────────────────────────────────────────────────────
  ipcMain.handle('sales:getAll', () => getAllSales())
  ipcMain.handle('sales:record', (_e, saleData) => recordSale(saleData))
  ipcMain.handle('sales:delete', (_e, id: number, restoreStock?: boolean) => deleteSale(id, restoreStock ?? true))

  // ── Catalog IPC ───────────────────────────────────────────────────────────
  ipcMain.handle('catalog:getAll', () => getAllCatalogItems())
  ipcMain.handle('catalog:search', (_e, query: string) => searchCatalogItems(query))
  ipcMain.handle('catalog:seed', (_e, items) => seedCatalogItems(items))

  // ── Database Bulk Operations & Migration IPC ─────────────────────────────
  ipcMain.handle('db:getAllData', () => {
    return {
      products: getAllProducts(),
      customers: getAllCustomers(),
      suppliers: getAllSuppliers(),
      sales: getAllSales(),
      customerPayments: getCustomerPayments(),
    }
  })

  ipcMain.handle('db:migrate', (_e, dump: {
    products: any[]
    customers: any[]
    suppliers: any[]
    sales: any[]
    customerPayments: any[]
  }) => {
    const { getDb } = require('./db/index') as typeof import('./db/index')
    const db = getDb()

    try {
      const migrate = db.transaction(() => {
        const productCount = (db.prepare('SELECT COUNT(*) as cnt FROM products').get() as { cnt: number }).cnt
        if (productCount > 0) return { migrated: false, reason: 'DB already has data' }

        // Products
        const insertProduct = db.prepare(`
          INSERT OR IGNORE INTO products (barcode, name_fa, name_ps, name_en, unit, cost_price, sell_price, stock_qty, reorder_level, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const p of dump.products || []) {
          insertProduct.run(
            p.barcode || null,
            p.name_fa,
            p.name_ps || null,
            p.name_en || null,
            p.unit || 'pcs',
            p.cost_price || 0,
            p.sell_price || 0,
            p.stock_qty || 0,
            p.reorder_level || 5,
            1,
            p.created_at || new Date().toISOString()
          )
        }

        // Customers
        const insertCustomer = db.prepare(`
          INSERT OR IGNORE INTO customers (name, phone, address, balance, created_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const c of dump.customers || []) {
          insertCustomer.run(c.name, c.phone || null, c.address || null, c.balance || 0, c.created_at || new Date().toISOString())
        }

        // Suppliers
        const insertSupplier = db.prepare(`
          INSERT OR IGNORE INTO suppliers (name, company, phone, balance, created_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const s of dump.suppliers || []) {
          insertSupplier.run(s.name, s.company || null, s.phone || null, s.balance || 0, s.created_at || new Date().toISOString())
        }

        // Customer Payments
        const insertPayment = db.prepare(`
          INSERT OR IGNORE INTO customer_payments (customer_id, amount, note, created_at)
          VALUES (?, ?, ?, ?)
        `)
        for (const cp of dump.customerPayments || []) {
          insertPayment.run(cp.customer_id, cp.amount || 0, cp.note || null, cp.created_at || new Date().toISOString())
        }

        // Sales & Sale Items
        const insertSale = db.prepare(`
          INSERT OR IGNORE INTO sales (id, invoice_no, customer_id, user_id, subtotal, discount, total, paid, due, payment_mode, created_at)
          VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        `)
        const insertItem = db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, qty, unit_price, cost_price, line_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        for (const s of dump.sales || []) {
          const res = insertSale.run(
            s.id || null,
            s.invoice_no,
            s.customer_id || null,
            s.subtotal || 0,
            s.discount || 0,
            s.total || 0,
            s.paid || 0,
            s.due || 0,
            s.payment_mode || 'cash',
            s.created_at || new Date().toISOString()
          )
          const saleId = s.id || res.lastInsertRowid
          for (const item of s.items || []) {
            insertItem.run(saleId, item.product_id, item.qty, item.unit_price, item.cost_price || 0, item.line_total)
          }
        }

        return { migrated: true }
      })

      return migrate()
    } catch (err: any) {
      console.error('[db:migrate] error:', err)
      return { migrated: false, reason: err?.message }
    }
  })
  // ── End DB IPC ────────────────────────────────────────────────────────────

  createWindow()
  setupUpdater()

  // Periodic background revocation check for customer machines (initial check at 4s, recurring every 25s)
  if (!isAdmin) {
    const runCustomerRevocationCheck = async () => {
      const hwid = generateHWID()
      await backgroundRevocationCheck(hwid, SUPABASE_URL, SUPABASE_KEY, () => {
        licenseStatus = 'locked'
        licenseIdentity = null
        BrowserWindow.getAllWindows().forEach((w) =>
          w.webContents.send('license:revoked')
        )
      })
    }

    setTimeout(runCustomerRevocationCheck, 4000)
    setInterval(runCustomerRevocationCheck, 25000)
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
