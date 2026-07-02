#!/usr/bin/env bash
# Shared helpers for the UniSentinel bundle scripts. Sourced, not executed.
# These scripts run on the CUSTOMER's Linux host — assume nothing beyond
# bash, coreutils, curl and a working docker + compose v2.

set -euo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$BUNDLE_DIR/.env"

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mWARN\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mERROR\033[0m %s\n' "$*" >&2; exit 1; }

require_docker() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed (https://docs.docker.com/engine/install/)"
  docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin is missing"
}

compose() {
  (cd "$BUNDLE_DIR" && docker compose "$@")
}

# Read KEY=value from .env (last occurrence wins, matching compose behavior).
env_get() {
  local key="$1"
  [ -f "$ENV_FILE" ] || return 1
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
}

# Set KEY=value in .env, replacing the existing line or appending.
env_set() {
  local key="$1" value="$2"
  touch "$ENV_FILE"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # sed -i with a temp file: portable across GNU/BSD sed.
    local tmp
    tmp="$(mktemp)"
    sed "s|^${key}=.*|${key}=${value}|" "$ENV_FILE" > "$tmp" && mv "$tmp" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 | tr -d '\n'
  else
    head -c 32 /dev/urandom | base64 | tr -d '\n'
  fi
}

random_password() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
  else
    head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

web_url() {
  printf 'http://localhost:%s' "$(env_get WEB_PORT || echo 8080)"
}

# Wait for the stack to report ready (DB reachable + migrations applied).
# UNISENTINEL_WAIT_TRIES overrides the script default (3s per try) — useful
# on slow hosts (raise it) or in test harnesses (lower it).
wait_ready() {
  local tries="${UNISENTINEL_WAIT_TRIES:-${1:-40}}" url
  url="$(web_url)/readyz"
  say "Waiting for $url ..."
  for _ in $(seq 1 "$tries"); do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
  done
  return 1
}

# Load an air-gap image tarball and echo the product image refs it contained.
airgap_load() {
  local tarball="$1"
  [ -f "$tarball" ] || die "air-gap tarball not found: $tarball"
  say "Loading images from $tarball (this can take a few minutes)..."
  local out
  if [[ "$tarball" == *.gz ]]; then
    out="$(gunzip -c "$tarball" | docker load)"
  else
    out="$(docker load -i "$tarball")"
  fi
  printf '%s\n' "$out"
}

bundle_version() {
  if [ -f "$BUNDLE_DIR/VERSION" ]; then cat "$BUNDLE_DIR/VERSION"; else echo "unknown"; fi
}
