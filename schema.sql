DROP TABLE IF EXISTS product_visitor_relations;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS daily_product_stats;
DROP TABLE IF EXISTS daily_shop_stats;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS admin_users;

CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sku TEXT DEFAULT '',
  price TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  refreshed_at TEXT DEFAULT '',
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, sku)
);

CREATE TABLE daily_shop_stats (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  date TEXT NOT NULL,
  visitor_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(shop_id, date)
);

CREATE TABLE daily_product_stats (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  date TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  viewer_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  UNIQUE(product_id, date)
);

-- 访客主表（独立存在，不随商品删除）
CREATE TABLE visitors (
  id TEXT PRIMARY KEY,
  ext_visitor_id TEXT UNIQUE NOT NULL,
  nick_name TEXT DEFAULT '',
  icon_url TEXT DEFAULT '',
  city_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  first_seen_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 商品-访客关联表（记录某访客某天访问了某商品）
CREATE TABLE product_visitor_relations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  date TEXT NOT NULL,
  visit_count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE RESTRICT,
  UNIQUE(product_id, visitor_id, date)
);

-- 成交记录
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  price TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  date TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 退款记录（关联成交记录）
CREATE TABLE refunds (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  price TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  date TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 供应商
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  wechat_nickname TEXT NOT NULL,
  wechat_id TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 商品-供应商关联（多对多）
CREATE TABLE product_suppliers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  price TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE(product_id, supplier_id)
);

-- 拿货记录（关联商品-供应商）
CREATE TABLE purchase_records (
  id TEXT PRIMARY KEY,
  product_supplier_id TEXT NOT NULL,
  price TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  purchase_date TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_supplier_id) REFERENCES product_suppliers(id) ON DELETE CASCADE
);

-- Label 定义（从 yxcapp.cn 导入）
CREATE TABLE product_labels (
  label_id TEXT PRIMARY KEY,
  label_name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  uid TEXT DEFAULT '',
  product_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 商品-Label 关联（多对多）
CREATE TABLE product_label_relations (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES product_labels(label_id) ON DELETE CASCADE,
  UNIQUE(product_id, label_id)
);
