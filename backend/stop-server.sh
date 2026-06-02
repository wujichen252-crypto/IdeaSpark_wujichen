#!/bin/bash
#
# IdeaSpark Django 后端服务停止脚本
# 使用方法: ./stop-server.sh
#

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/ideaspark.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    echo -e "${YELLOW}正在停止服务 (PID: $PID)...${NC}"

    # Graceful shutdown
    kill "$PID" 2>/dev/null

    # Wait up to 10s for graceful shutdown
    for i in $(seq 1 10); do
        if ! kill -0 "$PID" 2>/dev/null; then
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}服务未响应，强制停止...${NC}"
        kill -9 "$PID" 2>/dev/null
    fi

    rm -f "$PID_FILE"
    echo -e "${GREEN}服务已停止${NC}"
else
    echo -e "${YELLOW}没有找到 PID 文件，尝试查找进程...${NC}"
    PID=$(pgrep -f "gunicorn.*config.wsgi" 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}正在停止服务 (PID: $PID)...${NC}"
        kill "$PID" 2>/dev/null
        sleep 2
        kill -9 "$PID" 2>/dev/null || true
        echo -e "${GREEN}服务已停止${NC}"
    else
        echo -e "${YELLOW}服务未运行${NC}"
    fi
fi
