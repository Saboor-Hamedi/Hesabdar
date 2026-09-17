import { ipcMain } from 'electron'
import * as products from '../modules/products'
import * as settings from '../modules/settings'

export function registerIpc() {
  // Products
  ipcMain.handle('products:search', (_e, q: string) => products.searchProducts(q))
  ipcMain.handle('products:byBarcode', (_e, code: string) =>
    products.getProductByBarcode(code)
  )
  ipcMain.handle('products:create', (_e, input: products.ProductInput) =>
    products.createProduct(input)
  )

  // Settings
  ipcMain.handle('settings:get', (_e, key: string) => settings.getSetting(key))
  ipcMain.handle('settings:set', (_e, key: string, value: string) =>
    settings.setSetting(key, value)
  )

  // User icon picker
  ipcMain.handle('settings:pickIcon', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)!
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] }],
    })
    if (result.canceled || !result.filePaths[0]) return null
    const src = result.filePaths[0]
    const dest = path.join(app.getPath('userData'), 'user-icon' + path.extname(src))
    await require('fs').copyFile(src, dest)
    return `file://${dest}`
  })
}