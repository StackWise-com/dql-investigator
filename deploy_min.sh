#!/usr/bin/env bash
# =============================================================================
# deploy_min.sh — Minimal code-update deploy for stackwise-ai.com
#
# Assumes Node, nginx, certbot, and pm2 are already installed.
# Just pulls latest dev code, builds, restarts the app, and reloads nginx.
# =============================================================================

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PORT=3000
APP_NAME="dql-detective"
HEALTH_CHECK_URL="http://127.0.0.1:${APP_PORT}"
HEALTH_CHECK_MAX_RETRIES=30
HEALTH_CHECK_INTERVAL_SEC=2

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[•] $*${RESET}"; }
success() { echo -e "${GREEN}[✓] $*${RESET}"; }
warn()    { echo -e "${YELLOW}[!] $*${RESET}"; }
error()   { echo -e "${RED}[✗] $*${RESET}"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root: sudo ./deploy_min.sh"

# ─── 1. Pull latest code ─────────────────────────────────────────────────────
info "Pulling latest code in ${APP_DIR}..."
git -C "${APP_DIR}" fetch origin
git -C "${APP_DIR}" reset --hard origin/dev
success "Code up to date"

# ─── 2. Install + Build ────────────────────────────────────────────────────────
info "Installing npm dependencies..."
cd "${APP_DIR}"
npm ci --prefer-offline >/dev/null
success "Dependencies installed"

info "Building Next.js app..."
NODE_ENV=production npm run build
success "Build complete"

# ─── 3. Restart PM2 ────────────────────────────────────────────────────────────
if [[ ! -d "${APP_DIR}/.next" ]]; then
  error "No .next build found. Run 'npm run build' first."
fi

# Load env vars so PM2 inherits them
set -a
# shellcheck disable=SC1091
source "${APP_DIR}/.env.production"
set +a

if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  info "Deleting old PM2 process '${APP_NAME}'..."
  pm2 delete "${APP_NAME}" >/dev/null 2>&1 || true
  success "Old PM2 process deleted"
fi

info "Starting fresh PM2 process '${APP_NAME}' on port ${APP_PORT}..."
pm2 start npm \
  --name "${APP_NAME}" \
  -- start -- -p "${APP_PORT}"
pm2 save >/dev/null
success "PM2 process started"

# ─── 4. Health check ───────────────────────────────────────────────────────────
info "Waiting for app at ${HEALTH_CHECK_URL}..."
local attempt=0
local healthy=false

while [[ $attempt -lt ${HEALTH_CHECK_MAX_RETRIES} ]]; do
  attempt=$((attempt + 1))
  sleep ${HEALTH_CHECK_INTERVAL_SEC}

  if curl -fsS --max-time 3 "${HEALTH_CHECK_URL}" >/dev/null 2>&1; then
    healthy=true
    break
  fi
  info "  Attempt ${attempt}/${HEALTH_CHECK_MAX_RETRIES} — not ready yet..."
done

if [[ "$healthy" == true ]]; then
  success "App is UP on port ${APP_PORT}"
else
  error "App failed health check after ${HEALTH_CHECK_MAX_RETRIES} attempts. Check 'pm2 logs ${APP_NAME}'."
fi

# ─── 5. Reload nginx ───────────────────────────────────────────────────────────
info "Reloading nginx..."
systemctl reload nginx
success "nginx reloaded"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Deployed! https://stackwise-ai.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
