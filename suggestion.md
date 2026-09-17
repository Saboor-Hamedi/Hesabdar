# Hesabdar — Agent Kickoff Prompt (Complete)

You are the lead engineer for the **Hesabdar** (حسابدار) project. Hesabdar is an **offline-first** desktop point-of-sale and inventory system for Afghan grocery shops. Users are shopkeepers and cashiers who primarily use **Persian/Dari** and **Pashto**, so the UI must support **RTL layout** natively.

**Tech stack**: Electron 41+ + Vite 7 + React 19 + TypeScript 5.9 + better-sqlite3 + Tailwind CSS v4 + i18next + electron-vite + electron-builder.


## 1. Project Initialization

Scaffold with electron-vite. **Do not use create-electron-app** — it pulls unnecessary deps that slow startup. Use `npm create vite@latest` → Others → Electron → React + TypeScript.

**Required dependencies**:

```bash
# Core
npm install better-sqlite3
npm install -D @types/better-sqlite3

# Tailwind v4 (NO tailwind.config.js, NO postcss.config.js needed)
npm install tailwindcss @tailwindcss/vite

# i18n
npm install i18next react-i18next

# Icons
npm install lucide-react

# Fonts (Persian subset only — 46KB vs 103KB full)
npm install @fontsource-variable/vazirmatn
```

**Vite config** (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: { entry: 'electron/main.ts' },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
})
```

**Critical**: `better-sqlite3` is a **native module**. It must be externalized from Vite/Rollup bundling and placed in `app.asar.unpacked` during packaging. Configure `electron-builder` with `extraResources` for `node_modules/better-sqlite3`.

**Font optimization**: Import only the Arabic subset of Vazirmatn to avoid pulling Latin + Latin-ext subsets:

```css
@import '@fontsource-variable/vazirmatn/wght.css';
```


## 2. Tailwind v4 Configuration (CSS-First)

In `src/renderer/src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  /* Hesabdar brand — deep green + gold, rooted in Afghan merchant culture */
  --color-primary-50:  oklch(0.97 0.02 150);
  --color-primary-500: oklch(0.55 0.15 150);
  --color-primary-900: oklch(0.25 0.08 150);

  --color-accent-500: oklch(0.75 0.12 85);   /* gold */

  /* Fonts: Persian-first */
  --font-sans: 'Vazirmatn Variable', 'Noto Naskh Arabic', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-lg: 0.75rem;
}
```

**Critical**: In Tailwind v4 the default border color changed to `currentColor`. Every `<table>` and `<div>` must explicitly set a border color (e.g. `border-gray-200`).


## 3. Custom Title Bar (30px, Full Width)

### 3.1 Main process config

```typescript
// electron/main.ts
const TITLEBAR_HEIGHT = 30

const mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  minWidth: 1024,
  minHeight: 700,
  titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
  frame: process.platform !== 'darwin' ? false : undefined,
  trafficLightPosition: process.platform === 'darwin'
    ? { x: 12, y: TITLEBAR_HEIGHT / 2 - 7 }
    : undefined,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
})
```

**Why the platform check**: `frame: false` removes macOS's native traffic lights. On macOS we keep `hiddenInset` so the traffic lights remain; on Windows/Linux we use `frame: false` and render our own controls.

### 3.2 IPC surface (preload)

```typescript
// electron/preload.ts
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
```

Main process handlers:

```typescript
ipcMain.on('titlebar:minimize', (e) =>
  BrowserWindow.fromWebContents(e.sender)?.minimize()
)
ipcMain.on('titlebar:maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('titlebar:close', (e) =>
  BrowserWindow.fromWebContents(e.sender)?.close()
)
```

### 3.3 React title bar — split into 3 components

**`src/renderer/src/components/titlebar/TitleBar.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { TitleBarIcons } from './TitleBarIcons'
import { WindowControls } from './WindowControls'

export const TITLEBAR_HEIGHT = 30

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.titlebarAPI.isMaximized().then(setIsMaximized)
    const off = window.titlebarAPI.onMaximizeChange(setIsMaximized)
    return off
  }, [])

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                 select-none border-b border-gray-200/60 bg-white/85 backdrop-blur-sm"
      style={{ height: TITLEBAR_HEIGHT, WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <TitleBarIcons />
      <WindowControls isMaximized={isMaximized} />
    </div>
  )
}
```

**`src/renderer/src/components/titlebar/TitleBarIcons.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Store } from 'lucide-react'

export function TitleBarIcons() {
  const [iconUrl, setIconUrl] = useState<string | null>(null)

  useEffect(() => {
    window.api.settings.get('userIcon').then(setIconUrl)
  }, [])

  return (
    <div
      className="flex items-center gap-2 px-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="User" className="h-4 w-4 rounded-full object-cover" />
      ) : (
        <Store className="h-4 w-4 text-primary-600" />
      )}
      <span className="text-xs font-medium text-gray-600">
        حسابدار — Hesabdar
      </span>
    </div>
  )
}
```

**`src/renderer/src/components/titlebar/WindowControls.tsx`**

```tsx
import { Minus, Square, Copy, X } from 'lucide-react'

interface Props { isMaximized: boolean }

export function WindowControls({ isMaximized }: Props) {
  const btn =
    'flex h-[30px] w-[46px] items-center justify-center text-gray-600 ' +
    'transition-colors hover:bg-gray-100 active:bg-gray-200'

  return (
    <div
      className="flex items-stretch"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button className={btn} onClick={() => window.titlebarAPI.minimize()} aria-label="Minimize">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button className={btn} onClick={() => window.titlebarAPI.maximize()} aria-label="Maximize">
        {isMaximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
      </button>
      <button
        className={btn + ' hover:!bg-red-500 hover:!text-white'}
        onClick={() => window.titlebarAPI.close()}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
```

**Layout offset**: Main content must offset for title bar:

```tsx
<div className="pt-[30px]">{/* app content */}</div>
```


## 4. SQLite Setup with FTS5

### 4.1 Connection (`electron/db/connection.ts`)

```typescript
import Database from 'better-sqlite3'
import path from 'node:path'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'hesabdar.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  return db
}
```

**Extension loading**: `better-sqlite3` ships with FTS5 compiled in and allows `loadExtension()` out of the box. If we adopt the custom Arabic tokenizer extension, load it here:

```typescript
// Only if using the C extension tokenizer
// db.loadExtension(path.join(__dirname, 'sqlite3-arabic-phonetic-fuzzy-trigram'))
```

### 4.2 Schema with FTS5

**`electron/db/migrations/001_initial.sql`**

```sql
-- Core tables ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode       TEXT UNIQUE,
  name_fa       TEXT NOT NULL,              -- Persian/Dari name
  name_ps       TEXT,                       -- Pashto name
  name_en       TEXT,                       -- English name
  category_id   INTEGER REFERENCES categories(id),
  unit          TEXT NOT NULL,              -- 'kg' | 'pcs' | 'litre' | 'pack'
  cost_price    REAL NOT NULL,
  sell_price    REAL NOT NULL,
  stock_qty     REAL NOT NULL DEFAULT 0,
  reorder_level REAL NOT NULL DEFAULT 5,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name_fa TEXT NOT NULL UNIQUE,
  name_ps TEXT,
  name_en TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT,
  balance    REAL NOT NULL DEFAULT 0,       -- positive = they owe us
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT,
  balance    REAL NOT NULL DEFAULT 0,       -- positive = we owe them
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no   TEXT NOT NULL UNIQUE,
  customer_id  INTEGER REFERENCES customers(id),
  user_id      INTEGER NOT NULL,
  subtotal     REAL NOT NULL,
  discount     REAL NOT NULL DEFAULT 0,
  total        REAL NOT NULL,
  paid         REAL NOT NULL,
  due          REAL NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id    INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty        REAL NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  change_qty REAL NOT NULL,
  reason     TEXT NOT NULL,                 -- 'sale' | 'purchase' | 'adjust' | 'return'
  ref_id     INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- FTS5 full-text search ------------------------------------------------------

CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  name_fa, name_ps, name_en, barcode,
  content='products',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

-- Keep FTS in sync with products
CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, name_fa, name_ps, name_en, barcode)
  VALUES (new.id, new.name_fa, new.name_ps, new.name_en, new.barcode);
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name_fa, name_ps, name_en, barcode)
  VALUES ('delete', old.id, old.name_fa, old.name_ps, old.name_en, old.barcode);
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name_fa, name_ps, name_en, barcode)
  VALUES ('delete', old.id, old.name_fa, old.name_ps, old.name_en, old.barcode);
  INSERT INTO products_fts(rowid, name_fa, name_ps, name_en, barcode)
  VALUES (new.id, new.name_fa, new.name_ps, new.name_en, new.barcode);
END;
```

### 4.3 Persian / Pashto normalization layer

`unicode61` alone does **not** unify Persian variants. We must normalize text **on write and on read**. This is done in TypeScript.

**`electron/db/persian.ts`**

```typescript
/**
 * Normalize Persian, Dari, and Pashto text for consistent FTS matching.
 *
 * Handles:
 *  - Arabic vs Persian letter variants:  ك→ک,  ي→ی,  ة→ه,  ؤ→و,  إ→ا
 *  - Pashto variants: ګ→گ, ړ→ر, ږ→ژ, ڼ→ن, ۍ→ی
 *  - Arabic-Indic digits ٠١٢… and Extended ۰۱۲… → ASCII 012…
 *  - Removes Arabic diacritics (tashkeel) and tatweel
 *  - Collapses whitespace
 */
export function normalizePersian(input: string): string {
  if (!input) return ''
  return input
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')   // diacritics + tatweel
    .replace(/[كکڪ]/g, 'ک')
    .replace(/[يیىېۍ]/g, 'ی')
    .replace(/[ةهۀ]/g, 'ه')
    .replace(/[ؤو]/g, 'و')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ګگ]/g, 'گ')
    .replace(/[ړر]/g, 'ر')
    .replace(/[ږژ]/g, 'ژ')
    .replace(/[ڼن]/g, 'ن')
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Build a safe FTS5 MATCH query from free user input.
 * Strips FTS operators, appends * for prefix search on the last token.
 */
export function buildFtsQuery(raw: string): string {
  const normalized = normalizePersian(raw)
  if (!normalized) return ''
  const tokens = normalized.split(' ').filter(Boolean)
  return tokens.map((t, i) =>
    i === tokens.length - 1 ? `"${t}"*` : `"${t}"`
  ).join(' ')
}
```

**Alternative — the custom Arabic tokenizer**: For maximum search quality (cross-script Latin→Persian, trigram fuzzy, exact Persian variant normalization), we can load the **`sqlite3-arabic-phonetic-fuzzy-trigram`** extension. It handles ک/ك, ی/ے/ي, diacritic-insensitive matching, and cross-script (type `alhamdu` → find `ٱلْحَمْدُ`). If adopting it:

```typescript
db.loadExtension('/path/to/sqlite3-arabic-phonetic-fuzzy-trigram')
db.exec(`CREATE VIRTUAL TABLE products_fts USING fts5(
  name_fa, name_ps, name_en, barcode,
  tokenize='arabic_phonetic_fuzzy_trigram remove_diacritics 1 generate_trigrams 1 transliterate 1'
)`)
```

**Decision**: Start with `unicode61` + TS normalization (Path B). Upgrade to the C extension later if search quality demands it.

### 4.4 Products repository

**`electron/modules/products.ts`**

```typescript
import { getDb } from '../db/connection'
import { buildFtsQuery, normalizePersian } from '../db/persian'

export interface Product {
  id: number
  barcode: string | null
  name_fa: string
  name_ps: string | null
  name_en: string | null
  category_id: number | null
  unit: string
  cost_price: number
  sell_price: number
  stock_qty: number
  reorder_level: number
  is_active: number
  created_at: string
}

export interface ProductInput {
  barcode?: string | null
  name_fa: string
  name_ps?: string | null
  name_en?: string | null
  category_id?: number | null
  unit: string
  cost_price: number
  sell_price: number
  stock_qty?: number
  reorder_level?: number
}

export function searchProducts(query: string, limit = 50): Product[] {
  const db = getDb()
  const fts = buildFtsQuery(query)

  if (!fts) {
    return db.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC LIMIT ?`
    ).all(limit) as Product[]
  }

  return db.prepare(`
    SELECT p.* FROM products_fts f
    JOIN products p ON p.id = f.rowid
    WHERE products_fts MATCH ?
      AND p.is_active = 1
    ORDER BY bm25(products_fts, 10.0, 8.0, 5.0, 20.0)
    LIMIT ?
  `).all(fts, limit) as Product[]
}

export function getProductByBarcode(barcode: string): Product | null {
  const db = getDb()
  return (db.prepare(
    `SELECT * FROM products WHERE barcode = ? AND is_active = 1`
  ).get(barcode) as Product) ?? null
}

export function createProduct(input: ProductInput): Product {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO products
      (barcode, name_fa, name_ps, name_en, category_id, unit,
       cost_price, sell_price, stock_qty, reorder_level)
    VALUES
      (@barcode, @name_fa, @name_ps, @name_en, @category_id, @unit,
       @cost_price, @sell_price, @stock_qty, @reorder_level)
  `)
  const info = stmt.run({
    barcode: input.barcode ?? null,
    name_fa: normalizePersian(input.name_fa),
    name_ps: input.name_ps ? normalizePersian(input.name_ps) : null,
    name_en: input.name_en?.toLowerCase() ?? null,
    category_id: input.category_id ?? null,
    unit: input.unit,
    cost_price: input.cost_price,
    sell_price: input.sell_price,
    stock_qty: input.stock_qty ?? 0,
    reorder_level: input.reorder_level ?? 5,
  })
  return db.prepare(`SELECT * FROM products WHERE id = ?`)
    .get(info.lastInsertRowid) as Product
}
```


## 5. IPC Layer

Register all IPC handlers in one place.

**`electron/ipc/index.ts`**

```typescript
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
    await fs.copyFile(src, dest)
    return `file://${dest}`
  })
}
```

**Preload** (`electron/preload.ts`):

```typescript
contextBridge.exposeInMainWorld('api', {
  products: {
    search:    (q: string)      => ipcRenderer.invoke('products:search', q),
    byBarcode: (code: string)   => ipcRenderer.invoke('products:byBarcode', code),
    create:    (input: unknown) => ipcRenderer.invoke('products:create', input),
  },
  settings: {
    get:      (key: string)            => ipcRenderer.invoke('settings:get', key),
    set:      (key: string, val: string) => ipcRenderer.invoke('settings:set', key, val),
    pickIcon: ()                       => ipcRenderer.invoke('settings:pickIcon'),
  },
})
```


## 6. UI Architecture

### 6.1 Folder layout

```
src/renderer/src/
├── components/
│   ├── titlebar/
│   │   ├── TitleBar.tsx
│   │   ├── TitleBarIcons.tsx
│   │   └── WindowControls.tsx
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── ActivityBar.tsx
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── DataTable.tsx
│       ├── SearchInput.tsx
│       └── Button.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── POS.tsx
│   ├── Products.tsx
│   ├── Customers.tsx
│   ├── Suppliers.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── i18n/
│   ├── index.ts
│   ├── fa.json
│   ├── ps.json
│   └── en.json
├── styles/global.css
├── App.tsx
└── main.tsx
```

### 6.2 ActivityBar — a left icon rail (DRY, config-driven)

**`src/renderer/src/components/layout/ActivityBar.tsx`**

```tsx
import { LayoutDashboard, ShoppingCart, Package, Users, Truck, BarChart3, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ActivityItem {
  id: string
  label: string
  icon: LucideIcon
}

export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos',       label: 'POS',       icon: ShoppingCart },
  { id: 'products',  label: 'Products',  icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'reports',   label: 'Reports',   icon: BarChart3 },
  { id: 'settings',  label: 'Settings',  icon: Settings },
]

interface Props {
  active: string
  onChange: (id: string) => void
}

export function ActivityBar({ active, onChange }: Props) {
  return (
    <nav className="flex w-14 flex-col items-center gap-1 border-e border-gray-200 bg-gray-50 py-2">
      {ACTIVITY_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={label}
            title={label}
            className={
              'group relative flex h-11 w-11 items-center justify-center rounded-lg ' +
              'transition-colors ' +
              (isActive
                ? 'bg-primary-500/10 text-primary-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')
            }
          >
            {isActive && (
              <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-primary-500" />
            )}
            <Icon className="h-5 w-5" />
          </button>
        )
      })}
    </nav>
  )
}
```

### 6.3 AppShell — the main layout

```tsx
import { useState, type ReactNode } from 'react'
import { ActivityBar } from './ActivityBar'
import { TitleBar, TITLEBAR_HEIGHT } from '../titlebar/TitleBar'

export function AppShell() {
  const [active, setActive] = useState('dashboard')

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      <TitleBar />
      <div
        className="flex flex-1 overflow-hidden"
        style={{ paddingTop: TITLEBAR_HEIGHT }}
      >
        <ActivityBar active={active} onChange={setActive} />
        <main className="flex-1 overflow-auto p-4">
          {/* render page based on active */}
        </main>
      </div>
    </div>
  )
}
```

### 6.4 DataTable — generic, reusable, sortable

```tsx
import { useMemo, useState, type ReactNode } from 'react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  emptyMessage?: string
}

export function DataTable<T>({ data, columns, rowKey, emptyMessage = 'No data' }: Props<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return data
    const { key, dir } = sort
    return [...data].sort((a, b) => {
      const av = (a as any)[key], bv = (b as any)[key]
      if (av === bv) return 0
      const r = av > bv ? 1 : -1
      return dir === 'asc' ? r : -r
    })
  }, [data, sort])

  const alignClass = (a?: Column<T>['align']) =>
    a === 'center' ? 'text-center' : a === 'end' ? 'text-end' : 'text-start'

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={`px-4 py-2.5 font-medium ${alignClass(c.align)} ${
                  c.sortable ? 'cursor-pointer select-none hover:text-gray-800' : ''
                }`}
                onClick={() =>
                  c.sortable &&
                  setSort((s) =>
                    s?.key === c.key
                      ? { key: String(c.key), dir: s.dir === 'asc' ? 'desc' : 'asc' }
                      : { key: String(c.key), dir: 'asc' }
                  )
                }
              >
                {c.header}
                {sort?.key === c.key && (
                  <span className="ms-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-t border-gray-100 transition-colors hover:bg-primary-50/40"
              >
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-4 py-2.5 ${alignClass(c.align)}`}>
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```


## 7. i18n — Persian, Pashto, English

**`src/renderer/src/i18n/index.ts`**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fa from './fa.json'
import ps from './ps.json'
import en from './en.json'

export const LANGUAGES = [
  { code: 'fa', name: 'فارسی / دری', dir: 'rtl' },
  { code: 'ps', name: 'پښتو',        dir: 'rtl' },
  { code: 'en', name: 'English',     dir: 'ltr' },
] as const

export type LangCode = (typeof LANGUAGES)[number]['code']

i18n.use(initReactI18next).init({
  resources: {
    fa: { translation: fa },
    ps: { translation: ps },
    en: { translation: en },
  },
  lng: 'fa',
  fallbackLng: 'fa',
  interpolation: { escapeValue: false },
})

export function applyDirection(lang: LangCode) {
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? 'rtl'
  document.documentElement.dir = dir
  document.documentElement.lang = lang
}
```

**Sample `fa.json`** (Persian/Dari):

```json
{
  "app": { "name": "حسابدار" },
  "nav": {
    "dashboard": "داشبورد",
    "pos": "صندوق فروش",
    "products": "اجناس",
    "customers": "مشتریان",
    "suppliers": "تأمین‌کنندگان",
    "reports": "گزارشات",
    "settings": "تنظیمات"
  },
  "products": {
    "title": "اجناس",
    "search": "جستجو…",
    "name": "نام",
    "barcode": "بارکد",
    "price": "قیمت",
    "stock": "موجودی",
    "empty": "هیچ محصولی یافت نشد"
  }
}
```

**Sample `ps.json`** (Pashto):

```json
{
  "app": { "name": "حسابدار" },
  "nav": {
    "dashboard": "ډشبورډ",
    "pos": "د پلور صندوق",
    "products": "توکي",
    "customers": "پیریدونکي",
    "suppliers": "عرضه کوونکي",
    "reports": "راپورونه",
    "settings": "تنظیمات"
  }
}
```

**Sample `en.json`**:

```json
{
  "app": { "name": "Hesabdar" },
  "nav": {
    "dashboard": "Dashboard",
    "pos": "Point of Sale",
    "products": "Products",
    "customers": "Customers",
    "suppliers": "Suppliers",
    "reports": "Reports",
    "settings": "Settings"
  }
}
```

Call `applyDirection(lang)` on init and whenever the user changes the language.

**RTL rule**: Always use Tailwind's logical properties — `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*` — **never** `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`. This keeps the layout correct in both LTR and RTL without conditional classes.


## 8. User Icon Customization (title bar)

**Settings table** (add to migration):

```sql
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
```

**IPC handlers**:

```typescript
// electron/modules/settings.ts
export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ' +
             'ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value)
}
```

Expose a "Change icon" button in **Settings page** that calls `window.api.settings.pickIcon()`.


## 9. Native Module Packaging (Critical)

`better-sqlite3` is a **native module** that must be compiled against **Electron's ABI**, not the system Node.js ABI. Using the wrong ABI causes `ERR_DLOPEN_FAILED` at runtime.

**Build script** (`package.json`):

```json
{
  "scripts": {
    "postinstall": "electron-builder install-app-deps",
    "rebuild:sqlite3": "electron-rebuild -f -w better-sqlite3"
  }
}
```

**electron-builder config** (`electron-builder.yml`):

```yaml
asar: true
asarUnpack:
  - node_modules/better-sqlite3/**/*
extraResources:
  - from: node_modules/better-sqlite3
    to: node_modules/better-sqlite3
```

**Verification**: After packaging, confirm `app.asar.unpacked/node_modules/better-sqlite3/build/Release/better_sqlite3.node` exists and loads inside Electron. If ABI mismatch persists, force rebuild with Electron headers:

```bash
cd node_modules/better-sqlite3
npx node-gyp rebuild --target=<electron-version> --arch=x64 \
  --dist-url=https://electronjs.org/headers --runtime=electron --release
```


## 10. Thermal Printer (Persian Receipt)

ESC/POS printers require explicit **code page selection** for Persian/Arabic text. The relevant command is `ESC t n`:

- **Page 37**: PC864 (Arabic)
- **Page 41**: PC1098 (Farsi)

```typescript
// ESC t — Select character code table
const ESC = 0x1B
const ARABIC_PAGE = 0x25  // 37 decimal — PC864 Arabic
const FARSI_PAGE  = 0x29  // 41 decimal — PC1098 Farsi

const arabicCmd = Buffer.from([ESC, 0x74, ARABIC_PAGE])
const englishCmd = Buffer.from([ESC, 0x74, 0x00])  // PC437 English
```

**Limitation**: Raw ESC/POS text mode struggles with Persian because Persian/Arabic requires **contextual shaping** and **bidi reordering**. The most reliable approach for correct Persian rendering is **raster/image mode**: render the receipt to an image first (using Vazirmatn font), then send the image to the printer.

**Decision**: Start with ESC/POS text mode + code page switching for simple receipts. For full Persian correctness, add image-mode fallback later.


## 11. Engineering Rules (Non-Negotiable)

1. **TypeScript strict mode** — `"strict": true`, no `any` in public APIs.
2. **DRY** — every repeated pattern becomes a component (`DataTable`, `Button`, `SearchInput`), every IPC channel defined once in `channels.ts`.
3. **Separation of concerns** — no SQL outside `electron/modules/*`; no IPC calls in presentational components; pages are containers.
4. **RTL-safe** — logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`).
5. **Persian/Pashto normalization at the DB boundary** — always run user text through `normalizePersian()` before insert, and `buildFtsQuery()` before any FTS search.
6. **Every IPC channel is typed** in `electron/preload.ts` and mirrored in `src/renderer/src/types/api.d.ts`.
7. **Migrations are numbered and idempotent** — `001_initial.sql`, `002_*.sql`, run at startup in order, tracked in `schema_version`.
8. **Native module ABI is verified before packaging** — fail the build if `better_sqlite3.node` doesn't match Electron's ABI.
9. **All colors explicit** — Tailwind v4 `currentColor` default means every border must have an explicit color class.
10. **Persian font subset only** — import `@fontsource-variable/vazirmatn/wght.css` which loads the Arabic subset (46KB), not the full family.


## 12. First Deliverables (Build in Order)

**Step 1 — Skeleton**
- `package.json` with postinstall rebuild script
- `electron.vite.config.ts`, `tsconfig.json`
- `electron-builder.yml` with `asarUnpack` + `extraResources` for better-sqlite3
- Folder structure

**Step 2 — Database**
- `electron/db/connection.ts`
- `electron/db/migrations/001_initial.sql`
- `electron/db/persian.ts` (normalization)

**Step 3 — Products module**
- `electron/modules/products.ts` (CRUD + FTS search)
- IPC handlers in `electron/ipc/index.ts`
- Preload surface

**Step 4 — Shell UI**
- `TitleBar.tsx` + `TitleBarIcons.tsx` + `WindowControls.tsx`
- `ActivityBar.tsx` + `AppShell.tsx`
- `global.css` with Tailwind v4 theme
- `DataTable.tsx`

**Step 5 — Products page**
- Instant Persian search
- Table with sortable columns
- Add/edit product form

Then: **POS** → **Customers/Khata** → **Purchases** → **Reports** → **Thermal receipt** → **Packaging verification**.