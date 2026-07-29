# 数据库迁移

## 概述

数据库结构由两处共同维护：

- `schema.sql`（仓库根目录）：**完整的建表语句**，用于全新数据库（本地开发库、测试内存库）。全部使用 `CREATE TABLE IF NOT EXISTS`。
- `packages/api/migrations/*.sql`：**增量迁移**，用于演进**生产 D1 数据库**。每个文件代表一次结构变更（建表、加列等）。
- 迁移在 GitHub Actions 部署时自动执行，并由记录表保证**每个迁移只执行一次**。

## schema.sql 与 migrations 的关系

| | `schema.sql` | `migrations/*.sql` |
|---|---|---|
| 用途 | 全新库的完整结构（本地 / 测试） | 生产库的增量变更 |
| 是否幂等 | 全部 `CREATE TABLE IF NOT EXISTS` | 不要求幂等（由记录表保证只跑一次） |
| 何时使用 | `db:init` 建本地库；测试内存库自动读取 | 每次 deploy 自动执行未应用的 |

**改结构时两处都要改**：新增表 / 新增列时，既要在 `schema.sql` 加上（让全新库拥有），也要新增一个 migration（让生产库演进）。否则全新库与生产库会不一致。

## 迁移如何执行（CI）

`.github/workflows/deploy.yml` 的 `Run D1 migrations` 步骤在每次推送到 `main`、或手动触发 workflow 时执行：

1. 创建记录表 `schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT)`（`CREATE TABLE IF NOT EXISTS`）。
2. 按文件名升序遍历 `migrations/*.sql`：
   - 该文件名已在 `schema_migrations` 中 → **跳过**。
   - 否则用 `wrangler d1 execute --file` 执行，成功后 `INSERT` 一条记录。

因为每个迁移只执行一次，即使是 `ALTER TABLE ADD COLUMN`（SQLite 不支持 `IF NOT EXISTS`）也能在每次 deploy 中安全重跑。

## 新增一个迁移

1. 在 `packages/api/migrations/` 下新建文件，命名 `00N_简述.sql`，序号递增（保证执行顺序）：

   ```
   packages/api/migrations/003_transactions_purchase_price.sql
   ```

2. 写 SQL，例如加列：

   ```sql
   ALTER TABLE transactions ADD COLUMN purchase_price TEXT DEFAULT '';
   ```

3. **同步修改 `schema.sql`** 中对应表，加上相同的列，保证全新库一致。

4. 提交。合入 `main` 触发 deploy 后自动执行。

## 本地开发

- 初始化本地库：`pnpm --filter @statistic/api db:init`（用 `schema.sql` 初始化本地 D1，`--local`）。
- 本地库**不跑 migrations**，直接以 `schema.sql` 为准。开发新结构时改 `schema.sql`，然后重建本地库即可。
- 远程库慎用 `db:init:remote`：它会重跑整个 `schema.sql`。由于语句是 `CREATE TABLE IF NOT EXISTS`，**不会删数据**，但也**无法给已有表加新列**——新列只能通过 migration 上线。

## 注意事项

- 迁移按文件名升序执行，序号不要重复、不要插队。
- SQLite 对破坏性操作（删列、改列类型）支持有限，需谨慎；尽量采用「加表 / 加列」这类追加式变更。
- `schema_migrations` 记录表由 deploy 自动创建，**不要**写进 `schema.sql` 或 migrations。
- 迁移执行失败会中断 deploy（不会被静默跳过），便于及时发现问题。
