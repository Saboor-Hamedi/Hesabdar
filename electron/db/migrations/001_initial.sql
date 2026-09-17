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