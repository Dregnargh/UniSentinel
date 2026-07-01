# UniSentinel GRC application — build plan

> **TL;DR of the decisions**
> 1. **Keep this one repo.** Don't split website and product into separate repos — separate the
>    *code paths* now (`lib/grc/*`, routes under `app/app/`) and the *deployment unit* later
>    (a second Vercel project on the same repo + `app.unisentinel.com`). The runbook for that
>    future split is at the bottom so it stays a mechanical move, not a research project.
> 2. **Build the GRC product inside `website/`**, reusing the auth/workspace stack, the
>    3-file CRM module pattern, and the console UI as-is. Zero restructuring before feature work.
> 3. **Get the domain model right first** (Phase 0/1): common-controls model, immutable audit
>    trail, auditor role, and a `workspaces.kind` gate so customer signups never see your
>    internal CRM.
> 4. Eight phases, each independently shippable and demoable by a solo developer.

---

## 1. GitHub for a GitLab user (your questions answered)

| GitLab concept | GitHub equivalent | Notes |
|---|---|---|
| Group (with multiple projects) | **Organization** (with multiple repositories) | Free. No nested subgroups — GitHub's hierarchy is flat: org → repos. |
| Project | **Repository** | Same thing. |
| Issue boards / epics | **GitHub Projects** | A Project is a planning board (kanban/table/roadmap) of issues + PRs. One Project **can span multiple repos** in an org — this is the closest thing to a GitLab group-level board. Personal accounts get Projects too. |
| GitLab CI (`.gitlab-ci.yml`) | **GitHub Actions** (`.github/workflows/*.yml`) | Same idea, different YAML dialect. |
| Protected branches | **Branch protection rules** (Settings → Branches) | Require PRs + passing checks before merging to `main`. |

So: you do *not* need multiple repos to get GitLab-group-style organization. If you later want
an umbrella, create a free **organization** (e.g. `unisentinel`) and transfer this repo into it
(Settings → Transfer ownership; GitHub auto-redirects old URLs). A single **Projects board** can
then track work across every repo you ever add.

**Recommended GitHub setup now (Phase 0 includes this):**
- A GitHub Actions workflow running `npm install && next build` + `tsc --noEmit` for `website/`
  on every PR — unusually valuable here because the modified Next 16.2.9 breaks
  training-data assumptions, so a green build is the main safety net.
- Branch protection on `main`: require a PR and the build check.
- One Projects board with columns per plan phase below.

## 2. Repo strategy: one repo, pre-planned split

**Decision: keep `Dregnargh/UniSentinel` as the single repo, and build the GRC product inside
the existing `website/` Next.js app.**

Why not a separate repo:
- Your entire solo-dev leverage is **reuse**: auth (`us_session` jose cookie,
  `requireWorkspace`/`requireAdmin`), the Drizzle/pg layer, the idempotent raw-SQL
  `db-push.mjs` pipeline, `console.css` + `AppShell` + `Modal`/`DeleteButton`, and the
  zod/`useActionState` server-action conventions all live in `website/` and are not packaged
  for consumption elsewhere. Splitting repos forks `lib/auth`, `lib/db`, `schema.ts` and
  `db-push.mjs` into two drifting copies — the worst outcome given migrations are hand-synced.
- Vercel natively supports many apps in one repo (the existing project already uses
  Root Directory = `website`). A future second app is just a second Vercel project.
- Two repos means two CI setups, cross-repo PRs for any feature touching marketing + product,
  and version coordination — pure cost with zero benefit until release cadences diverge or a
  team exists.

Why not a full npm-workspaces monorepo restructure *now* (`apps/website`, `apps/app`,
`packages/db`…): it is 1–2+ days of pure restructuring with zero demo value, it touches the
production Vercel project and DNS before any feature exists, and every later phase becomes
hostage to it landing cleanly on a modified Next version. It self-describes as "Phase 0 is pure
cost". Defer it.

**What we do instead — separate the code paths so the future split stays mechanical:**
- All GRC code lives in `website/lib/grc/*` and new route folders under `website/app/app/`.
- **GRC/marketing firewall:** GRC imports stay strictly under `app/app/` and `lib/grc/` — no
  marketing page may ever transitively import `lib/db` (it throws at import when
  `DATABASE_URL` is unset, which would take down unisentinel.com builds).
- **No imports from `lib/crm` into `lib/grc`** — the CRM is your internal sales tool, the GRC
  app is the product; they share auth/db/UI substrate only.
- Keep authenticated console routes out of the index story (robots/noindex consideration for
  the `/app` tree) as GRC routes multiply.

The full **future-split runbook** (second Vercel project, `app.` CNAME, redirects, cookie
scope) is in §8 — deliberately preserved so the deferred decision stays cheap.

## 3. Architecture

GRC lives at `unisentinel.com/app` alongside the CRM, as new route modules under
`website/app/app/<module>/` (frameworks, controls, evidence, risks, policies, audits, vendors,
incidents, tasks), inheriting the existing **three-layer gate**:
`proxy.ts` edge JWT check (matcher already covers `/app/:path*` — no change needed) →
`app/app/layout.tsx` session + `mustChangePassword` check → per-page/action
`requireWorkspace()`.

- **Module pattern:** mirror `lib/crm` exactly — `lib/grc/{queries.ts, actions.ts, format.ts}`
  plus the 3-file route pattern (`page.tsx` async server component, `<Module>Client.tsx`
  island, `New<Module>Button.tsx` modal form). Mutations use the two blessed shapes:
  `(prev: ActionState, formData)` via `useActionState` for create/edit, scalar-arg actions via
  `useTransition` for status moves (the `toggleActivityDone` precedent). Every mutation ends
  with a shared `revalidateGrc(page)` helper (`revalidatePath(page)` + `revalidatePath("/app")`).
- **RBAC:** extend `users.role` from `admin | member` to `admin | member | auditor` (plain text
  column; widen the `z.enum` in `lib/users/actions.ts`). New `requireRole(...roles)` helper in
  `lib/auth/session.ts` modeled on `requireAdmin`'s **fresh DB check — never trust the JWT
  role claim** (7-day tokens go stale; a demoted auditor must lose access immediately).
  Auditors are read-only: every GRC mutation starts with `requireRole("admin", "member")`.
  Finer-grained ownership (risk owner, control owner) is row-level via `owner_user_id`
  columns, not new roles.
- **CRM/GRC tenant split:** add `workspaces.kind text NOT NULL DEFAULT 'customer'`
  (`'internal'` for UniSentinel's own workspace, set by seed). `AppShell`'s hardcoded NAV
  becomes `NAV_GRC` + `NAV_CRM` keyed off the workspace kind, so customer workspaces never see
  the internal CRM. **This must land before any external signup.**
- **Audit trail:** `lib/grc/audit.ts` exports `logAudit({workspaceId, actor, action,
  entityType, entityId, summary, diff})`, called inside every GRC server action after its
  mutation. Append-only `audit_log` table, immutability enforced twice (no update/delete
  actions exist + a DB trigger raising on UPDATE/DELETE — see risks for its honest limits).
- **Data layer:** same singleton drizzle `db`, same RDS. Every new table lands in **both**
  `lib/db/schema.ts` and `scripts/db-push.mjs` in the same commit; a schema-drift check script
  (diff `information_schema` against `schema.ts`) is wired as an npm script in Phase 1 —
  with ~18 hand-synced tables this is the single biggest correctness hazard.
- **UI:** GRC screens use the `console.css` vocabulary as-is. Wiring the root
  `@unisentinel/ui` package into the website is **consciously deferred**: it pins React 18
  devDeps vs the site's React 19, and its `--us-*` tokens don't match the console's unprefixed
  ones — a reconciliation project, not a ship task. The duplication is a known invoice, not drift.
- **Standing constraint:** this is a **modified Next.js 16.2.9** (`proxy.ts` not
  `middleware.ts`, async `cookies()`, etc.). Every phase starts with `cd website && npm install`
  and reading `node_modules/next/dist/docs` before writing Next-touching code, per `AGENTS.md`.

## 4. Data model

House conventions everywhere unless flagged: `id` text PK = `crypto.randomUUID()` app-side;
`created_at timestamptz NOT NULL` passed as `new Date()`; enum-ish columns = plain text +
`z.enum` in actions + tone maps in `lib/grc/format.ts`; `workspace_id text NOT NULL`
FK→workspaces ON DELETE CASCADE + `idx_<table>_workspace`; every query filtered by the
`workspaceId` from `requireWorkspace()`; cross-FK form inputs validated with
`assertWorkspaceX` before insert. Dates that drive "overdue" logic are **timestamptz, not
free-text** (deviation from the CRM's string dates — overdue must be computable).

**Two deliberate deviations from house conventions:**

**(A) The framework library is GLOBAL (no `workspace_id`).** Immutable once seeded,
append-only versioning (ISO 27001:2027 = new rows, never edits), zero user writes — per-tenant
copies would only bloat and drift.

**(B) User-reference FKs on GRC rows use ON DELETE SET NULL, not CASCADE.** Deleting a
teammate must not delete the risk register — compliance records outlive their owners.
Workspace deletion still cascades via `workspace_id`. Apply consistently in *both* `schema.ts`
and `db-push.mjs`.

### Tables (~18 new)

**Global reference (seeded, read-only):**
- `frameworks` — id, slug UNIQUE (`iso27001-2022`), name, version, description
- `framework_requirements` — id, framework_id FK, code (`A.5.1`, `CC6.1`), title, description,
  parent_id (self-FK for domain→requirement hierarchy), sort_order

**Controls — the spine (common-controls model: one control satisfies many requirements across
frameworks; this is the core differentiator of modern GRC tooling and drives the compliance-% math):**
- `workspace_frameworks` — workspace activation, UNIQUE(workspace_id, framework_id)
- `controls` — code, name, description, status (`Not Started | In Progress | Implemented |
  Not Applicable`), owner_user_id (SET NULL), review_frequency, next_review_at, timestamps
- `control_mappings` — control_id ↔ requirement_id many-to-many, UNIQUE pair; validate the
  control is in-workspace and the requirement belongs to an activated framework.
  Compliance % per framework = mapped requirements with ≥1 Implemented control / total
  (computed in JS, `getDashboardData` pattern)

**Risks (5×5 hardcoded MVP; per-workspace scale labels via a later `risk_settings` table):**
- `risks` — title, description, category, status (`Open | In Treatment | Accepted | Closed`),
  owner_user_id, inherent_likelihood/impact int 1–5, residual_likelihood/impact nullable,
  treatment_strategy (`Accept | Mitigate | Transfer | Avoid`), treatment_notes, review_date
  timestamptz. `riskScore(l,i)` and Low/Med/High/Critical banding are **pure functions** in
  `format.ts` (extend the existing `riskTone` map)
- `risk_controls` — mitigating-control links justifying residual < inherent, UNIQUE pair

**Evidence (reusable across controls):**
- `evidence` — title, type (`Document | Screenshot | Link | Report`), url, file_key (S3, Phase 7),
  status (`Requested | Collected | Approved | Expired`), collected_at, valid_until timestamptz
  (freshness computed at read time — past `valid_until` renders Expired, no cron), owner_user_id
- `control_evidence` — control ↔ evidence join, UNIQUE pair

**Policies (versioned, immutable-by-construction):**
- `policies` — title, category, owner_user_id, review_frequency, next_review_at,
  current_version_id nullable
- `policy_versions` — policy_id, version int, content (markdown), status (`Draft | In Review |
  Approved | Archived`), approved_by_user_id, effective_date, UNIQUE(policy_id, version).
  Approved versions have **no edit action**; new draft = version+1; approving bumps
  `current_version_id` and archives the prior
- `policy_attestations` — policy_version_id, user_id (CASCADE here — attestation is meaningless
  without the user), attested_at, UNIQUE(policy_version_id, user_id)

**Audits:** `audits` (name, framework_id nullable, type `Internal | External`, status
`Planned | Fieldwork | Reporting | Closed`, start/end, lead_user_id) and `audit_findings`
(audit_id, control_id nullable, title, severity, status `Open | In Remediation | Closed`,
due_date, owner_user_id)

**Vendors:** `vendors` (name, category, tier `Critical | High | Medium | Low`, status,
owner_user_id, website, data_shared, next_review_at) and `vendor_assessments` (vendor_id,
status `Sent | Received | Reviewed`, score, notes, assessed_at, plus an `answers jsonb`
column typed `$type<Record<string, string>>` for future questionnaire structure)

**Incidents:** `incidents` — title, severity, status (`Open | Investigating | Resolved |
Closed`), occurred_at, resolved_at, owner_user_id, related_risk_id nullable FK→risks SET NULL

**Tasks (one generic engine powering treatments, evidence requests, remediation, reviews,
attestations):** `tasks` — title, kind (`Treatment | Evidence | Remediation | Review |
Attestation | General`), status, due_date timestamptz, assignee_user_id, polymorphic
entity_type/entity_id (app-validated, indexed), completed_at

**Audit log (the product's own auditability):**
- `audit_log` — workspace_id CASCADE, actor_user_id SET NULL, **actor_name + actor_email
  snapshotted** (history survives user deletion), action (`control.status_changed`),
  entity_type, entity_id, summary, `diff jsonb` ({before, after}), created_at.
  Indexes: (workspace_id, created_at DESC) and (workspace_id, entity_type, entity_id).
  **Paginated from day one** — it grows on every mutation across all modules; never
  fetch-everything, and cap the dashboard feed.

## 5. Build phases

Each phase is independently shippable and demoable. Resist merging phases — that sizing is the
only sustainable cadence for one person.

### Phase 0 — Foundations: audit trail, RBAC, tenant split, GitHub setup
Cross-cutting substrate every module depends on (retrofitting an immutable trail under existing
features never happens cleanly).
- Tables: `audit_log` (+ block-update/delete trigger in `db-push.mjs`), `workspaces.kind`.
- Code: `lib/grc/audit.ts` `logAudit` helper; auditor role (`z.enum` widened, `requireRole` in
  `lib/auth/session.ts`); `AppShell` NAV split (GRC vs internal CRM by workspace kind); empty
  `lib/grc/{queries,actions,format}.ts` scaffolding; **retrofit `logAudit` into the existing
  user-management actions as the proving ground**.
- GitHub: Actions workflow (`next build` + typecheck on PR), branch protection on `main`,
  Projects board seeded with these phases.
- **Deliverable:** `/app/settings/audit-log` page (admin-only, feed UI) showing who did what
  when; an auditor login that can read but not mutate; a customer-kind workspace that sees no
  CRM nav; CI green on PRs. Independently valuable even if GRC stopped here.

### Phase 1 — Framework library, controls, compliance posture
The domain spine.
- Tables: `frameworks`, `framework_requirements` (global, seeded), `workspace_frameworks`,
  `controls`, `control_mappings`.
- `scripts/grc-library-seed.mjs`: **NIST CSF 2.0 full text (public domain)** + ISO 27001:2022
  Annex A and SOC 2 TSC as **codes + short paraphrased titles only** (ISO/AICPA copyright —
  getting this wrong is a legal problem for a compliance vendor specifically).
- Screens: `/app/frameworks` (activate, per-framework readiness %), `/app/frameworks/[slug]`
  (requirement tree with mapped-control badges), `/app/controls` (list + status seg filter +
  mapping picker modal; status changes via scalar server action + `useTransition`).
- Engineering: schema-drift check script wired as `npm run db:check`; first unit tests for the
  compliance-% math (see §6).
- **Deliverable:** activate SOC 2, create controls, map one control to multiple requirements
  across two frameworks (the common-controls differentiator), watch readiness % move.

### Phase 2 — Risk register with heatmap and treatment
Pulled forward (ahead of evidence) because it's the screen GRC buyers ask to see first.
- Tables: `risks`, `risk_controls`. `format.ts` gains `riskScore`, band thresholds, `riskTone`
  extension (+ unit tests — pure functions).
- Screens: `/app/risks` — table + **5×5 heatmap as a pure-CSS grid** (client-side grouping like
  the read-only deals kanban; cells colored by band, click filters the table), inherent vs
  residual toggle, risk detail linking mitigating controls. No drag-and-drop (none installed).
- **Deliverable:** populate 8 risks, show the heatmap, link controls to a risk, record residual
  below inherent with a treatment strategy.

### Phase 3 — Evidence collection and the task engine
- Tables: `evidence`, `control_evidence`, `tasks`. Evidence is metadata + URL (**no file
  storage yet** — deliberate; S3 in Phase 7; don't promise document upload in demos before then).
- Screens: `/app/evidence` (freshness computed from `valid_until` at read time), attach/detach
  on the control view, `/app/tasks` (assignee select, kind/status filters, done toggle).
  "Request evidence" creates a kind=Evidence task linked to the control; risk treatments now
  spawn kind=Treatment tasks (wiring the Phase 2 hook).
- **Deliverable:** attach evidence to a control, see a stale-evidence warning, assign and
  complete a collection task. Controls now carry proof, not just status.

### Phase 4 — Policy management: versioning and attestation
- Tables: `policies`, `policy_versions`, `policy_attestations`.
- Screens: `/app/policies` (list with current version + attestation-% progress bar), detail
  with version history, markdown in a textarea (no editor dependency) rendered read-only when
  Approved, lifecycle Draft→In Review→Approved, "Start attestation" creates kind=Attestation
  tasks for all active users, member-facing attest button.
- **Notification gap to close here:** attestation campaigns without notification are demo-only
  theater — add minimal transactional email (attestation request, task assignment) via a
  simple provider (e.g. Resend/SES), plus email verification at registration before opening
  signups (unverified open signup on a GRC product is an abuse vector).
- **Deliverable:** publish Acceptable Use Policy v1, member attests, publish v2 and show
  attestation resetting per version.

### Phase 5 — Audits and findings (the auditor role gets its surface)
- Tables: `audits`, `audit_findings`.
- Screens: `/app/audits`, audit detail scoped to a framework showing each requirement with
  control status + evidence freshness (a read join over Phases 1–3 — why audits come after
  evidence), findings with severity badges, "Create remediation task" from a finding.
- **Deliverable:** run an internal SOC 2 readiness audit, raise two findings, assign
  remediation, close one. External-auditor read-only login works.

### Phase 6 — Vendor risk and incidents
- Tables: `vendors`, `vendor_assessments`, `incidents`.
- Screens: `/app/vendors` (tier/status list, overdue review badge, assessment log — not a
  questionnaire engine yet), `/app/incidents` (severity/status, occurred/resolved, "raise as
  risk" shortcut creating a risk from an incident).
- **Deliverable:** onboard a Critical-tier vendor with an assessment on file, log an incident,
  escalate it into the risk register. Full GRC acronym covered.

### Phase 7 — Reporting, evidence files, production hardening
- Dashboard rework: framework readiness tiles, open risks by band, overdue tasks/reviews,
  attestation coverage, recent (capped) audit-log feed — one `getGrcDashboardData(workspaceId)`
  via `Promise.all`.
- CSV export routes per module + a printable readiness report page (print CSS, no PDF library).
- **S3 evidence uploads:** bucket + scoped IAM in `website/infra` Terraform; **browser
  presigned PUT/GET only** (Vercel function body limits forbid proxying bytes); private
  bucket; server-side size/type validation; `evidence.file_key` wired.
- Review cadence: controls/policies past `next_review_at` auto-spawn kind=Review tasks
  (computed on dashboard load or a Vercel cron).
- Infra gate — see §7 checklist before the first paying tenant.
- **Deliverable:** a sellable v1 — real file evidence, exportable reports, an executive
  dashboard, and an infra posture safe for multi-tenant customer data.

### Onboarding (cross-cutting, land by Phase 4)
A new signup currently lands in nine empty modules. Add a per-workspace **sample-data seeder**
(`crm-seed.mjs` is the in-repo precedent) or a first-run "activate a framework → create your
first control → add a risk" guided empty-state, so every phase's demo story works for real
signups too.

## 6. Testing strategy (minimal but real)

The domain has pure, high-consequence math that is trivially unit-testable — test it:
- `riskScore`, band thresholds, compliance-% per framework, attestation coverage, evidence
  staleness (all pure functions in `format.ts`/`queries.ts` aggregation helpers).
- One workspace-isolation smoke test: two workspaces, assert queries never return the other's
  rows (the exact place a forgotten `eq(workspaceId)` becomes a breach).
- CI runs these + `next build` + typecheck on every PR.

## 7. Gate checklist before the first external tenant

- [ ] `workspaces.kind` NAV gate live (customers can't see the internal CRM)
- [ ] Email verification on registration + transactional email working
- [ ] `enable_rds_proxy = true` + `DATABASE_CA_CERT` verified TLS in Vercel
- [ ] RDS `deletion_protection = true`, PITR/backups verified by an actual restore test
- [ ] Audit-log DB trigger installed; consider a separate low-privilege app DB role (see risks)
- [ ] Pagination on audit_log and list pages confirmed
- [ ] `workspaces.plan` (entitlement stub) column added — even if unused, retrofitting
      entitlements after multi-framework activation ships is much harder
- [ ] Workspace data-export path exists (CSV per module is acceptable v1)
- [ ] Consider Postgres RLS as a backstop to app-level scoping

## 8. Future split runbook (when marketing/product deploy coupling actually hurts)

Preserved so the deferred split stays a mechanical move:
1. Create a second Vercel project on this same repo, Root Directory = the product folder
   (either `website` stays product and marketing moves out, or restructure to `apps/*` then).
2. GoDaddy: CNAME `app` → `cname.vercel-dns.com`; attach `app.unisentinel.com`.
3. Marketing keeps permanent redirects `/app/:path*` and `/login|/register` → `https://app.unisentinel.com/...`.
4. Product app gets its own `metadataBase`, `robots.ts` = disallow all, no sitemap.
5. Sessions are host-scoped cookies — users re-login once (keep `AUTH_SECRET` identical);
   only widen cookie domain to `.unisentinel.com` if cross-subdomain sessions are truly needed.
6. If restructuring to npm workspaces: single committed root lockfile (delete the root
   `package-lock.json` line from `.gitignore`), set `outputFileTracingRoot` in both apps'
   `next.config.ts`, `transpilePackages` for shared TS-source packages — verify every config
   key against `node_modules/next/dist/docs` (modified Next 16).
7. Remove `DATABASE_URL`/`AUTH_SECRET` from the marketing project's env entirely.

## 9. Risks and honest limits

- **Tenancy is app-level only (no RLS):** one forgotten `eq(workspaceId)` leaks another
  company's risk register — a materially worse breach class than CRM data. Mitigate with
  workspace-scoped query helpers, `assertWorkspaceX` on every FK from form input, the isolation
  smoke test, and RLS as a pre-customer backstop.
- **Dual hand-maintained schema** (`schema.ts` + raw SQL `db-push.mjs`) across ~18 new tables:
  drift grows superlinearly. The Phase 1 drift-check script is mandatory; consider generating
  the SQL from drizzle-kit (already a devDependency) while keeping the idempotent-apply wrapper.
- **Framework content licensing:** ISO 27001 text is ISO-copyrighted, SOC 2 TSC is
  AICPA-licensed — seed codes + paraphrases only; NIST CSF is public domain. A legal problem
  for a compliance vendor specifically.
- **Audit-log immutability is bounded:** the app connects as the RDS master user, so the
  block-update/delete trigger is advisory against a compromised app. Before marketing an
  "immutable audit trail", add a separate low-privilege app DB role (no UPDATE/DELETE grant on
  `audit_log`) or hash-chained entries.
- **Modified Next.js 16.2.9:** APIs differ from training data (`proxy.ts` vs `middleware.ts`
  is the known example); `npm install` + read `node_modules/next/dist/docs` at the start of
  every phase.
- **Stale JWT claims:** all RBAC checks follow the `requireAdmin` fresh-DB-lookup pattern,
  never the token's role claim.
- **User-deletion semantics:** the SET NULL deviation + actor snapshots must be applied
  consistently or deleting one employee silently destroys compliance history.
- **Concurrency (accepted debt):** mutations are last-write-wins; two users editing the same
  control/policy/risk clobber each other. Cheapest later fix: an `updated_at` compare-and-set
  guard on edit actions. Documented as deferred, not forgotten.
- **Internal CRM exposure:** the `workspaces.kind` gate must land before the first external
  signup.
- **Solo-dev scope:** ~18 tables and 9 route modules; the 3-file pattern keeps each module
  mechanical, but keep phases separate and shippable.
