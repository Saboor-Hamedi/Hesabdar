/**
 * src/main/db/schema.ts
 *
 * All database DDL schemas and migrations embedded as code.
 * Eliminates filesystem path dependencies in packaged production builds.
 */

export const INITIAL_SCHEMA = `
-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name_fa TEXT NOT NULL UNIQUE,
  name_ps TEXT,
  name_en TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  barcode       TEXT UNIQUE,
  name_fa       TEXT NOT NULL,
  name_ps       TEXT,
  name_en       TEXT,
  category_id   INTEGER REFERENCES categories(id),
  unit          TEXT NOT NULL DEFAULT 'pcs',
  cost_price    REAL NOT NULL DEFAULT 0,
  sell_price    REAL NOT NULL DEFAULT 0,
  stock_qty     REAL NOT NULL DEFAULT 0,
  reorder_level REAL NOT NULL DEFAULT 5,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  balance    REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Customer Payments (debt settlements)
CREATE TABLE IF NOT EXISTS customer_payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount      REAL NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  company    TEXT,
  phone      TEXT,
  balance    REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no   TEXT NOT NULL UNIQUE,
  customer_id  INTEGER REFERENCES customers(id),
  user_id      INTEGER NOT NULL DEFAULT 1,
  subtotal     REAL NOT NULL DEFAULT 0,
  discount     REAL NOT NULL DEFAULT 0,
  total        REAL NOT NULL DEFAULT 0,
  paid         REAL NOT NULL DEFAULT 0,
  due          REAL NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id    INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty        REAL NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL
);

-- Stock Movements audit log
CREATE TABLE IF NOT EXISTS stock_movements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  change_qty REAL NOT NULL,
  reason     TEXT NOT NULL,
  ref_id     INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Standard Commodity Catalog
CREATE TABLE IF NOT EXISTS catalog_items (
  id              TEXT PRIMARY KEY,
  barcode         TEXT,
  name_fa         TEXT NOT NULL,
  name_ps         TEXT,
  name_en         TEXT,
  unit            TEXT NOT NULL DEFAULT 'pcs',
  category        TEXT NOT NULL DEFAULT 'General',
  suggested_cost  REAL NOT NULL DEFAULT 0,
  suggested_price REAL NOT NULL DEFAULT 0,
  default_stock   REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cust_payments_customer ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_catalog_barcode ON catalog_items(barcode);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_items(category);

-- FTS5 full-text search for products
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  name_fa, name_ps, name_en, barcode,
  content='products',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

-- Sync Triggers for FTS5
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

-- Sticky Notes & Scratchpad
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL DEFAULT 'note',
  title      TEXT,
  x          REAL NOT NULL DEFAULT 0,
  y          REAL NOT NULL DEFAULT 0,
  z          INTEGER NOT NULL DEFAULT 0,
  rotate     REAL NOT NULL DEFAULT 0,
  color      TEXT,
  text       TEXT,
  emoji      TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notes_z ON notes(z);
`

