#!/usr/bin/env bash
# UniSentinel on-prem install.
#   ./install.sh                          # online: pulls images from the registry
#   ./install.sh --airgap images.tar.gz   # air-gapped: loads the release tarball
# Options: --port <n> (web UI host port, default 8080), --no-start
# Docs: docs/install.md
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

AIRGAP=""
PORT=""
START=1
while [ $# -gt 0 ]; do
  case "$1" in
    --airgap) AIRGAP="${2:?--airgap needs a tarball path}"; shift 2 ;;
    --port) PORT="${2:?--port needs a number}"; shift 2 ;;
    --no-start) START=0; shift ;;
    -h|--help) grep '^#' "$0" | head -6; exit 0 ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
done

require_docker
say "UniSentinel bundle $(bundle_version)"

# ---- .env: create once, generate secrets ------------------------------------
if [ -f "$ENV_FILE" ]; then
  say ".env already exists — keeping it (secrets are never regenerated)."
else
  cp "$BUNDLE_DIR/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  env_set POSTGRES_PASSWORD "$(random_password)"
  env_set AUTH_SECRET "$(random_secret)"
  say "Created .env with generated POSTGRES_PASSWORD and AUTH_SECRET (mode 600)."
fi
[ -n "$PORT" ] && env_set WEB_PORT "$PORT"

if [ "$(env_get COOKIE_SECURE)" = "true" ]; then
  warn "COOKIE_SECURE=true — correct behind a TLS reverse proxy. For plain-HTTP"
  warn "LAN access, set COOKIE_SECURE=false in .env or login will not work."
fi
if [ -z "$(env_get LICENSE_PUBLIC_KEY)" ]; then
  warn "LICENSE_PUBLIC_KEY is empty — module licenses cannot be applied until it is set."
fi

# ---- images -------------------------------------------------------------------
if [ -n "$AIRGAP" ]; then
  airgap_load "$AIRGAP"
else
  say "Pulling images..."
  compose pull
fi

[ "$START" = "1" ] || { say "--no-start: images ready, run 'docker compose up -d' when you are."; exit 0; }

# ---- start + verify -------------------------------------------------------------
say "Starting the stack..."
compose up -d
if wait_ready 40; then
  say "UniSentinel is up: $(web_url)"
  say "Next steps:"
  say "  1. Open $(web_url)/setup to create the first workspace + administrator."
  say "  2. Apply your license file under Settings → License."
  say "  3. Schedule ./backup.sh (cron) — see docs/backup-restore.md."
else
  compose logs --tail 50 web || true
  die "The stack did not become ready. Logs above; see docs/install.md#troubleshooting."
fi
