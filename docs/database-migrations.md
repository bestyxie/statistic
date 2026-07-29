# 数据库迁移

## 概述

数据库结构由**三处**共同维护，分别服务不同环境：

- `schema.sql`（仓库根目录）：**完整的建表语句**，用于全新数据库。全部使用 `CREATE TABLE IF NOT EXISTS`。
- `packages/api/src/local-db.ts` 的 `LocalD1.init()`：**本地（dev / 测试）增量迁移**，以一段段幂等的 `// Migrate:` 代码块内联在 `init()` 里，每次启动本地服务 / 跑测试时执行。
- `packages/api/migrations/*.sql`：**生产 D1 增量迁移**，由 GitHub Actions 在部署时执行，并有记录表保证每个文件只跑一次。

## 三种机制对比

| | `schema.sql` | `local-db.ts` 的 Migrate 块 | `migrations/*.sql` |
|---|---|---|---|
| 服务环境 | 全新库（首次创建） | 本地 dev + 测试 | 生产 D1 |
| 形式 | 完整建表语句 | 内联的幂等代码块（先查是否存在再补） | 独立 SQL 文件 |
| 是否幂等 | `CREATE TABLE IF NOT EXISTS` | 必须幂等（每次启动都跑） | 不要求（记录表保证只跑一次） |
| 何时执行 | 本地无库文件时由 `LocalD1.init()` 读取；`db:init` 也会读取 | 每次 `pnpm dev:api` / 跑测试时 | 每次 push 到 `main` 触发 deploy 时 |

**改结构时三处都要改**，否则三个环境会不一致：

1. `schema.sql`：加上表 / 列（让全新库拥有）。
2. `local-db.ts` 的 `LocalD1.init()`：加一个幂等的 `// Migrate:` 块（让**已有的本地库**补上，不丢数据）。
3. `migrations/00N_xxx.sql`：加一个迁移文件（让**生产库**演进）。

## 本地（dev / 测试）迁移机制

本地用的是 `packages/api/src/local-db.ts` 里的 `LocalD1`（基于 sql.js 的 SQLite）：

- **首次启动**（没有 `.wrangler/state/v3/d1/statistic-db.sqlite`）：读取 `schema.sql` 建库。
- **已有库**：直接加载文件，**不会重跑 `schema.sql`**（`CREATE TABLE IF NOT EXISTS` 对已有表是空操作，加不了新列）。
- **演进**：`init()` 里逐段执行 `// Migrate:` 块，每段先查表 / 列是否存在，不存在才 `ALTER` / `CREATE`，并置 `dirty = true` 触发落盘。因此**已有本地库的数据不会丢失**。

所以本地加列的正确做法是：在 `init()` 里仿照已有块新增一段，例如加 `transactions.purchase_price`：

```ts
// Migrate: add purchase_price column to transactions if missing
const txCols = this.db.exec("PRAGMA table_info('transactions')")
const hasPurchasePrice = txCols.length > 0 && txCols[0].values.some((col: unknown[]) => col[1] === 'purchase_price')
if (!hasPurchasePrice) {
  this.db.run("ALTER TABLE transactions ADD COLUMN purchase_price TEXT DEFAULT ''")
  this.dirty = true
}
```

测试用的是 `createInMemoryD1()`（`LocalD1` 的不落盘版本），同样走 `init()`，因此测试库也会跑这些 Migrate 块。

## 生产迁移如何执行（CI）

`.github/workflows/deploy.yml` 的 `Run D1 migrations` 步骤在每次推送到 `main`、或手动触发 workflow 时执行：

1. 创建记录表 `schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT)`（`CREATE TABLE IF NOT EXISTS`）。
2. 按文件名升序遍历 `migrations/*.sql`：
   - 该文件名已在 `schema_migrations` 中 → **跳过**。
   - 否则用 `wrangler d1 execute --file` 执行，成功后 `INSERT` 一条记录。

因为每个迁移只执行一次，即使是 `ALTER TABLE ADD COLUMN`（SQLite 不支持 `IF NOT EXISTS`）也能在每次 deploy 中安全重跑。

## 新增一个迁移（完整流程）

以「给 `transactions` 加 `purchase_price` 列」为例：

1. **`schema.sql`**：在 `transactions` 建表语句里加上 `purchase_price TEXT DEFAULT ''`。
2. **`local-db.ts`** 的 `LocalD1.init()`：加一段幂等的 `// Migrate:` 块（见上），让已有本地库补列。
3. **`migrations/00N_简述.sql`**：新建文件（序号递增），写 `ALTER TABLE transactions ADD COLUMN purchase_price TEXT DEFAULT '';`，让生产库演进。
4. 提交。本地下次 `pnpm dev:api` 自动补列；合入 `main` 触发 deploy 时生产库自动迁移。

## 本地常用命令

- 启动本地 API：`pnpm dev:api`（会执行 `LocalD1.init()`，含所有 Migrate 块）。
- 用 `schema.sql` 初始化本地 D1：`pnpm --filter @statistic/api db:init`（仅对**空库**有意义；已有库请靠 Migrate 块演进，避免删数据重建）。
- 远程库慎用 `db:init:remote`：它会重跑整个 `schema.sql`，无法给已有表加列，新列只能靠 `migrations/*.sql` 上线。

## 注意事项

- 生产迁移按文件名升序执行，序号不要重复、不要插队。
- `local-db.ts` 的 Migrate 块**必须幂等**（先查再改），因为每次启动都会跑。
- SQLite 对破坏性操作（删列、改列类型）支持有限，尽量采用「加表 / 加列」这类追加式变更。
- `schema_migrations` 记录表由 deploy 自动创建，**不要**写进 `schema.sql`、`local-db.ts` 或 migrations。
- 迁移执行失败会中断 deploy（不会被静默跳过），便于及时发现问题。
