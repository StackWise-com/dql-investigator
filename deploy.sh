#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Full production deploy for stackwise.ai
#
# Run this as root (or a sudo-capable user) directly on the server,
# from inside the cloned repo directory.
#
# What it does:
#   1. Installs system deps: Node 20, nginx, certbot, pm2
#   2. Pulls latest code (git pull) — skipped on first run if already current
#   3. Writes .env.production from the values you supply (or keeps existing)
#   4. Builds the Next.js app
#   5. Starts/restarts via PM2 + saves the PM2 startup hook
#   6. Writes the nginx virtual-host config for stackwise.ai
#   7. Issues / renews the Let's Encrypt SSL cert (certbot --nginx)
#   8. Reloads nginx
#
# Usage (first time):
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# Usage (code update):
#   git pull origin dev
#   sudo ./deploy.sh --update
# =============================================================================

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
DOMAIN="stackwise.ai"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # always the repo root
APP_PORT=3000
APP_NAME="dql-detective"
NODE_MAJOR=20
CERTBOT_EMAIL=""   # filled in interactively if empty

# ─── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[•] $*${RESET}"; }
success() { echo -e "${GREEN}[✓] $*${RESET}"; }
warn()    { echo -e "${YELLOW}[!] $*${RESET}"; }
error()   { echo -e "${RED}[✗] $*${RESET}"; exit 1; }

UPDATE_ONLY=false
[[ "${1:-}" == "--update" ]] && UPDATE_ONLY=true

# ─── 0. Root check ───────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run as root: sudo ./deploy.sh"

# ─── 1. System deps ──────────────────────────────────────────────────────────
install_system_deps() {
  info "Updating apt..."
  apt-get update -qq

  if ! command -v node &>/dev/null || \
     node -e "process.exit(+process.version.slice(1).split('.')[0] < ${NODE_MAJOR} ? 1 : 0)"; then
    info "Installing Node.js ${NODE_MAJOR}..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    apt-get install -y nodejs >/dev/null
    success "Node $(node -v) installed"
  else
    success "Node $(node -v) already installed"
  fi

  if ! command -v nginx &>/dev/null; then
    info "Installing nginx..."
    apt-get install -y nginx >/dev/null
    systemctl enable nginx
    success "nginx installed"
  else
    success "nginx already installed"
  fi

  if ! command -v certbot &>/dev/null; then
    info "Installing certbot..."
    apt-get install -y certbot python3-certbot-nginx >/dev/null
    success "certbot installed"
  else
    success "certbot already installed"
  fi

  if ! command -v pm2 &>/dev/null; then
    info "Installing pm2..."
    npm install -g pm2 >/dev/null
    success "pm2 installed"
  else
    success "pm2 $(pm2 -v) already installed"
  fi
}

# ─── 2. Pull latest code ─────────────────────────────────────────────────────
pull_code() {
  info "Pulling latest code in ${APP_DIR}..."
  git -C "${APP_DIR}" fetch origin
  git -C "${APP_DIR}" reset --hard origin/dev
  success "Code up to date"
}

# ─── 3. Environment file ─────────────────────────────────────────────────────
write_env() {
  local env_file="${APP_DIR}/.env.production"

  if [[ -f "${env_file}" ]]; then
    success ".env.production already exists — skipping"
    return
  fi

  if [[ -f "${APP_DIR}/.env" ]]; then
    info "Found .env — copying to .env.production..."
    cp "${APP_DIR}/.env" "${env_file}"
    chmod 600 "${env_file}"
    success ".env.production ready (copied from .env)"
    return
  fi

  info "Creating .env.production (no .env found — entering manually)..."
  echo ""
  read -rp "  NEXT_PUBLIC_SUPABASE_URL        : " SUPABASE_URL
  read -rp "  NEXT_PUBLIC_SUPABASE_ANON_KEY   : " SUPABASE_ANON_KEY
  read -rp "  SUPABASE_SERVICE_ROLE_KEY        : " SUPABASE_SERVICE_KEY
  read -rp "  RAZORPAY_KEY_ID                 : " RAZORPAY_KEY_ID
  read -rp "  RAZORPAY_KEY_SECRET             : " RAZORPAY_KEY_SECRET

  cat > "${env_file}" <<EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NODE_ENV=production
EOF

  chmod 600 "${env_file}"
  success ".env.production written"
}

# ─── 4. Build ────────────────────────────────────────────────────────────────
build_app() {
  info "Installing npm dependencies..."
  cd "${APP_DIR}"
  npm ci --prefer-offline >/dev/null
  success "Dependencies installed"

  info "Building Next.js app (this takes ~30 s)..."
  NODE_ENV=production npm run build
  success "Build complete"
}

# ─── 5. PM2 ──────────────────────────────────────────────────────────────────
start_pm2() {
  cd "${APP_DIR}"

  # Load env vars into the current shell so PM2 inherits them
  set -a
  # shellcheck disable=SC1091
  source "${APP_DIR}/.env.production"
  set +a

  if pm2 describe "${APP_NAME}" &>/dev/null; then
    info "Reloading ${APP_NAME} in PM2..."
    pm2 reload "${APP_NAME}" --update-env
  else
    info "Starting ${APP_NAME} in PM2..."
    pm2 start npm \
      --name "${APP_NAME}" \
      -- start -- -p "${APP_PORT}"
  fi

  pm2 save
  pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true
  success "PM2 running — '${APP_NAME}' on port ${APP_PORT}"
}

# ─── 6. Nginx config ─────────────────────────────────────────────────────────
write_nginx_config() {
  local conf="/etc/nginx/sites-available/${DOMAIN}"

  info "Writing nginx config for ${DOMAIN}..."
  cat > "${conf}" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options            SAMEORIGIN always;
    add_header X-Content-Type-Options     nosniff    always;
    add_header Referrer-Policy            "strict-origin-when-cross-origin" always;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_set_header Host \$host;
    }

    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/javascript image/svg+xml;
    gzip_min_length 1024;
}
NGINX

  ln -sf "${conf}" "/etc/nginx/sites-enabled/${DOMAIN}"
  [[ -f /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default
  nginx -t
  success "nginx config written and validated"
}

# ─── 7. SSL cert ─────────────────────────────────────────────────────────────
issue_ssl() {
  if certbot certificates 2>/dev/null | grep -q "Domains: ${DOMAIN}"; then
    info "Certificate already exists — renewing if needed..."
    certbot renew --quiet --nginx
    success "Certificate renewed (or still valid)"
    return
  fi

  if [[ -z "${CERTBOT_EMAIL}" ]]; then
    read -rp "  Email for Let's Encrypt notifications: " CERTBOT_EMAIL
  fi

  info "Issuing SSL certificate for ${DOMAIN}..."
  mkdir -p /var/www/certbot
  systemctl reload nginx

  certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "${CERTBOT_EMAIL}" \
    --redirect \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}"

  success "SSL certificate issued"

  local cron_job="0 3 * * * certbot renew --quiet --nginx && systemctl reload nginx"
  (crontab -l 2>/dev/null | grep -q "certbot renew") || \
    (crontab -l 2>/dev/null; echo "${cron_job}") | crontab -
  success "Auto-renew cron installed"
}

# ─── 8. Reload nginx ─────────────────────────────────────────────────────────
reload_nginx() {
  systemctl reload nginx
  success "nginx reloaded"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DQL Investigator — Deploy to ${DOMAIN}"
echo "  App directory: ${APP_DIR}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ "${UPDATE_ONLY}" == true ]]; then
  info "Update-only mode"
  pull_code
  build_app
  start_pm2
  reload_nginx
else
  install_system_deps
  write_env
  build_app
  start_pm2
  write_nginx_config
  issue_ssl
  reload_nginx
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Deployed! https://${DOMAIN}"
echo ""
echo "  Useful commands:"
echo "    pm2 logs ${APP_NAME}      — tail app logs"
echo "    pm2 status                 — process status"
echo "    sudo ./deploy.sh --update  — pull + rebuild + reload"
echo "    certbot renew --dry-run    — test SSL auto-renew"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
