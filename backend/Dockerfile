# =============================================================================
# IdeaSpark Django Backend — Dockerfile
# Multi-stage build: install deps → runtime
# =============================================================================

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1 \
    UV_COMPILE_BYTECODE=1

# System deps required by mysqlclient + build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv==0.5.11

WORKDIR /build

# Copy dependency manifests first for layer caching
COPY pyproject.toml uv.lock ./

# Install production dependencies only
RUN uv sync --frozen --no-dev --no-install-project 2>&1

# ─── Stage 2: Runtime ───────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=Asia/Shanghai \
    # Default port — override via env in 1Panel / docker-compose
    SERVER_PORT=9001

# Runtime system deps (mysqlclient needs the lib, not headers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    fonts-noto-cjk \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create a non-root user
RUN groupadd -r ideapark && useradd -r -g ideapark -d /app -s /sbin/nologin ideapark

WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p /app/logs /app/staticfiles && chown -R ideapark:ideapark /app

# Switch to non-root user
USER ideapark

# Expose application port
EXPOSE 9001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -sSf http://localhost:${SERVER_PORT}/ping 2>&1 | grep -q 'pong' || exit 1

# Entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command (entrypoint will exec this)
CMD ["gunicorn", "--config", "gunicorn.conf.py", "config.wsgi:application"]
