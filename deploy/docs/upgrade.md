# Upgrading UniSentinel

Always upgrade with `upgrade.sh` — it takes a pre-upgrade backup before
anything changes, and database migrations are **forward-only**.

## Online host

```bash
cd unisentinel-bundle-*      # your install directory
./upgrade.sh --version v0.2.0
```

## Air-gapped host

Transfer `unisentinel-images-<version>.tar.gz` from the release, then:

```bash
./upgrade.sh --airgap unisentinel-images-v0.2.0.tar.gz
```

(The version is detected from the tarball; `--version` overrides.)

## What upgrade.sh does

1. **Pre-upgrade backup** — `backup.sh --label pre-upgrade` (DB dump +
   files archive into `backups/`, newest 5 pre-upgrade sets kept).
2. Sets `TAG=<new version>` in `.env` and pulls / loads the image.
3. `docker compose up -d` — the new web container applies migrations on
   start, serialized by a Postgres advisory lock (safe with web+worker
   starting together).
4. Waits for `/readyz` and prints the running version from `/healthz`.

If the pull fails, `TAG` is reverted and nothing has changed.

## Rollback

Migrations are forward-only: rolling back the image while keeping the
upgraded database is unsupported. Roll back to the pre-upgrade state:

```bash
./restore.sh backups/unisentinel-pre-upgrade-<timestamp>   # newest set
# then in .env: TAG=<old version>
docker compose up -d
```

Everything written between the upgrade and the rollback is lost — that is
what the pre-upgrade dump is for; roll back promptly or not at all.

## Version policy

- Tags are semver: `vMAJOR.MINOR.PATCH`. Patch/minor upgrades are
  supported from any earlier version of the same major.
- Skipping versions is fine — migrations replay in order.
- New bundle scripts occasionally accompany a release; unpack the new
  bundle over your install directory (your `.env`, `backups/` and volumes
  are never inside the bundle) or keep using the old scripts if the
  release notes don't say otherwise.
