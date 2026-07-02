# UniSentinel — self-hosted bundle

This bundle contains everything needed to run UniSentinel on a Linux host
with Docker (Engine 24+ and the compose v2 plugin).

| File | Purpose |
|---|---|
| `install.sh` | First install: creates `.env` with generated secrets, pulls (or air-gap loads) images, starts and health-checks the stack. |
| `upgrade.sh` | Version upgrade: pre-upgrade backup, image swap, health-checked restart, rollback instructions on failure. |
| `backup.sh` | Database dump + uploaded-files archive + manifest. Cron-friendly (`--keep N` retention). |
| `restore.sh` | Restores a backup set (destructive, prompts for confirmation). |
| `compose.yaml` | The stack: `postgres` (16), `web` (UI + API + migrations-on-start), `worker` (jobs/email). |
| `.env.example` | Configuration template; `install.sh` copies it to `.env`. |
| `VERSION` | The product version this bundle was released with. |
| `docs/` | Install, upgrade, backup/restore and air-gap guides. |

## Quick start

```bash
tar xzf unisentinel-bundle-<version>.tar.gz && cd unisentinel-bundle-<version>
./install.sh                       # online host
./install.sh --airgap unisentinel-images-<version>.tar.gz   # air-gapped host
```

Then open `http://<host>:8080/setup`, create the administrator, and apply
your license file under **Settings → License**.

Serving over plain HTTP on a LAN (no TLS proxy in front)? Set
`COOKIE_SECURE=false` in `.env` before logging in — see `docs/install.md`.

## Upgrading

```bash
./upgrade.sh --version v0.2.0                                # online
./upgrade.sh --airgap unisentinel-images-v0.2.0.tar.gz       # air-gapped
```

A pre-upgrade backup is taken automatically; `docs/upgrade.md` covers
rollback.

## Backups

```bash
./backup.sh --keep 14        # add to cron, e.g. daily at 02:00
```
