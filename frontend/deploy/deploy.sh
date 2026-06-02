#!/bin/bash

# IdeaSpark 前端部署脚本
# 支持: Docker 部署、Nginx 部署、本地预览

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 帮助信息
show_help() {
    echo "IdeaSpark 前端部署脚本"
    echo ""
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  docker      使用 Docker 部署"
    echo "  nginx       部署到 Nginx 目录（需要 sudo）"
    echo "  preview     本地预览生产构建"
    echo "  build       仅构建不部署"
    echo "  help        显示帮助信息"
    echo ""
}

# 打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 未安装，请先安装"
        exit 1
    fi
}

# 构建项目
build_project() {
    info "开始构建项目..."
    
    # 检查 node_modules
    if [ ! -d "node_modules" ]; then
        warn "node_modules 不存在，正在安装依赖..."
        npm ci
    fi
    
    # 清理旧的构建产物
    if [ -d "dist" ]; then
        info "清理旧的构建产物..."
        rm -rf dist
    fi
    
    # 构建
    npm run build
    
    info "构建完成！"
}

# Docker 部署
deploy_docker() {
    info "使用 Docker 部署..."
    
    check_command docker
    check_command docker-compose
    
    # 构建并启动
    docker-compose -f deploy/docker-compose.yml up --build -d
    
    info "Docker 部署完成！"
    info "应用运行在 http://localhost:80"
}

# Nginx 部署
deploy_nginx() {
    info "部署到 Nginx..."
    
    # 构建项目
    build_project
    
    # 检查 Nginx 目录
    if [ ! -d "/etc/nginx" ]; then
        error "未检测到 Nginx 安装"
        exit 1
    fi
    
    # 复制构建产物
    sudo cp -r dist/* /usr/share/nginx/html/
    
    # 复制 Nginx 配置（如果存在）
    if [ -f "deploy/nginx.conf" ]; then
        sudo cp deploy/nginx.conf /etc/nginx/conf.d/ideaspark.conf
    fi
    
    # 测试并重载 Nginx
    sudo nginx -t && sudo nginx -s reload
    
    info "Nginx 部署完成！"
}

# 本地预览
preview() {
    info "本地预览生产构建..."
    
    build_project
    
    info "启动预览服务器..."
    npm run preview
}

# 主逻辑
case "${1:-help}" in
    docker)
        deploy_docker
        ;;
    nginx)
        deploy_nginx
        ;;
    preview)
        preview
        ;;
    build)
        build_project
        ;;
    help|*)
        show_help
        ;;
esac
