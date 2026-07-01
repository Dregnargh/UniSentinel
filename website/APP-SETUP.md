# UniSentinel app (auth + CRM) — setup

The marketing site needs nothing extra. The **`/login`, `/register` and `/app`** area needs a
**PostgreSQL** database + an auth secret. Production uses **AWS RDS for PostgreSQL**.

## Local development

You need a local Postgres. Easiest is Docker:

```bash
docker run --name unisentinel-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=unisentinel -p 5432:5432 -d postgres:16
```

Then create `.env` (git-ignored):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/unisentinel
DATABASE_SSL=false          # local Postgres has no TLS
AUTH_SECRET=<generated>      # node -e "console.log(crypto.randomBytes(32).toString('base64'))"
```

```bash
cd website
npm install
npm run db:push      # creates the users + CRM tables
npm run db:seed      # seeds a demo admin
npm run crm:seed     # seeds the demo CRM data into the admin's workspace
npm run dev          # http://localhost:3000
```

Demo login: **admin@unisentinel.com** / **UniSentinel!2026** (or register a new account at /register).

## Production (AWS RDS + Vercel) — one-time setup

### 1. Create the RDS PostgreSQL instance
AWS Console → **RDS → Create database** → **PostgreSQL**. Choose a size (a `db.t4g.micro`
is fine to start), set a master username/password and an initial database name (e.g.
`unisentinel`). Under **Connectivity**, allow access from where your app runs (VPC security
group / public access as appropriate). Note the **endpoint** hostname once it's available.

Your connection string:
```
postgres://<master-user>:<password>@<endpoint>:5432/unisentinel
```

> **Serverless note:** Vercel functions open many short-lived connections. Put an **RDS Proxy**
> (or PgBouncer) in front of RDS and point `DATABASE_URL` at the proxy to avoid exhausting
> `max_connections`. Keep `DATABASE_POOL_MAX` small.

### 2. TLS (required by RDS)
RDS enforces TLS. For verified TLS, download the RDS CA bundle and set it as `DATABASE_CA_CERT`:
```
https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```
(If `DATABASE_CA_CERT` is unset, the connection is still encrypted but the server cert isn't
verified — set the CA for production/compliance.)

### 3. Generate an auth secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# or: openssl rand -base64 32
```

### 4. Add env vars in Vercel
Vercel → project **uni-sentinel** → **Settings → Environment Variables** (Production, and Preview if you want):
| Name | Value |
|---|---|
| `DATABASE_URL` | your `postgres://…rds.amazonaws.com:5432/unisentinel` URL (or the RDS Proxy endpoint) |
| `DATABASE_CA_CERT` | the RDS CA bundle PEM (recommended) |
| `AUTH_SECRET` | the random string from step 3 |

### 5. Create the schema (+ demo data) in RDS
Run once locally, pointing at RDS:
```bash
cd website
DATABASE_URL="postgres://…rds.amazonaws.com:5432/unisentinel" node scripts/db-push.mjs
DATABASE_URL="postgres://…rds.amazonaws.com:5432/unisentinel" node scripts/db-seed.mjs    # optional demo admin
DATABASE_URL="postgres://…rds.amazonaws.com:5432/unisentinel" node scripts/crm-seed.mjs   # optional demo CRM data
```

### 6. Redeploy
Trigger a redeploy in Vercel (or push any commit). After this, `unisentinel.com/login` and `/app` work in production.

> Until these env vars are set, the marketing site is fully live; only the `/app` + auth routes return an
> error. Setting them doesn't touch the marketing site.

## What's included
- **Auth:** email/password, bcrypt-hashed, signed httpOnly session cookies (`jose`), middleware-gated `/app`. Register creates a workspace admin.
- **CRM:** Dashboard, Contacts, Companies, Deals (kanban pipeline), Activities — built with the UniSentinel design language, seeded with realistic GRC/ERP sales data. The DB schema + tables + seed are in place (`companies`, `contacts`, `deals`, `activities`, each scoped per workspace via `owner_id`); wiring the pages to read/write the DB is the next step.
