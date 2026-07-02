# Backup and restore

A backup set is a directory containing:

| File | Contents |
|---|---|
| `db.sql.gz` | Full `pg_dump` of the `unisentinel` database (consistent snapshot, taken while running). |
| `files.tar.gz` | The `/data` volume: uploaded logos, and evidence/attachments as later modules add them. |
| `manifest.txt` | Timestamp, bundle version, exact image tag — needed to know what version a restore returns you to. |

## Taking backups

```bash
./backup.sh                    # one-off, into ./backups/
./backup.sh --keep 14          # cron-friendly: prune to newest 14 sets
./backup.sh --dir /mnt/nas/unisentinel --keep 30
```

Suggested cron (daily at 02:00):

```cron
0 2 * * * cd /opt/unisentinel-bundle && ./backup.sh --keep 14 >> backups/backup.log 2>&1
```

Copy backup sets off the host — a backup on the same disk as the database
protects against mistakes, not against the host dying.

## Restoring

```bash
./restore.sh backups/unisentinel-backup-<timestamp>
```

`restore.sh` stops `web`/`worker`, drops and recreates the database,
replays the dump, replaces `/data` from the files archive (when present in
the set), starts the stack and waits for `/readyz`. It asks you to type
`RESTORE` before touching anything.

Restoring a dump from an **older version** is supported: on start, the web
container applies whatever migrations the dump predates. Restoring a dump
from a **newer** version than the running image is not — upgrade first.

## Restore drill

Do a quarterly drill on a scratch host: install the bundle, `restore.sh`
your latest production backup, log in, confirm a module screen renders and
the audit log's newest entries match expectations. An untested backup is a
hope, not a backup.
