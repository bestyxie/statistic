declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: unknown[]): void
    exec(sql: string, params?: unknown[]): { columns: string[]; values: unknown[][] }[]
    prepare(sql: string, params?: unknown[]): Statement
    export(): Uint8Array
    close(): void
  }
  interface Statement {
    bind(params?: unknown[]): boolean
    step(): boolean
    get(): unknown[]
    getAsObject(): Record<string, unknown>
    free(): void
  }
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>
}
