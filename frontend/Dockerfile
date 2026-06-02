# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建生产版本
RUN pnpm run build

# 生产阶段
FROM nginx:alpine

# 复制 Nginx 配置（确保 frontend/deploy/nginx.conf 存在）
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建非 root 用户并设置权限
RUN adduser -S -D -H -u 1001 nginxuser && \
    chown -R nginxuser:nginxuser /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginxuser:nginxuser /var/run/nginx.pid

# 暴露端口
EXPOSE 80

# 使用非 root 用户运行
USER nginxuser

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
