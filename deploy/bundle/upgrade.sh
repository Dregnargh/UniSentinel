#!/usr/bin/env bash
# UniSentinel upgrade — pre-upgrade backup, image swap, health-checked start.
#   ./upgrade.sh --version v0.2.0                  # online: pulls from registry
#   ./upgrade.sh --airgap images.tar.gz            # air-gapped release tarball
#   ./upgrade.sh --airgap images.tar.gz --version v0.2.0
# Options: --skip-backup (NOT recommended)
# Rollback: shown at the end of a failed run; see docs/upgrade.md#rollback
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

VERSION=""
AIRGAP=""
BACKUP=1
while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:?--version needs a tag like v0.2.0}"; shift 2 ;;
    --airgap) AIRGAP="${2:?--airgap needs a tarball path}"; shift 2 ;;
    --skip-backup) BACKUP=0; shift ;;
    -h|--help) grep '^#' "$0" | head -7; exit 0 ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
done
[ -n "$VERSION$AIRGAP" ] || die "pass --version <tag> and/or --airgap <tarball> (see --help)"

require_docker
[ -f "$ENV_FILE" ] || die "no .env found — is the stack installed? (run ./install.sh first)"

IMAGE="$(env_get IMAGE || echo ghcr.io/dregnargh/unisentinel)"
OLD_TAG="$(env_get TAG || echo latest)"

# ---- load / determine the target version ---------------------------------------
if [ -n "$AIRGAP" ]; then
  loaded="$(airgap_load "$AIRGAP")"
  printf '%s\n' "$loaded"
  if [ -z "$VERSION" ]; then
    # docker load prints "Loaded image: <ref>" — take the product image's tag.
    VERSION="$(printf '%s\n' "$loaded" | sed -n "s|^Loaded image: ${IMAGE}:||p" | head -n 1)"
    [ -n "$VERSION" ] || die "could not detect the version from the tarball — pass --version explicitly"
  fi
fi

[ "$VERSION" = "$OLD_TAG" ] && die "already on $VERSION — nothing to do"
say "Upgrading $IMAGE: $OLD_TAG -> $VERSION"

# ---- pre-upgrade backup ----------------------------------------------------------
if [ "$BACKUP" = "1" ]; then
  say "Pre-upgrade backup (./backup.sh --label pre-upgrade)..."
  "$BUNDLE_DIR/backup.sh" --label pre-upgrade --keep 5
else
  warn "--skip-backup: no pre-upgrade dump. Rollback will lose data written since your last backup."
fi

# ---- swap the image ----------------------------------------------------------------
env_set TAG "$VERSION"
if [ -z "$AIRGAP" ]; then
  say "Pulling $IMAGE:$VERSION..."
  if ! compose pull web; then
    env_set TAG "$OLD_TAG"
    die "pull failed — TAG reverted to $OLD_TAG, nothing was changed"
  fi
fi

say "Restarting the stack (migrations apply on web start, advisory-locked)..."
compose up -d

if wait_ready 60; then
  version_line="$(curl -fsS --max-time 3 "$(web_url)/healthz" 2>/dev/null || true)"
  say "Upgrade complete: $OLD_TAG -> $VERSION"
  [ -n "$version_line" ] && say "healthz: $version_line"
else
  compose logs --tail 80 web || true
  warn "The stack did not become ready on $VERSION."
  warn "Rollback:"
  warn "  1. ./restore.sh backups/unisentinel-pre-upgrade-<timestamp>   # newest pre-upgrade set"
  warn "  2. Edit .env: TAG=$OLD_TAG"
  warn "  3. docker compose up -d"
  warn "(Migrations are forward-only — rolling back the image without restoring the dump is unsupported.)"
  die "upgrade failed"
fi
