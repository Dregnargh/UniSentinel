# CRM backend integration — implementation plan

> Status of the world: **auth is already a real DB-backed backend** (users table, bcrypt,
> jose sessions, middleware, server actions). It needs no new code — only DB provisioning
> (`npm run db:push && npm run db:seed`). This plan covers the **only real gap: persisting the
> CRM** (Companies, Contacts, Deals, Activities), which today is a static in-memory array in
> `lib/crm/data.ts` imported straight into client pages.
>
> The strategy is to **mirror the auth stack exactly** — the patterns in `lib/db/` and
> `lib/auth/` are our template, so the CRM backend stays consistent with what already ships.

## 0. Prerequisites (do first)

- `cd website && npm install` — `node_modules` isn't present in a fresh clone.
- **Read `node_modules/next/dist/docs/`** before writing any Server Component / server-action
  code. `AGENTS.md` warns this is a **modified Next.js 16.2.9** with breaking changes vs.
  training data; verify current conventions for `"use server"`, `revalidatePath`, and
  async Server Components rather than assuming.
- Confirm auth works end-to-end (`db:push`, `db:seed`, `dev`, log in) so we have a known-good
  baseline before adding tables.

## 1. Schema — extend `lib/db/schema.ts`

Add four tables next to `users`, scoped to the owning admin so each workspace sees only its
own data. Use the existing conventions: `text` PKs (`crypto.randomUUID()`), `integer` timestamps
in `{ mode: "timestamp" }`, `.$inferSelect` / `.$inferInsert` type exports.

- `companies` — id, ownerId (FK→users.id), name, industry, size, location, riskTier, status,
  owner (display), arr, frameworks (JSON text — SQLite has no array type: store
  `text({ mode: "json" })` or a comma-joined string), createdAt.
- `contacts` — id, ownerId, companyId (FK→companies.id), name, title, email, phone, status,
  lastTouch, createdAt.
- `deals` — id, ownerId, companyId (FK→companies.id), name, value, stage, owner, probability,
  closeDate, createdAt.
- `activities` — id, ownerId, companyId (FK→companies.id), type, title, contact, when, done
  (integer boolean mode), createdAt.

Keep the existing `Tone`/`Stage`/`Status` string-union types (move them from `crm/data.ts` into
a `crm/types.ts` or keep them in the schema file) so the UI keeps its type safety.

## 2. Migrations + seed

- **Schema creation:** extend `scripts/db-push.mjs` with `CREATE TABLE IF NOT EXISTS` for the
  four tables (matches the existing raw-SQL, idempotent style), **or** adopt `drizzle-kit`
  (already a devDependency) with a `drizzle.config.ts` + `db:generate`/`db:migrate` scripts.
  Recommendation: stay with the raw `db-push.mjs` style for consistency with what's there,
  unless you want migration history.
- **Seed:** add `scripts/crm-seed.mjs` (or extend `db-seed.mjs`) that inserts the existing demo
  rows from `lib/crm/data.ts`, attributing them to the seeded demo admin's `ownerId`. Idempotent
  (skip if `companies` already has rows). This preserves the current realistic demo dataset.

## 3. Data-access layer (mirror `lib/auth/`)

- `lib/crm/queries.ts` — read functions scoped by `ownerId`, e.g. `listCompanies(ownerId)`,
  `getCompany(id, ownerId)`, `listContacts`, `listDeals`, `listActivities`, plus the derived
  dashboard metrics (`pipelineValue`, `wonValue`, `weightedPipeline`) computed from DB rows
  instead of the static arrays.
- `lib/crm/actions.ts` — `"use server"` mutations: `createCompany` / `updateCompany` /
  `deleteCompany`, same for contacts/deals/activities, plus `moveDealStage(id, stage)` for the
  kanban. Each: read session via `getSession()`, reject if null, validate input with **zod**
  (already a dep — reuse the auth actions' pattern), write, then `revalidatePath("/app/...")`.
- Keep the pure UI helpers (`initials`, `money`, `statusTone`, `riskTone`, `companyName`) — move
  them to `lib/crm/format.ts` so they're shared by client and server without dragging in the DB.

## 4. Wire the UI (the largest, most careful step)

Current pages are `"use client"` and import the static arrays. Convert to the Server-Component +
client-island split:

- **Page (Server Component):** fetch data via `queries.ts` using the session `ownerId`, pass rows
  as props to a client child. (Dashboard `app/app/page.tsx` and all four list pages.)
- **Client island:** keep the interactive bits (search box, status/owner filter `seg`, kanban)
  as a `"use client"` child receiving `initialData` as props — filtering stays client-side over
  the fetched rows, exactly as today.
- **Make the dead buttons real:** "Add company", "New deal", "Add contact", the activity
  checkboxes, and kanban stage moves call the server actions from step 3 (via `<form action=>`
  or `startTransition`), likely surfaced through the existing `Modal` component for create/edit.
- Delete/retire the static arrays in `lib/crm/data.ts` once every consumer reads from the DB
  (keep only the seed source, moved into the seed script).

## 5. Verify

- `npm run db:push && npm run crm-seed` → tables + demo data exist.
- Log in as the demo admin; each CRM page renders DB-backed rows; create/edit/delete persists
  across a full page reload; a second registered account sees an empty CRM (workspace isolation
  holds).
- `npm run build` succeeds under the modified Next 16 (catches Server/Client boundary mistakes).

## Suggested sequencing (each step independently reviewable/committable)

1. Schema + `db-push` tables + seed script (data layer stands alone, no UI change).
2. `queries.ts` + convert **read** paths of all pages to the DB (still no mutations).
3. `actions.ts` + wire create/edit/delete/kanban-move + remove static arrays.
4. Verification pass + docs update (`APP-SETUP.md` "What's included" no longer says CRM is
   in-app-only).

## Open decisions for you

- **Multi-tenancy model:** per-user data (each admin's own CRM) vs. a shared workspace with a
  `workspaces` table and members. The current auth comment says "signups become admins of their
  own workspace," so per-owner scoping is the natural fit — confirm before schema is locked.
- **Migrations:** raw `db-push.mjs` (consistent, simple) vs. `drizzle-kit` (history, more setup).
- **`frameworks` array storage:** JSON column vs. a `company_frameworks` join table (only worth
  it if you'll query/filter by framework server-side).
