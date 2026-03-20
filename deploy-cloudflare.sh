#!/usr/bin/env bash
# deploy-cloudflare.sh — Deploy Adga Factor to Cloudflare Pages
# Usage: ./deploy-cloudflare.sh [project-name]
#
# Prerequisites:
#   npm install -g wrangler   (or npx wrangler is used as fallback)
#   wrangler login            (first time only — opens browser OAuth)
#
# Environment variables (optional — wrangler picks them up automatically):
#   CLOUDFLARE_API_TOKEN      API token with Pages:Edit permission
#   CLOUDFLARE_ACCOUNT_ID     Your Cloudflare account ID

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT="${1:-adgafactor}"
APP_DIR="$(cd "$(dirname "$0")/app" && pwd)"
OUT_DIR="$APP_DIR/out"

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

log()  { echo -e "${BOLD}▸ $*${RESET}"; }
ok()   { echo -e "${GREEN}✓ $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $*${RESET}"; }
fail() { echo -e "${RED}✗ $*${RESET}"; exit 1; }

# ── Resolve wrangler ──────────────────────────────────────────────────────────
if command -v wrangler &>/dev/null; then
  WRANGLER="wrangler"
elif command -v npx &>/dev/null; then
  WRANGLER="npx wrangler"
else
  fail "wrangler not found. Run: npm install -g wrangler"
fi

# ── Pre-flight ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗"
echo -e "║  Adga Factor → Cloudflare Pages      ║"
echo -e "╚══════════════════════════════════════╝${RESET}"
echo ""

log "Project : $PROJECT"
log "App dir : $APP_DIR"
log "Wrangler: $WRANGLER"
echo ""

# Check wrangler auth
if ! $WRANGLER whoami &>/dev/null; then
  warn "Not logged in to Cloudflare. Launching browser auth…"
  $WRANGLER login
fi

# ── Build ─────────────────────────────────────────────────────────────────────
log "Installing dependencies…"
cd "$APP_DIR"
npm ci --silent
ok "Dependencies installed"

log "Building static export (Cloudflare mode)…"
CLOUDFLARE_PAGES=1 NODE_ENV=production npm run build
ok "Build complete → $OUT_DIR"

# Verify output exists
[[ -d "$OUT_DIR" ]] || fail "Build output not found at $OUT_DIR"

# ── Deploy ────────────────────────────────────────────────────────────────────
log "Deploying to Cloudflare Pages project: $PROJECT"
echo ""

DEPLOY_OUTPUT=$($WRANGLER pages deploy "$OUT_DIR" \
  --project-name "$PROJECT" \
  --commit-dirty=true \
  2>&1)

echo "$DEPLOY_OUTPUT"
echo ""

# Parse the deployment URL from wrangler output
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9._/-]+\.pages\.dev[^ ]*' | tail -1)

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════╗"
echo -e "║  Deployment complete ✓               ║"
echo -e "╚══════════════════════════════════════╝${RESET}"
echo ""

if [[ -n "$DEPLOY_URL" ]]; then
  echo -e "  Preview URL : ${BOLD}$DEPLOY_URL${RESET}"
fi
echo -e "  Production  : ${BOLD}https://${PROJECT}.pages.dev${RESET}"
echo -e "  Dashboard   : ${BOLD}https://dash.cloudflare.com/?to=/:account/pages/view/${PROJECT}${RESET}"
echo ""
echo -e "  ${YELLOW}Custom domain:${RESET} dash.cloudflare.com → Pages → ${PROJECT} → Custom domains"
echo ""
