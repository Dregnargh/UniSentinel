# User management — implementation plan (shared team workspace)

Turn the CRM from **one-workspace-per-user** into **shared team workspaces**: multiple users
belong to one workspace and collaborate on the same CRM data, and admins can manage members.

> Delivered in 3 phases, each its own PR + build-verify. Phases A/B include a **one-time data
> migration on the live RDS** (you run it in CloudShell — I can't reach AWS). Nothing user-facing
> breaks until Phase B flips the scoping.

## Target data model

- **`workspaces`** (new): `id`, `name`, `createdAt`.
- **`users`** (extend): add `workspaceId` (FK → workspaces), `active` (boolean, default true).
  `role` stays on the user (`admin` / `member`) and is their role *within their workspace*.
  One workspace per user (simplest model that delivers shared data + roles; can grow to
  multi-workspace memberships later without rework of the UI).
- **CRM tables** (`companies`, `contacts`, `deals`, `activities`): visibility column changes from
  `ownerId` (→ a user) to **`workspaceId`** (→ a workspace). The existing free-text `owner`
  field stays for per-record display (e.g. "Maya Chen").

## Phase A — schema + migration (no behaviour change)

1. `schema.ts`: add `workspaces`; add `users.workspaceId` + `users.active`; add `workspaceId` to
   the four CRM tables (keep `ownerId` for now).
2. `scripts/db-push.mjs`: `CREATE TABLE IF NOT EXISTS workspaces`; `ALTER TABLE … ADD COLUMN IF
   NOT EXISTS` for the new columns (Postgres supports `IF NOT EXISTS`). Idempotent.
3. `scripts/migrate-workspaces.mjs` (new, idempotent): for each existing user without a
   workspace, create `"<name>'s Workspace"` and set `users.workspaceId`; then backfill each CRM
   row's `workspaceId` from its `ownerId` → that user's `workspaceId`. Preserves today's isolation
   (each current account becomes its own workspace).
4. You run `db-push` + `migrate-workspaces` against RDS (CloudShell).

## Phase B — re-scope CRM to the workspace (shared data goes live)

1. Session JWT (`jwt.ts`): add `wsid` (workspaceId) to the token; `signSession` includes it.
   `requireSession` exposes it. (Existing sessions lack it → resolved via a one-time DB lookup
   fallback, or users just re-login.)
2. `queries.ts` / `actions.ts`: scope every read/write by `workspaceId` instead of `ownerId`;
   `assertOwnedCompany` → "company is in my workspace".
3. `register` (auth): create a new workspace + the first user as its `admin`, then link.
   (Public signup = new org; admin invite = add to existing org — Phase C.)
4. After verifying in prod, a follow-up migration drops the now-unused `ownerId` columns.

## Phase C — user-management UI + actions (the feature itself)

1. **Authorization:** `requireAdmin()` — `requireSession` + verify `role === 'admin'` **from the
   DB** (fresh, so demotions take effect immediately, not on token expiry). Gates the pages and
   every management action. `login` rejects `active === false`.
2. **Actions** (`lib/users/actions.ts`, `"use server"`, admin-only, workspace-scoped):
   - `createUser` — name, email, role, temp password (admin sets/generates it; no email infra, so
     it's a set-password create, not an emailed invite).
   - `updateUserRole` — admin/member; **blocks removing the last admin**.
   - `setUserActive` — deactivate/reactivate; can't deactivate yourself or the last admin.
   - `resetUserPassword` — admin sets a new password for a member.
   - `deleteUser` — remove from workspace; can't delete yourself or the last admin. Their CRM rows
     stay (data is workspace-scoped; `owner` is text).
3. **UI:** `/app/settings/users` (Server Component, admin-gated) listing workspace members with
   role/status; "Add user" modal (reusing the Step-3 `Modal`); per-row role select, activate/
   deactivate, reset-password, delete. A **"Users"** nav item in `AppShell`, shown only to admins.

## Cross-cutting

- **Auth-token staleness:** role/active changes take effect on next login except where we check
  the DB (the admin gate does). Acceptable; documented.
- **Safety rails:** every mutation is workspace-scoped in the `WHERE`; last-admin and self-action
  guards prevent lockout.
- **Verification per phase:** `tsc` + `next build`; Phase A/B also verified against a local
  Postgres before you run the migration on RDS.

## Open questions for you

1. **Invite flow:** OK that "create user" sets a temporary password the admin shares manually
   (no email sending is wired)? Emailed invites would need an email provider — separate task.
2. **Route location:** `/app/settings/users` vs `/app/users` — preference?
3. **Deactivate vs delete:** keep both (recommended), or delete-only?
