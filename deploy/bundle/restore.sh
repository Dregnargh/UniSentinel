#!/usr/bin/env bash
# UniSentinel restore — REPLACES the database (and optionally uploaded files)
# with a backup produced by ./backup.sh.
#   ./restore.sh <backup-dir>                 # restores db.sql.gz + files.tar.gz
#   ./restore.sh <db.sql.gz> [files.tar.gz]   # explicit paths
# Stops web+worker during the restore, then starts and health-checks.
# Docs: docs/backup-restore.md
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

[ $# -ge 1 ] || { grep '^#' "$0" | head -7; exit 1; }

DB_DUMP=""
FILES_TAR=""
if [ -d "$1" ]; then
  DB_DUMP="$1/db.sql.gz"
  [ -f "$1/files.tar.gz" ] && FILES_TAR="$1/files.tar.gz"
else
  DB_DUMP="$1"
  FILES_TAR="${2:-}"
fi
[ -f "$DB_DUMP" ] || die "database dump not found: $DB_DUMP"
[ -z "$FILES_TAR" ] || [ -f "$FILES_TAR" ] || die "files archive not found: $FILES_TAR"

require_docker
[ -f "$ENV_FILE" ] || die "no .env found — is the stack installed?"

warn "This DESTROYS the current database$([ -n "$FILES_TAR" ] && echo ' and uploaded files') and replaces them with:"
warn "    db:    $DB_DUMP"
[ -n "$FILES_TAR" ] && warn "    files: $FILES_TAR"
printf 'Type RESTORE to continue: '
read -r answer
[ "$answer" = "RESTORE" ] || die "aborted"

say "Stopping web and worker (postgres stays up)..."
compose stop web worker

say "Recreating the database..."
compose exec -T postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS unisentinel WITH (FORCE);" \
  -c "CREATE DATABASE unisentinel;"

say "Restoring the dump..."
gunzip -c "$DB_DUMP" | compose exec -T postgres psql -U postgres -d unisentinel -q -v ON_ERROR_STOP=1 \
  || die "restore failed — the database may be incomplete; do NOT start the stack, re-run restore"

if [ -n "$FILES_TAR" ]; then
  say "Restoring uploaded files (/data)..."
  # One-off container on the same volume; entrypoint bypassed for a plain shell.
  compose run --rm -T --no-deps --entrypoint sh web \
    -c 'rm -rf /data/* /data/..?* /data/.[!.]* 2>/dev/null; tar xzf - -C /data' < "$FILES_TAR"
fi

say "Starting the stack (migrations re-apply if the dump predates this version)..."
compose up -d
if wait_ready 40; then
  say "Restore complete: $(web_url)"
else
  compose logs --tail 50 web || true
  die "Stack did not become ready after restore — see logs above."
fi
