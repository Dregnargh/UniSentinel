#!/usr/bin/env bash
# Vendor-side: assemble the customer bundle tarball for a release.
#   deploy/package-bundle.sh v0.2.0 [ghcr.io/dregnargh/unisentinel]
# Output: dist/unisentinel-bundle-<version>.tar.gz
# Called by .github/workflows/release.yml; runnable locally for testing.
set -euo pipefail

VERSION="${1:?usage: package-bundle.sh <version> [image]}"
IMAGE="${2:-ghcr.io/dregnargh/unisentinel}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="unisentinel-bundle-$VERSION"
STAGE="$REPO_ROOT/dist/$NAME"

rm -rf "$STAGE"
mkdir -p "$STAGE/docs"

# Scripts + compose + env template ship verbatim; version/image are stamped.
cp "$REPO_ROOT"/deploy/bundle/{install.sh,upgrade.sh,backup.sh,restore.sh,lib.sh,README.md} "$STAGE/"
cp "$REPO_ROOT/deploy/docker/compose.yaml" "$STAGE/compose.yaml"
cp "$REPO_ROOT/deploy/docker/.env.example" "$STAGE/.env.example"
cp "$REPO_ROOT"/deploy/docs/{install.md,upgrade.md,backup-restore.md,air-gap.md} "$STAGE/docs/"

printf '%s\n' "$VERSION" > "$STAGE/VERSION"
# Pin the released image + tag in the env template (install.sh copies it to .env).
sed -i.bak -e "s|^IMAGE=.*|IMAGE=$IMAGE|" -e "s|^TAG=.*|TAG=$VERSION|" "$STAGE/.env.example"
rm -f "$STAGE/.env.example.bak"
chmod +x "$STAGE"/*.sh

mkdir -p "$REPO_ROOT/dist"
tar czf "$REPO_ROOT/dist/$NAME.tar.gz" -C "$REPO_ROOT/dist" "$NAME"
echo "wrote dist/$NAME.tar.gz"
