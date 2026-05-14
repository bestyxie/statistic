# 定时任务使用说明

## 功能说明

定时任务调度器会在每天凌晨1点自动执行访客数据导入，包括：
1. 从第三方API获取昨天的访客数据
2. 导入商品浏览记录
3. 更新商品和店铺的统计数据

## 使用方法

### 方法1：手动运行（单次）

```bash
# 在项目根目录执行
pnpm --filter @statistic/api schedule
```

### 方法2：设置自动定时任务（推荐）

#### Mac/Linux 系统

使用提供的设置脚本：

```bash
cd packages/api
chmod +x src/scripts/setup-cron.sh
./src/scripts/setup-cron.sh
```

#### 手动设置 crontab

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨1点执行）
0 1 * * * cd /path/to/project && npx tsx src/scripts/schedule-import.ts >> logs/schedule.log 2>&1
```

### 方法3：使用 pm2 管理（生产环境推荐）

```bash
# 安装 pm2
npm install -g pm2

# 启动定时任务
pm2 start packages/api/src/scripts/schedule-import.ts --name "statistic-import" --interpreter "npx tsx"

# 查看日志
pm2 logs statistic-import

# 停止任务
pm2 stop statistic-import

# 删除任务
pm2 delete statistic-import
```

## 环境变量

可以通过环境变量自定义配置：

```bash
export SHOP_ID="your-shop-id"
export ADMIN_USER="admin"
export ADMIN_PASS="your-password"
pnpm --filter @statistic/api schedule
```

## 日志查看

定时任务会输出详细日志，包括：
- 下次执行时间
- 访客数据获取进度
- 商品导入结果
- 统计更新情况

查看实时日志：
```bash
tail -f logs/schedule.log
```

## 故障排查

### 任务没有执行
1. 检查 crontab 是否正确设置：`crontab -l`
2. 检查日志文件是否有错误信息
3. 确认 Node.js 和依赖已正确安装

### 数据导入失败
1. 检查第三方API cookie 是否过期
2. 确认店铺ID配置正确
3. 查看日志中的具体错误信息

### 手动测试
```bash
# 直接执行导入脚本测试
pnpm --filter @statistic/api import:visitors
```

## 停止定时任务

#### 删除 crontab 任务
```bash
crontab -e
# 删除包含 schedule-import 的行
```

#### 停止 pm2 任务
```bash
pm2 stop statistic-import
pm2 delete statistic-import
```

## 注意事项

1. **Cookie 过期**：第三方API的cookie会定期过期，需要手动更新脚本中的cookie
2. **网络环境**：确保服务器能访问第三方API地址
3. **数据冲突**：避免在同一时间段多次手动执行导入
4. **日志管理**：定期清理日志文件，避免占用过多磁盘空间
