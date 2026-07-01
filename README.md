# UniSentinel

Monorepo for the **UniSentinel GRC platform** and its supporting sites.

| Path | What it is |
|---|---|
| `apps/grc` | **The product** — modular GRC platform (web + worker). Self-hostable: cloud, on-prem Linux (Docker), on-prem Windows Server. |
| `apps/website` | Marketing site (unisentinel.com) + internal CRM. Deploys on Vercel (Root Directory = `apps/website`). Never ships to customers. |
| `packages/ui` | `@unisentinel/ui` design system (React 19, CSS-variable tokens). |
| `packages/db` | Product database: drizzle schema + versioned SQL migrations. |
| `deploy/docker` | Production image + docker-compose stack for self-hosting. |

Plan & architecture: [`GRC-APP-PLAN.md`](./GRC-APP-PLAN.md).

## Product quick start (apps/grc)

```bash
npm install
npm run build:ui

# Postgres for local dev (any 16+ works):
docker run --name unisentinel-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=unisentinel_grc -p 5433:5432 -d postgres:16

cd apps/grc && cp .env.example .env
npm run db:migrate --workspace @unisentinel/db   # apply migrations
npm run dev -w @unisentinel/grc                  # http://localhost:3000
```

Health probes: `/healthz` (liveness, no DB), `/readyz` (DB + migrations).

## Self-hosted stack

```bash
cd deploy/docker
cp .env.example .env   # set POSTGRES_PASSWORD
docker compose up -d   # web on :8080, worker, postgres
```

The web container applies migrations on start (serialized by a Postgres
advisory lock), so `docker compose pull && docker compose up -d` is the
upgrade path.

## Development notes

- **Next.js here is a modified 16.2.9** — conventions differ from public
  docs. Read `node_modules/next/dist/docs/` before writing Next-specific code
  (e.g. `proxy.ts` replaces `middleware.ts`).
- Windows Server is a supported product target: no Unix-only dependencies,
  use `path.join`, don't shell out to POSIX tools. CI builds on
  `windows-latest` to enforce this.
- One committed lockfile at the repo root; both Next apps pin
  `outputFileTracingRoot` to the repo root.
