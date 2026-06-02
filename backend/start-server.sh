#!/bin/bash
#
# IdeaSpark Django 后端服务启动脚本
# 使用方法: ./start-server.sh
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

WORK_DIR="/www/wwwroot/ideaspark_django"
LOG_DIR="$WORK_DIR/logs"
PID_FILE="$WORK_DIR/ideaspark.pid"

# Detect project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/manage.py" ]; then
    WORK_DIR="$SCRIPT_DIR"
fi

cd "$WORK_DIR"

# Checks
if [ ! -f "manage.py" ]; then
    echo -e "${RED}错误: 请在项目根目录执行${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}错误: 找不到 .env 配置文件${NC}"
    exit 1
fi

mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}服务已经在运行 (PID: $PID)${NC}"
        echo -e "${YELLOW}如需重启，请先运行: ./stop-server.sh${NC}"
        exit 0
    fi
    rm -f "$PID_FILE"
fi

# Load environment
export $(grep -v '^#' .env | xargs)

# Determine Python executable
PYTHON="${PYTHON:-python3}"
if ! command -v "$PYTHON" &>/dev/null; then
    PYTHON="python"
fi

SERVER_PORT="${SERVER_PORT:-9001}"

echo -e "${GREEN}正在启动 IdeaSpark Django 后端服务...${NC}"
echo -e "${GREEN}工作目录: $WORK_DIR${NC}"
echo -e "${GREEN}端口: $SERVER_PORT${NC}"
echo -e "${GREEN}日志目录: $LOG_DIR${NC}"

# Start via Gunicorn (production)
nohup "$PYTHON" -m gunicorn config.wsgi:application \
    --config gunicorn.conf.py \
    >> "$LOG_DIR/ideaspark.log" 2>&1 &

NEW_PID=$!
echo $NEW_PID > "$PID_FILE"

echo -e "${GREEN}服务已启动 (PID: $NEW_PID)${NC}"
echo -e "${GREEN}等待服务初始化...${NC}"

sleep 3

if kill -0 "$NEW_PID" 2>/dev/null; then
    echo -e "${GREEN}服务启动成功!${NC}"
    echo -e "${GREEN}API 地址: http://localhost:${SERVER_PORT}${NC}"
    echo -e "${GREEN}API 文档: http://localhost:${SERVER_PORT}/docs/${NC}"
    echo -e "${GREEN}监控: http://localhost:${SERVER_PORT}/metrics${NC}"
    echo ""
    echo -e "${YELLOW}查看日志: tail -f $LOG_DIR/ideaspark.log${NC}"
    echo -e "${YELLOW}停止服务: ./stop-server.sh${NC}"
else
    echo -e "${RED}服务启动失败，请检查日志:${NC}"
    echo -e "${RED}tail -f $LOG_DIR/ideaspark.log${NC}"
    rm -f "$PID_FILE"
    exit 1
fi
