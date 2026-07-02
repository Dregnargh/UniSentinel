#!/usr/bin/env bash
# UniSentinel backup: database dump + uploaded-files archive + manifest.
#   ./backup.sh [--dir backups] [--keep N] [--label pre-upgrade]
# Produces <dir>/unisentinel-<label>-<timestamp>/{db.sql.gz,files.tar.gz,manifest.txt}
# Safe to run while the stack is up (pg_dump is consistent). Cron-friendly.
# Docs: docs/backup-restore.md
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

DIR="$BUNDLE_DIR/backups"
KEEP=0
LABEL="backup"
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) DIR="${2:?--dir needs a path}"; shift 2 ;;
    --keep) KEEP="${2:?--keep needs a number}"; shift 2 ;;
    --label) LABEL="${2:?--label needs a value}"; shift 2 ;;
    -h|--help) grep '^#' "$0" | head -6; exit 0 ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
done

require_docker
[ -f "$ENV_FILE" ] || die "no .env found — is the stack installed? (run ./install.sh first)"

TS="$(date +%Y%m%d-%H%M%S)"
DEST="$DIR/unisentinel-$LABEL-$TS"
mkdir -p "$DEST"

say "Dumping database..."
compose exec -T postgres pg_dump -U postgres -d unisentinel | gzip > "$DEST/db.sql.gz"
[ -s "$DEST/db.sql.gz" ] || die "database dump is empty — aborting"

say "Archiving uploaded files (/data)..."
# tar runs inside the web container: no extra image needed, works air-gapped.
compose exec -T web tar czf - -C /data . > "$DEST/files.tar.gz" \
  || warn "file archive failed (is the web container running?) — DB dump kept"

{
  echo "created_at=$TS"
  echo "bundle_version=$(bundle_version)"
  echo "image=$(env_get IMAGE || echo '?'):$(env_get TAG || echo '?')"
  echo "db_dump=db.sql.gz"
  echo "files=files.tar.gz"
} > "$DEST/manifest.txt"

say "Backup written: $DEST"
du -sh "$DEST" | awk '{print "    size: " $1}'

# ---- retention ------------------------------------------------------------------
if [ "$KEEP" -gt 0 ]; then
  # Sort by name (timestamped) and drop everything beyond the newest N.
  mapfile -t sets < <(ls -1d "$DIR"/unisentinel-"$LABEL"-* 2>/dev/null | sort -r)
  if [ "${#sets[@]}" -gt "$KEEP" ]; then
    for old in "${sets[@]:$KEEP}"; do
      say "Pruning old backup: $old"
      rm -rf "$old"
    done
  fi
fi
