CREATE TABLE IF NOT EXISTS product_labels (
  label_id TEXT PRIMARY KEY,
  label_name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  uid TEXT DEFAULT '',
  product_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_label_relations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES product_labels(label_id) ON DELETE CASCADE,
  UNIQUE(product_id, label_id)
);

INSERT OR IGNORE INTO product_labels (label_id, label_name) VALUES ('__NONE__', '');
