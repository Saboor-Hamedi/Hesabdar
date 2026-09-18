-- Catalog Items Table for Pre-configured Afghan Store Commodities ------------

CREATE TABLE IF NOT EXISTS catalog_items (
  id              TEXT PRIMARY KEY,
  barcode         TEXT,
  name_fa         TEXT NOT NULL,
  name_ps         TEXT,
  name_en         TEXT,
  unit            TEXT NOT NULL,
  category        TEXT NOT NULL,
  suggested_cost  REAL NOT NULL DEFAULT 0,
  suggested_price REAL NOT NULL DEFAULT 0,
  default_stock   REAL NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_barcode ON catalog_items(barcode);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON catalog_items(category);
