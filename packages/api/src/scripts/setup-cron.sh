#!/bin/bash
# 设置定时任务的辅助脚本
# 用法: ./setup-cron.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== 设置定时任务 ==="
echo ""
echo "此脚本将在 crontab 中添加一个定时任务，每天凌晨1点执行访客数据导入"
echo ""

# 检查是否已存在定时任务
if crontab -l 2>/dev/null | grep -q "schedule-import"; then
  echo "⚠️  检测到已存在的定时任务"
  echo ""
  echo "当前定时任务:"
  crontab -l | grep "schedule-import"
  echo ""
  read -p "是否要删除现有任务并重新添加? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 删除现有任务
    crontab -l | grep -v "schedule-import" | crontab -
    echo "✓ 已删除现有任务"
  else
    echo "取消操作"
    exit 0
  fi
fi

# 获取当前 crontab
current_cron=$(crontab -l 2>/dev/null || echo "")

# 添加新任务
# 每天凌晨1点执行
new_cron="$current_cron
0 1 * * * cd $PROJECT_ROOT && npx tsx src/scripts/schedule-import.ts >> logs/schedule.log 2>&1
"

# 创建日志目录
mkdir -p "$PROJECT_ROOT/logs"

# 安装新的 crontab
echo "$new_cron" | crontab -

echo ""
echo "✓ 定时任务已设置"
echo ""
echo "定时任务详情:"
echo "  执行时间: 每天凌晨 1:00"
echo "  执行命令: cd $PROJECT_ROOT && npx tsx src/scripts/schedule-import.ts"
echo "  日志文件: $PROJECT_ROOT/logs/schedule.log"
echo ""
echo "查看日志: tail -f $PROJECT_ROOT/logs/schedule.log"
echo "删除任务: crontab -e (手动删除相关行)"
