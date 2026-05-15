import initSqlJs, { type Database as SqlJsDatabase, type Statement } from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = resolve(__dirname, '../.wrangler/state/v3/d1/statistic-db.sqlite')
const SCHEMA_PATH = resolve(__dirname, '../../../../schema.sql')

class PreparedStatement {
  private stmt: Statement

  constructor(stmt: Statement) {
    this.stmt = stmt
  }

  bind(...params: unknown[]) {
    this.stmt.bind(params as number[])
    return this
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    if (this.stmt.step()) {
      const row = this.stmt.getAsObject() as T
      this.stmt.free()
      return row
    }
    this.stmt.free()
    return null
  }

  async run() {
    this.stmt.step()
    this.stmt.free()
    return { success: true }
  }

  async all<T = Record<string, unknown>>() {
    const results: T[] = []
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject() as T)
    }
    this.stmt.free()
    return { results }
  }
}

export class LocalD1 {
  private db!: SqlJsDatabase
  private dirty = false

  async init() {
    const SQL = await initSqlJs()

    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH)
      this.db = new SQL.Database(new Uint8Array(buffer))
    } else {
      this.db = new SQL.Database()
      if (existsSync(SCHEMA_PATH)) {
        const schema = readFileSync(SCHEMA_PATH, 'utf-8')
        this.db.run(schema)
        this.save()
      }
    }

    // Migrate: add UNIQUE index if missing
    const indexes = this.db.exec("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='products' AND sql LIKE '%shop_id%sku%'")
    if (indexes.length === 0) {
      this.db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_shop_sku ON products(shop_id, sku)')
    }

    // Migrate: create visitors table if missing
    const visitorTable = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='visitors'")
    if (visitorTable.length === 0) {
      this.db.run(`
        CREATE TABLE visitors (
          id TEXT PRIMARY KEY,
          ext_visitor_id TEXT UNIQUE NOT NULL,
          nick_name TEXT DEFAULT '',
          icon_url TEXT DEFAULT '',
          city_name TEXT DEFAULT '',
          description TEXT DEFAULT '',
          first_seen_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      this.db.run(`
        CREATE TABLE product_visitor_relations (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          visitor_id TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE RESTRICT,
          UNIQUE(product_id, visitor_id, date)
        )
      `)
      this.dirty = true
    }

    // Migrate: add visit_count column to product_visitor_relations if missing
    const cols = this.db.exec("PRAGMA table_info('product_visitor_relations')")
    const hasVisitCount = cols.length > 0 && cols[0].values.some((col: unknown[]) => col[1] === 'visit_count')
    if (!hasVisitCount) {
      this.db.run('ALTER TABLE product_visitor_relations ADD COLUMN visit_count INTEGER DEFAULT 1')
      this.dirty = true
    }

    // Migrate: create transactions table if missing
    const txTable = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'")
    if (txTable.length === 0) {
      this.db.run(`
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
        )
      `)
      this.dirty = true
    }

    // Migrate: create refunds table if missing
    const refundTable = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='refunds'")
    if (refundTable.length === 0) {
      this.db.run(`
        CREATE TABLE refunds (
          id TEXT PRIMARY KEY,
          transaction_id TEXT NOT NULL,
          price TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          date TEXT NOT NULL,
          note TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        )
      `)
      this.dirty = true
    }

    // Migrate: create suppliers related tables if missing
    const supplierTable = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='suppliers'")
    if (supplierTable.length === 0) {
      this.db.run(`
        CREATE TABLE suppliers (
          id TEXT PRIMARY KEY,
          wechat_nickname TEXT NOT NULL,
          wechat_id TEXT DEFAULT '',
          remark TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `)
      this.db.run(`
        CREATE TABLE supplier_products (
          id TEXT PRIMARY KEY,
          supplier_id TEXT NOT NULL,
          product_code TEXT DEFAULT '',
          price TEXT DEFAULT '',
          image_url TEXT DEFAULT '',
          description TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        )
      `)
      this.db.run(`
        CREATE TABLE purchase_records (
          id TEXT PRIMARY KEY,
          supplier_product_id TEXT NOT NULL,
          price TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          purchase_date TEXT NOT NULL,
          note TEXT DEFAULT '',
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (supplier_product_id) REFERENCES supplier_products(id) ON DELETE CASCADE
        )
      `)
      this.dirty = true
    }

    // Auto-save every 5 seconds if dirty
    setInterval(() => { if (this.dirty) this.save() }, 5000)
  }

  prepare(sql: string) {
    const stmt = this.db.prepare(sql)
    this.dirty = true
    return new PreparedStatement(stmt)
  }

  dump(): Buffer {
    const data = this.db.export()
    return Buffer.from(data)
  }

  save() {
    const dir = dirname(DB_PATH)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(DB_PATH, this.dump())
    this.dirty = false
  }
}
