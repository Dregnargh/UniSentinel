# Installing UniSentinel (on-prem Linux)

## Requirements

- Linux x86_64 host (any distribution) with **Docker Engine 24+** and the
  **compose v2** plugin (`docker compose version` works).
- 2 vCPU / 4 GB RAM minimum; disk sized for your data + backups.
- Outbound HTTPS to `ghcr.io` — **or** use the air-gap tarball (see
  `air-gap.md`).
- A TLS reverse proxy (nginx, Traefik, Caddy) in front of the stack is
  strongly recommended for anything beyond a lab.

## Install

```bash
tar xzf unisentinel-bundle-<version>.tar.gz
cd unisentinel-bundle-<version>
./install.sh                # add --port 9090 to change the web port
```

`install.sh`:

1. creates `.env` (mode 600) with a generated `POSTGRES_PASSWORD` and
   `AUTH_SECRET` — it never overwrites an existing `.env`;
2. pulls the pinned images (`IMAGE`/`TAG` stamped in the bundle);
3. starts `postgres`, `web`, `worker` and waits for `/readyz`.

Then open `http://<host>:8080/setup`, create the first workspace and
administrator account, and apply your license file under
**Settings → License** (the vendor supplies the license; the verification
key goes in `.env` as `LICENSE_PUBLIC_KEY`).

## HTTP vs HTTPS — read this before first login

The session cookie is marked `Secure` by default (`COOKIE_SECURE=true`),
which is correct when a TLS proxy fronts the stack. If you access the UI
over **plain HTTP on a LAN** (e.g. `http://grc.internal:8080`), browsers
will refuse the cookie and **login will silently fail** — set
`COOKIE_SECURE=false` in `.env` and `docker compose up -d` before logging
in. `localhost` is exempt from this browser rule, so a quick same-host test
works either way.

## What runs where

| Service | Role | Data |
|---|---|---|
| `postgres` | PostgreSQL 16 | `pgdata` volume |
| `web` | UI + API; applies DB migrations on start (advisory-locked) | `usdata` volume (`/data`: logos, uploads) |
| `worker` | Background jobs: email queue, schedules | shares `usdata` |

Health probes: `GET /healthz` (liveness, includes the running version),
`GET /readyz` (DB reachable + migrations applied).

## Troubleshooting

- **`install.sh` reports "did not become ready"** — `docker compose logs web`.
  The most common causes: the web port is taken (change `WEB_PORT`), or
  Postgres has no disk space.
- **Login does nothing / bounces back** — see *HTTP vs HTTPS* above.
- **License upload rejected** — `LICENSE_PUBLIC_KEY` missing or not the key
  matching your vendor-signed license.
