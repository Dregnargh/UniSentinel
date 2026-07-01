# UniSentinel app (auth + CRM) — setup

The marketing site needs nothing extra. The **`/login`, `/register` and `/app`** area needs a
database + an auth secret. Local dev is already wired; production needs 3 env vars + a (free) Turso DB.

## Local development (already set up)

```bash
cd website
npm install
npm run db:push      # creates the users + CRM tables in a local SQLite file (dev.db)
npm run db:seed      # seeds a demo admin
npm run crm:seed     # seeds the demo CRM data into the admin's workspace
npm run dev          # http://localhost:3000
```

Demo login: **admin@unisentinel.com** / **UniSentinel!2026** (or register a new account at /register).

`.env` (local, git-ignored) holds:
```
DATABASE_URL=file:./dev.db
AUTH_SECRET=<generated>
```

## Production (Vercel) — one-time setup

The live site is on Vercel; serverless functions can't use a local SQLite file, so production uses
**Turso** (free, serverless, SQLite-compatible — same code, no migration).

### 1. Create a free Turso database
Easiest via the dashboard at **https://turso.tech** → sign up → **Create Database** (pick a region near your users).
Then from the database page grab:
- its **URL** — looks like `libsql://unisentinel-<you>.turso.io`
- a **token** — "Create Token" / "Generate token"

(CLI alternative if you prefer:)
```bash
turso db create unisentinel
turso db show unisentinel --url            # -> DATABASE_URL
turso db tokens create unisentinel         # -> DATABASE_AUTH_TOKEN
```

### 2. Generate an auth secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# or: openssl rand -base64 32
```

### 3. Add 3 env vars in Vercel
Vercel → project **uni-sentinel** → **Settings → Environment Variables** → add (Production, and Preview if you want):
| Name | Value |
|---|---|
| `DATABASE_URL` | your `libsql://…turso.io` URL |
| `DATABASE_AUTH_TOKEN` | your Turso token |
| `AUTH_SECRET` | the random string from step 2 |

### 4. Create the schema (+ demo admin) in Turso
Run once locally, pointing at the Turso DB:
```bash
cd website
DATABASE_URL="libsql://…turso.io" DATABASE_AUTH_TOKEN="<token>" node scripts/db-push.mjs
DATABASE_URL="libsql://…turso.io" DATABASE_AUTH_TOKEN="<token>" node scripts/db-seed.mjs    # optional demo admin
DATABASE_URL="libsql://…turso.io" DATABASE_AUTH_TOKEN="<token>" node scripts/crm-seed.mjs   # optional demo CRM data
```

### 5. Redeploy
Trigger a redeploy in Vercel (or push any commit). After this, `unisentinel.com/login` and `/app` work in production.

> Until these env vars are set, the marketing site is fully live; only the `/app` + auth routes return an
> error. Setting them doesn't touch the marketing site.

## What's included
- **Auth:** email/password, bcrypt-hashed, signed httpOnly session cookies (`jose`), middleware-gated `/app`. Register creates a workspace admin.
- **CRM:** Dashboard, Contacts, Companies, Deals (kanban pipeline), Activities — built with the UniSentinel design language, seeded with realistic GRC/ERP sales data. The DB schema + tables + seed are in place (`companies`, `contacts`, `deals`, `activities`, each scoped per workspace via `owner_id`); wiring the pages to read/write the DB is the next step.
