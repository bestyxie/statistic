#!/bin/bash
# 开发环境启动脚本 - 使用 tmux 分屏同时运行前端和后端服务

SESSION_NAME="statistic-dev"

# 检查 tmux 是否已安装
if ! command -v tmux &> /dev/null; then
    echo "错误: tmux 未安装"
    echo "请运行: brew install tmux"
    exit 1
fi

# 检查是否已经存在该会话
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "会话 '$SESSION_NAME' 已存在"
    echo "使用 'tmux attach -t $SESSION_NAME' 连接"
    echo "或使用 'tmux kill-session -t $SESSION_NAME' 关闭"
    exit 1
fi

# 创建新会话（但不要立即连接）
tmux new-session -d -s $SESSION_NAME -n "api"

# 在 api 窗口启动后端服务
tmux send-keys -t $SESSION_NAME:api "pnpm --filter @statistic/api dev" C-m

# 创建前端窗口
tmux new-window -t $SESSION_NAME:1 -n "web"

# 在 web 窗口启动前端服务
tmux send-keys -t $SESSION_NAME:web "pnpm --filter @statistic/web dev" C-m

# 切换到 api 窗口
tmux select-window -t $SESSION_NAME:api

echo "✅ 开发环境已启动！"
echo ""
echo "会话信息:"
echo "  - 后端服务: http://localhost:3001"
echo "  - 前端服务: http://localhost:5173"
echo ""
echo "使用命令:"
echo "  连接会话: tmux attach -t $SESSION_NAME"
echo "  断开会话: 按 Ctrl+b 然后按 d"
echo "  关闭会话: tmux kill-session -t $SESSION_NAME"
echo ""
echo "窗口切换:"
echo "  Ctrl+b 然后按 0 - 切换到后端"
echo "  Ctrl+b 然后按 1 - 切换到前端"
echo ""

# 连接到会话
tmux attach-session -t $SESSION_NAME
