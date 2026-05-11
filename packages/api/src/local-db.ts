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
