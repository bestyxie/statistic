#!/usr/bin/env tsx
import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = resolve(__dirname, '../.wrangler/state/v3/d1/statistic-db.sqlite')

async function main() {
  const SQL = await initSqlJs()
  const buf = readFileSync(DB_PATH)
  const db = new SQL.Database(buf)

  const tables = [
    'admin_users', 'shops', 'visitors', 'suppliers', 'products',
    'daily_shop_stats', 'daily_product_stats', 'product_visitor_relations',
    'product_suppliers', 'transactions', 'refunds', 'purchase_records',
  ]
  const deleteOrder = [...tables].reverse()

  function escapeValue(v: unknown): string {
    if (v === null || v === undefined) return 'NULL'
    if (typeof v === 'number') return String(v)
    const s = String(v)
    const escaped = s.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    return `'${escaped}'`
  }

  // 获取有效的 product id 和 visitor id 集合，用于过滤孤儿记录
  const validProductIds = new Set<string>()
  let pStmt = db.prepare('SELECT id FROM products')
  pStmt.bind()
  while (pStmt.step()) validProductIds.add(String(pStmt.getAsObject().id))
  pStmt.free()

  const validVisitorIds = new Set<string>()
  let vStmt = db.prepare('SELECT id FROM visitors')
  vStmt.bind()
  while (vStmt.step()) validVisitorIds.add(String(vStmt.getAsObject().id))
  vStmt.free()

  // 需要按 product_id / visitor_id 过滤的表
  const orphanFilters: Record<string, (row: Record<string, unknown>) => boolean> = {
    daily_product_stats: (row) => validProductIds.has(String(row.product_id)),
    product_visitor_relations: (row) => validProductIds.has(String(row.product_id)) && validVisitorIds.has(String(row.visitor_id)),
    transactions: (row) => validProductIds.has(String(row.product_id)),
  }

  const lines: string[] = []

  lines.push('-- 清空所有表数据')
  for (const table of deleteOrder) {
    lines.push(`DELETE FROM ${table};`)
  }
  lines.push('')

  for (const table of tables) {
    const filter = orphanFilters[table]
    const stmt = db.prepare(`SELECT * FROM ${table}`)
    stmt.bind()
    const rawRows: Record<string, unknown>[] = []
    while (stmt.step()) {
      rawRows.push(stmt.getAsObject())
    }
    const rows = filter ? rawRows.filter(filter) : rawRows
    if (filter && rawRows.length !== rows.length) {
      console.log(`  Filtered ${rawRows.length - rows.length} orphan rows from ${table}`)
    }
    stmt.free()

    lines.push(`-- ${table} (${rows.length} rows)`)
    for (const row of rows) {
      const cols = Object.keys(row)
      const vals = Object.values(row).map(escapeValue)
      lines.push(`INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`)
    }
    lines.push('')
  }

  db.close()

  const outputPath = resolve(__dirname, 'seed.sql')
  writeFileSync(outputPath, lines.join('\n'))
  console.log(`Exported ${lines.length} lines to ${outputPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
