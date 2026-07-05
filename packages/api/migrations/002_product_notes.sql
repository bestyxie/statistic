CREATE TABLE IF NOT EXISTS product_notes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
