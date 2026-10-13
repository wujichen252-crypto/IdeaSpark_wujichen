#!/bin/bash
# =============================================================================
# IdeaSpark Django — Docker Entrypoint
# =============================================================================
set -e

echo "============================================================"
echo "  IdeaSpark Backend — Container Starting"
echo "  $(date)"
echo "============================================================"

# ── Validate required env vars ──────────────────────────────────────────────
required_vars=("DJANGO_SECRET_KEY" "JWT_SECRET" "DB_HOST" "DB_NAME" "DB_USERNAME" "DB_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: Environment variable '$var' is not set."
        exit 1
    fi
done

echo "[✓] Environment variables validated."

# ── Wait for database (up to 60s) ───────────────────────────────────────────
if [ -n "$DB_HOST" ]; then
    echo "[*] Waiting for MySQL at $DB_HOST:$DB_PORT ..."
    timeout=60
    while ! timeout 1 bash -c "echo > /dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null; do
        timeout=$((timeout - 1))
        if [ "$timeout" -le 0 ]; then
            echo "[!] Database not reachable after 60s — starting anyway."
            break
        fi
        sleep 1
    done
    if [ "$timeout" -gt 0 ]; then
        echo "[✓] MySQL is reachable."
    fi
fi

# ── Collect static files ────────────────────────────────────────────────────
echo "[*] Collecting static files..."
python manage.py collectstatic --noinput 2>&1 | tail -1

# ── Start application ───────────────────────────────────────────────────────
echo "[*] Starting Gunicorn on port ${SERVER_PORT:-9001}..."
echo "============================================================"
exec "$@"
