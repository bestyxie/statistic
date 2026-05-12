DROP TABLE IF EXISTS product_visitor_relations;
DROP TABLE IF EXISTS visitors;
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
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE RESTRICT,
  UNIQUE(product_id, visitor_id, date)
);
