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

  const lines: string[] = []

  lines.push('-- 清空所有表数据')
  for (const table of deleteOrder) {
    lines.push(`DELETE FROM ${table};`)
  }
  lines.push('')

  for (const table of tables) {
    const stmt = db.prepare(`SELECT * FROM ${table}`)
    stmt.bind()
    const rows: Record<string, unknown>[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
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
