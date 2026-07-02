# UniSentinel GRC Platform — product plan & software architecture

> **Plan v2.** Supersedes v1 (see git history). v1 assumed a SaaS-only MVP built inside the
> existing `website/` Next.js app on Vercel. The product requirements below — **on-prem
> deployment (Linux and Windows Server), per-module licensing, deep custom RBAC, external
> integrations** — invalidate that approach. The GRC product becomes its **own self-hostable
> application** in this same repo; the marketing site + internal CRM in `website/` stay as
> they are (still on Vercel), untouched.

---

## Table of contents

1. [Product vision & requirements recap](#1-product-vision--requirements-recap)
2. [What changed from plan v1 and why](#2-what-changed-from-plan-v1-and-why)
3. [Deployment models & packaging architecture](#3-deployment-models--packaging-architecture)
4. [Technology stack decisions](#4-technology-stack-decisions)
5. [Repository layout (monorepo)](#5-repository-layout-monorepo)
6. [Platform core (shared kernel)](#6-platform-core-shared-kernel)
7. [Module framework & cross-module integration](#7-module-framework--cross-module-integration)
8. [Module specifications](#8-module-specifications)
9. [Platform features: dashboards, reports, integrations, API](#9-platform-features-dashboards-reports-integrations-api)
10. [Data architecture](#10-data-architecture)
11. [Security architecture](#11-security-architecture)
12. [Build phases & milestones](#12-build-phases--milestones)
13. [Open decisions](#13-open-decisions)
14. [Risks](#14-risks)

---

## 1. Product vision & requirements recap

UniSentinel is a **modular GRC platform** sold module-by-module:

- **Three delivery options:** cloud (multi-tenant SaaS), on-prem Linux server, on-prem
  Windows Server.
- **Modules with individual pricing.** Each module works standalone but is enriched when
  combined with others (ecosystem). Integrations are **built first-class from day one**, with
  defined behavior when the counterpart module is not purchased, and **automatic data
  promotion** when a missing module is purchased later.
- **Deep, flexible RBAC:** granular permissions on every action (view/create/edit/delete/
  approve/export…) in every module and in settings; admins build custom roles from the
  permission catalog and assign them to users.
- **SSO** (OIDC/SAML) and **SMTP** mail integration.
- **External API integrations:** vulnerability scanners, asset management, patch management, etc.
- **Rich settings**, top-right **profile capsule**, **M365-style app drawer** (one login,
  switch between modules).
- **Configurable dashboards/charts** and **customizable reports**.

Initial module list: Service Catalog, Risk Management, Tasks & Activities, Assessments,
Internal Audits, Compliance, Management Hub — with room for more (the architecture treats
modules as plugins).

## 2. What changed from plan v1 and why

| v1 assumption | New requirement | Consequence |
|---|---|---|
| SaaS only, Vercel serverless | On-prem Linux **and** Windows Server | The product must be a self-contained, long-running server app. New app `apps/grc`, container-first, no Vercel/serverless assumptions anywhere in product code. |
| Build inside `website/` reusing its auth/CRM | Product ships to customer servers | Shipping the marketing site + **internal CRM** code to customers is unacceptable. Product is a separate deployable. `website/` remains internal. |
| Monorepo restructure deferred as premature | Two real apps + shared packages | The npm-workspaces restructure is now justified and happens in Phase 0. |
| Hand-synced raw-SQL `db-push.mjs` migrations | Customers upgrade on-prem installs themselves | **Versioned migrations (drizzle-kit) are mandatory** — automated, ordered, run on startup/CLI. |
| `admin | member | auditor` roles | Custom role builder with per-action permissions | A real RBAC engine: permission catalog + roles + role builder UI (see §6.3). |
| GRC features as fixed app sections | Per-module licensing + ecosystem | A module framework: manifests, entitlements/licensing, integration points with fallbacks and promotion migrations (see §7). |
| Evidence via S3 only | On-prem has no S3 | Pluggable storage driver: S3 (cloud) / local filesystem (on-prem) / any S3-compatible (MinIO). |

**Still valid from v1 and carried forward:** one repo (GitHub org + Projects primer stands —
GitLab group ≈ GitHub organization, GitLab project ≈ GitHub repository, GitHub *Projects* =
cross-repo planning boards; GitHub Actions ≈ GitLab CI); the workspace tenancy pattern; the
immutable audit log design (actor snapshots, append-only, DB trigger); the fresh-DB
authorization check pattern (never trust JWT claims); framework-content licensing caution
(ISO/AICPA text is copyrighted, NIST is public domain); the pre-first-customer gate checklist
mindset.

## 3. Deployment models & packaging architecture

**One codebase, one artifact strategy: the product is a set of long-running processes
(web + worker) + PostgreSQL + a file-storage location.** Cloud and on-prem run the *same*
code; on-prem is simply a single-workspace instance.

```
┌─────────────────────────────────────────────────────────────┐
│                     UniSentinel instance                     │
│                                                              │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐  │
│  │   web (Node)   │   │ worker (Node) │   │  PostgreSQL   │  │
│  │ Next.js         │   │ pg-boss queue │   │  16+          │  │
│  │ standalone      │   │ cron + syncs  │   │               │  │
│  │ UI + API        │   │ notifications │   │               │  │
│  └───────┬────────┘   └───────┬───────┘   └───────┬───────┘  │
│          └────────────┬───────┴───────────────────┘          │
│                       │                                      │
│  ┌────────────────────┴───────────────┐  ┌────────────────┐  │
│  │ Storage driver: S3 | local FS | S3-│  │ SMTP relay     │  │
│  │ compatible (MinIO)                 │  │ (customer's)   │  │
│  └────────────────────────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Cloud (multi-tenant SaaS)
- Containers on AWS (ECS Fargate or a plain EC2/docker-compose to start — solo-dev-honest),
  RDS PostgreSQL (existing instance/Terraform evolves), S3 for files, SES SMTP for mail.
- Multi-tenant via the `workspaces` model (shared DB, `workspace_id` scoping — §10).
- Entitlements come from the subscription DB (billing integration later; manual admin flag first).

### 3.2 On-prem Linux
- **Docker Compose** distribution (the self-hosted industry standard: GitLab/Sentry model):
  `web`, `worker`, `postgres`, optional `caddy` (TLS reverse proxy) services; named volumes for
  DB + files; a single `.env` for configuration; `docker compose pull && up -d` upgrades
  (migrations run automatically on web startup, after an automatic pre-upgrade `pg_dump`).
- Air-gap friendly: images loadable from a tarball (`docker load`), **no outbound calls
  required**, license validated offline (§6.6).

### 3.3 On-prem Windows Server
Two supported paths, in order of preference:
1. **Docker on Windows** (Docker Engine/WSL2 or a Linux VM) — same compose bundle. Many
   enterprise Windows shops now allow this; it's the zero-extra-engineering path.
2. **Native Windows package** for shops that forbid Docker/WSL2:
   - Node.js LTS runtime + the standalone build, installed as **Windows Services** (web +
     worker) via NSSM or `node-windows`; PostgreSQL for Windows (EDB installer); file storage
     on an NTFS path; optional Caddy-for-Windows service for TLS.
   - Distributed as a PowerShell-driven installer (later: WiX/MSI).
   - **Engineering constraints this imposes on ALL product code:** no Unix-only dependencies,
     `path.join` everywhere, no shelling out to POSIX tools, case-insensitive-FS safe imports,
     services must handle Windows service stop signals. **CI runs a `windows-latest` build +
     test job from Phase 0** so Windows compatibility is enforced continuously, not retrofitted.

### 3.4 Versioning & upgrades
- Single platform version (semver) covering core + all modules — a "release train"; modules
  are feature-flagged by license, not separately versioned artifacts (drastically simpler for
  on-prem support).
- Migrations are strictly forward-only, ordered, and idempotent to re-run; every release notes
  its migration set. Upgrade doc: backup → pull → migrate (automatic) → verify `/healthz`.
- `/healthz` (liveness) and `/readyz` (DB + migrations current) endpoints; structured JSON
  logs; optional Prometheus metrics endpoint (nice for enterprise on-prem).

## 4. Technology stack decisions

| Concern | Decision | Rationale |
|---|---|---|
| Web framework | **Next.js (App Router), `output: 'standalone'`**, self-hosted Node server | Team knowledge + proven console patterns from `website/`; standalone output runs anywhere Node runs (Linux/Windows/containers). No Vercel-only features in product code. |
| UI | **`@unisentinel/ui`** (root design system) finally consumed as `packages/ui`; React 19 bump; console patterns (AppShell → new App Drawer shell) | Ends the two-UI-systems duplication; the product is the reason the design system exists. |
| DB + ORM | **PostgreSQL 16+** everywhere; **Drizzle ORM + drizzle-kit migrations** | One DB engine for all three delivery models; drizzle already in use; kit generates versioned SQL migrations (replaces hand-synced `db-push.mjs` for the product). |
| Background jobs | **pg-boss** (Postgres-backed queue + cron) in a `worker` process | No Redis = one less on-prem moving part. Handles scheduled connector syncs, notification digests, report generation, promotion migrations. |
| Auth/session | jose HS256 httpOnly cookie sessions (pattern reused from `website/`), bcrypt; **TOTP 2FA**; **OIDC** via `openid-client`; SAML in a later phase | OIDC covers Entra ID/Okta/Google — the 90% enterprise case; SAML added when a deal demands it. |
| Mail | **nodemailer over SMTP** only | Works identically in cloud (SES SMTP creds) and on-prem (customer relay). No SaaS mail API dependency. |
| File storage | Storage interface with **S3 driver + local-FS driver** (any S3-compatible endpoint works ⇒ MinIO supported) | One abstraction, three deployment models. |
| Diagrams (network/data-flow) | **React Flow**; nodes/edges persisted as jsonb; MVP = auto-generated views from catalog relationships, manual editing later | Buying/building a full Visio clone is a trap; derive diagrams from structured data first. |
| Charts | Recharts (or ECharts if dashboard needs outgrow it) | Declarative, fits the widget model. |
| PDF/report export | **pdfkit (pure JS)** for tabular reports (decided at Phase 8, see §13); print-CSS + headless Chromium reserved for later high-fidelity board packs | Zero native deps, identical output in Docker and native Windows, no 300MB browser in the install. |
| Validation | zod (v4 already in use) shared between server actions and REST API | Existing convention. |
| Licensing | **Ed25519-signed license files** for on-prem; DB entitlements for cloud; one entitlement service over both | Offline verification, no phone-home required (§6.6). |

## 5. Repository layout (monorepo)

npm workspaces, single committed root lockfile. Executed in Phase 0.

```
/package.json                 # workspaces: ["apps/*", "packages/*"]
/apps/website/                # ← git mv website; marketing + internal CRM; Vercel; UNCHANGED behavior
/apps/grc/                    # THE PRODUCT. Next.js standalone
│   ├── app/                  #   routes: (auth)/, (platform)/settings, m/<module>/...
│   ├── modules/<key>/        #   module folders (manifest, schema, queries, actions, ui/, promote/)
│   ├── platform/             #   shared kernel: rbac/, entitlements/, events/, links/, storage/,
│   │                         #   notify/, settings/, dashboards/, reports/, api/, audit/
│   └── worker/               #   worker entrypoint (pg-boss jobs; imports module job definitions)
/packages/ui/                 # ← git mv src; @unisentinel/ui, React 19
/packages/db/                 # product schema (core + per-module files), drizzle-kit migrations, seeds
/packages/config/             # shared tsconfig/eslint
/deploy/
│   ├── docker/               # Dockerfile (web+worker from one image), compose.yaml, caddy config
│   ├── windows/              # PowerShell installer, NSSM service defs, upgrade script
│   └── cloud/                # Terraform (evolved from website/infra)
/.github/workflows/           # ci.yml: lint+typecheck+test+build on ubuntu AND windows; release.yml: images + bundles
```

Notes:
- `apps/website` keeps its own DB/schema (auth + CRM) exactly as today — **the product does
  not share the website's database or sessions.** Cloud signup flow can later bridge
  marketing → product provisioning via an API, not shared tables.
- Modules live as folders inside `apps/grc`, not separate packages: single version train,
  no publish overhead, but a lint rule enforces that modules only import each other through
  `platform/` contracts (§7.4).

## 6. Platform core (shared kernel)

Everything modules stand on. Built once, in Phases 0–2, before any module.

### 6.1 Tenancy
- `workspaces` (tenant), `users`, `user_workspaces` (cloud users may belong to multiple
  workspaces later; MVP: one). Every domain table carries `workspace_id` FK + index (v1
  convention retained). On-prem instance = exactly one workspace, created by the setup wizard —
  **the code path is identical in all deployments.**
- Org structure lives in the platform, not a module (needed by RBAC data-scopes and several
  modules): `org_units` (tree: company → business line → department), referenced by Service
  Catalog, Risk, HR-ish assignments.

### 6.2 Authentication
- Local email/password (bcrypt) + forced-change + lockout policy + password policy settings.
- **TOTP 2FA** (enterprise on-prem expectation).
- **SSO:** OIDC per workspace (cloud) / per instance (on-prem): issuer, client id/secret,
  claim→attribute mapping, JIT user provisioning with a default role, option to disable local
  login. SAML + SCIM provisioning are later phases (§12).
- Sessions: jose cookie pattern from `website/`, with server-side session records
  (`sessions` table) so admins can list/revoke sessions — an auditability expectation for GRC.

### 6.3 RBAC engine (requirement #4 — a first-class subsystem)
- **Permission catalog:** static, code-generated from module manifests at build time. Naming:
  `module.resource.action`, e.g. `risk.risks.view|create|edit|delete|approve|export`,
  `catalog.assets.import`, `platform.roles.manage`, `platform.settings.smtp`. Actions beyond
  CRUD are explicitly declared per resource (approve, assign, publish, close…).
- **Tables:** `roles` (workspace-scoped, `is_system` for built-ins: Owner, Administrator,
  read-only Auditor, per-module presets), `role_permissions` (role_id, permission text),
  `user_roles` (many-to-many; a user's effective set = union).
- **Role builder UI:** settings screen listing the catalog grouped by module → resource →
  action with tri-state group toggles; clone-from-existing; shows per-role member count;
  guardrails (cannot edit system roles; cannot remove the last user holding
  `platform.roles.manage`).
- **Enforcement:** `requirePermission(ctx, "risk.risks.approve")` at the top of every server
  action and API handler — fresh DB check per request (v1 lesson: never trust token claims),
  memoized per-request. UI receives the effective permission set from the layout to hide
  disallowed actions (defense in depth: server always re-checks).
- **Data scopes (v2, schema-ready):** optional restriction of a role to org_units ("Risk
  Manager for Retail BU"). `role_scopes` table exists from day one; enforcement lands later.
- **Approval primitive:** shared `approvals` service — modules request approval for an action
  (`entity_type/id, action, requested_by, rule`), settings define per-action approval rules
  (role or named users, N-of-M), approvers get tasks/notifications; the audit log records the
  chain. Used by risk acceptance, policy publication, audit report issuance, etc.

### 6.4 Audit log
Carried from v1, platform-wide: append-only `audit_log` with actor snapshot (id nullable +
name/email text), `action`, `entity_type/id`, `diff jsonb`, workspace-scoped, indexed,
paginated from day one, DB trigger blocking UPDATE/DELETE, `logAudit()` called by every
mutation via the action wrapper (§7.4). Product runs with a **dedicated low-privilege DB role**
(no superuser; no UPDATE/DELETE grant on `audit_log`) — feasible now that we control the
runtime in all three deployments.

### 6.5 Notifications & SMTP
- `notifications` (in-app inbox: bell in the top bar) + email via SMTP with per-user
  preferences and per-event templates; digest option. Worker sends mail (retry via pg-boss).
- Event-driven: modules emit domain events (§7.3); notification rules map events → recipients
  (entity owner, role holders, explicit users).

### 6.6 Licensing & entitlements
- **Entitlement service** answers `isModuleEnabled(workspaceId, moduleKey)` and seat questions;
  backed by:
  - Cloud: `module_entitlements` rows (module_key, status, seats, expires_at) managed by
    internal admin tooling (billing automation later).
  - On-prem: an **Ed25519-signed license file** (JSON: customer, modules[], seats, expiry,
    instance binding optional) uploaded in settings; verified offline against the public key
    baked into the build; grace period on expiry (read-only mode after grace, never data lock-in).
- Enforcement points: app-drawer visibility (unlicensed modules shown greyed with "contact
  sales" — deliberate upsell surface), route guard `requireModule(key)`, server action guard,
  API guard, and **integration-point resolution** (§7.2).

### 6.7 Settings framework (requirement #7)
- Namespaced key-value with typed zod schemas: `settings` (workspace_id, namespace, key,
  value jsonb). Platform namespaces: **branding** (company logo upload — stored via the
  storage driver, shown in the app-shell top bar, login page, and every report
  header/cover — plus brand colors), auth policy, SSO, SMTP, notifications, approvals,
  API tokens, license. **Modules contribute settings panels
  via their manifest** — settings UI is generated from panel registrations, so every module
  gets rich settings without bespoke plumbing.

### 6.8 App shell UX (requirements #8, #9)
- **App drawer** (top-left grid icon, M365-style): tiles for each licensed module + Settings +
  Management Hub; unlicensed tiles greyed. One session, module switch = client-side nav.
- **Profile capsule** (top-right): avatar/initials, name, role badges, "My profile" (profile,
  password, 2FA, notification prefs, sessions), workspace switcher (cloud), sign out.
- Persistent top bar: drawer, global search (per-module providers later), notifications bell,
  profile capsule. Left sidebar is **per-module** navigation.

## 7. Module framework & cross-module integration

The heart of requirement #2/#3. Modules are **statically compiled plugins**: all code ships in
every build; licensing decides what activates. (No dynamic plugin loading — massively simpler
to test and support on-prem, and the license file stays the single activation mechanism.)

### 7.1 Module manifest
Each `modules/<key>/manifest.ts` declares, typed:

```ts
{
  key: "risk", name: "Risk Management", icon, description,
  permissions: [...resource/action declarations...],      // feeds the RBAC catalog
  navigation: [...sidebar items...],
  entityTypes: ["risk", "treatment"],                     // registered for links/audit/search
  provides: [...integration points offered...],           // e.g. catalog provides "scope-entities"
  consumes: [{ point: "scope-entities", from: "catalog",  // + REQUIRED fallback declaration
               fallback: "local-list", promotion: promoteScopeItems }],
  dashboardWidgets: [...], reportTypes: [...], settingsPanels: [...],
  jobs: [...worker job definitions...],
  events: { emits: ["risk.created", ...], listens: ["task.completed", ...] },
}
```

The platform aggregates manifests at build time: permission catalog, app drawer, settings
tree, widget/report registries, event wiring, and the `entity_types` registry all derive from
manifests — **adding a module never edits platform code.**

### 7.2 Integration points: the provide/consume/fallback/promote pattern
The rule from requirement #3, made mechanical. Every cross-module dependency is a named
**integration point** with four mandatory parts:

1. **Provider interface** — e.g. Service Catalog provides `scope-entities`: search/list/get
   over its entity types (assets, services, departments…).
2. **Consumer usage** — e.g. Risk's scope picker calls the point through the platform resolver:
   `resolve("scope-entities")` returns the Catalog implementation **iff catalog is licensed**,
   else the consumer's declared fallback implementation.
3. **Fallback (standalone mode)** — a module-local lightweight substitute, deliberately
   shaped for later promotion. E.g. Risk ships `risk_scope_items` (id, workspace_id, name,
   kind, notes): standalone customers keep a simple list, exactly as required.
4. **Promotion migration** — a wizard + idempotent routine, part of the module's
   definition-of-done, run when the providing module is activated later: it walks fallback
   rows, creates/dedupes real provider entities (user-assisted matching UI: "these 3 scope
   items look like the same server"), rewrites references in `entity_links`, and marks
   fallback rows migrated (kept for audit, hidden from UI). Runs as a worker job with a
   dry-run preview.

**Uniform reference storage makes promotion cheap:** consumers never store raw FK columns to
other modules' tables. All cross-module references go through one table:

```
entity_links(id, workspace_id, source_type, source_id, target_type, target_id,
             link_kind, created_by, created_at, UNIQUE(source, target, kind))
```

`target_type` may be a fallback type (`risk:scope_item`) or a provider type
(`catalog:asset`); promotion = rewrite `target_*` in place. Referential integrity is enforced
at the action layer (`assertWorkspaceEntity(type, id)` via the entity-type registry), the
same trust model as workspace scoping.

### 7.3 Domain events
In-process, synchronous-by-default event bus with a persisted **outbox** table
(`domain_events`) so the worker and integrations can consume reliably:
- Emit: `task.completed {taskId, links}` → Risk listens: recompute linked treatment-plan
  progress. `assessment.submitted` → Compliance updates requirement status. Events fire only
  into licensed listeners; unlicensed listeners are inert (no error, by construction).
- The outbox doubles as the webhook source (§9.3) and keeps modules decoupled: **modules
  never import each other's actions — only platform contracts and events.** (Enforced by an
  ESLint boundary rule on `modules/*` imports.)

### 7.4 Module developer contract (definition of done, every module)
- Schema in `packages/db/modules/<key>.ts` + generated migration; all tables workspace-scoped.
- Every mutation wrapped by the platform action wrapper, which enforces in order:
  `requireModule` → `requirePermission` → zod validation → mutation → `logAudit` → event emit
  → `revalidate`. One wrapper = impossible-to-forget audit/RBAC.
- Standalone mode works: all `consumes` points have working fallbacks; **promotion routine +
  tests shipped in the same phase**, not later.
- Contributes: permissions, nav, ≥1 dashboard widget, ≥1 report type, settings panel, seeds
  (demo data for trials — v1's onboarding lesson), unit tests for domain math, an isolation
  test (two workspaces cannot see each other).

## 8. Module specifications

Per module: purpose, core entities, standalone behavior, provides/consumes (+fallback/promotion).
Schemas follow house conventions (text UUID PKs, timestamptz, plain-text enums + zod, jsonb
where genuinely dynamic).

### 8.1 Service Catalog (the provider hub)
Company context: what the organization *is* and *has*.
- **Entities:** `org_units` come from platform; `services`/business processes (owner, criticality,
  org_unit, dependencies service↔service and service↔asset); `assets` (types: hardware,
  software, data, people, facility, cloud; fields per type via a typed jsonb `attributes` +
  configurable asset-type templates in settings; owner, custodian, location, classification,
  lifecycle status); `asset_relationships` (typed edges: hosts, connects-to, stores,
  processes); `data_flows` (source, target, data classification, protocol).
- **Diagrams:** network & data-flow views **generated** from `asset_relationships`/`data_flows`
  with React Flow (auto-layout); saved views with manual position overrides (jsonb); free-form
  drawing is out of scope for MVP.
- **Standalone:** full value alone as asset/service inventory + diagrams.
- **Provides:** `scope-entities` (search/list over services/assets/org_units — consumed by
  Risk, Assessments, Audits, Compliance), `asset-import` sink for integration connectors (§9.3).
- **Consumes:** `activity-link` from Tasks (fallback: none — link section simply hidden).

### 8.2 Risk Management
- **Entities:** `risk_methodologies` (configurable scales 3×3..5×5, likelihood/impact criteria
  text per level, score bands, appetite/tolerance thresholds — settings-driven, per workspace);
  `risks` (ref code, title, category taxonomy (settings), org_unit, owner, status workflow
  Draft→Assessed→In Treatment→Accepted/Closed, inherent & residual L/I, next_review_at);
  `risk_assessment_history` (point-in-time re-assessments — trend charts need history, a v1 gap
  fixed by design); `treatments` (strategy, plan, cost, target_date, progress %);
  `risk_acceptances` via the platform approval primitive.
- **Standalone:** scope = local list (`risk_scope_items`); treatment actions = local
  checklist (`treatment_actions`).
- **Consumes:** `scope-entities` ← Catalog (fallback `risk_scope_items`; promotion: wizard
  matches items to catalog entities, rewrites `entity_links`); `activities` ← Tasks (treatment
  plan links to real activities; progress auto-rolls-up from `task.completed`/progress events;
  fallback `treatment_actions` simple checklist; promotion: checklist items → tasks under an
  auto-created "Treatment: <risk>" activity); `controls` ← Compliance (mitigating controls;
  fallback: free-text control references).
- **Provides:** `risks-by-entity` (Catalog shows risks per asset; Management Hub aggregates),
  heatmap + top-risks dashboard widgets, risk register/treatment status reports.

### 8.3 Tasks & Activities
Task management with light project capabilities — the execution engine other modules delegate to.
- **Entities:** `activities` (projects/plans: phases jsonb or child table, owner, dates,
  status, progress roll-up), `tasks` (activity_id nullable — standalone tasks allowed,
  assignee, due, priority, status, checklist jsonb, recurrence rule, `origin` entity link:
  the risk/finding/requirement that spawned it), `task_comments`, attachments via platform
  storage.
- **Views:** list, kanban (by status/assignee), calendar; "My tasks" cross-module inbox.
- **Standalone:** a competent team task manager.
- **Provides:** `activities`/`task-spawn` integration point (Risk treatments, Audit finding
  remediation, Compliance gap actions, Management Hub meeting actions all create linked tasks);
  emits `task.completed`, `task.progress` events consumed for roll-ups.
- **Consumes:** nothing hard; enriches origin badges when source modules are present.

### 8.4 Assessments
Reusable questionnaire/campaign engine.
- **Entities:** `assessment_templates` (sections/questions jsonb: types choice/scale/text/
  evidence-upload; scoring weights), `campaigns` (template, audience: users/org_units/vendor
  contacts-later, schedule, reminders), `responses` (per respondent, status, answers jsonb,
  score), evidence attachments.
- **Standalone:** maturity/self-assessments with scoring and campaign tracking.
- **Provides:** `assessment-run` point (Compliance control self-assessments, Audit fieldwork
  checklists, Risk control-effectiveness input); `assessment.submitted` events.
- **Consumes:** `scope-entities` ← Catalog to target campaigns at org_units/services
  (fallback: manual respondent lists); Tasks for follow-ups on poor scores.

### 8.5 Internal Audits
- **Entities:** `audit_universe` (auditable entities — from Catalog or local fallback list),
  `audit_plans` (annual plan, risk-based prioritization pulling risk scores when Risk module
  present), `engagements` (scope, team, schedule, status workflow), `workpapers` (docs via
  storage + review sign-off), `findings` (severity, criteria/condition/cause/effect,
  recommendation, management response, agreed action + due), follow-up tracking.
- **Standalone:** complete audit lifecycle with local auditable-entities list.
- **Consumes:** Catalog (universe; promotion merges local universe into catalog), Risk
  (risk-based planning input; findings can raise risks), Tasks (remediation), Assessments
  (fieldwork checklists). All with declared fallbacks (plan without risk scores; local
  remediation checklist).
- **Provides:** findings feed to Management Hub; audit status widgets/reports; report
  issuance gated through the approval primitive.

### 8.6 Compliance
Requirements → policy/control mapping (per the stated scope).
- **Entities:** `requirement_sources` (regulations, standards, contracts, internal mandates —
  imported libraries [NIST public domain; ISO/AICPA as codes+paraphrase] **and fully custom
  company requirements**), `requirements` (hierarchical), `policies` (document registry:
  metadata + file/markdown, version history, owner, review cycle, approval-gated publication —
  v1 policy design carried over), `controls` (the company's control set), mapping tables
  `requirement_policies`, `requirement_controls` (the common-controls model from v1: one
  control/policy satisfies many requirements across sources), `gaps` (unmet requirements →
  actions).
- **Standalone:** requirement libraries, policy registry, mapping matrix, gap list with local
  action items.
- **Consumes:** Assessments (control self-assessment campaigns feed implementation status),
  Tasks (gap remediation), Catalog (applicability scoping: which org_units/services a
  requirement applies to), Risk (compliance gaps raise risks).
- **Provides:** `controls` point (Risk's mitigating controls), compliance-posture % widgets
  and statement-of-applicability / gap reports.

### 8.7 Management Hub
The executive layer over everything licensed.
- **Entities:** `objectives` (strategic objectives tree, owners, KPIs, period), links from
  objectives to risks/initiatives (activities)/compliance postures via `entity_links`;
  `committees` (membership), `meetings` (agenda items referencing any entity, minutes,
  decisions, actions → Tasks), consolidated executive dashboard (cross-module widgets) and
  board-pack report composition.
- **Standalone:** objectives + committee/meeting management with local action items.
- **Consumes:** read-widgets from every other module (each degrades to hidden if unlicensed);
  Tasks for meeting actions.

## 9. Platform features

### 9.1 Configurable dashboards (requirement #10)
- **Widget registry** populated from module manifests: each widget = metadata + config schema
  (zod → auto-generated config form: filters, scope, chart type) + a server data function +
  a renderer (chart/stat/table/list).
- `dashboards` (workspace, name, owner, `layout jsonb` grid) + `dashboard_widgets`
  (widget_key, config jsonb, position). Per-user home dashboard + shared/role dashboards
  (visible-to via RBAC). Drag-resize grid (react-grid-layout). Module landing pages ship a
  default dashboard; Management Hub ships the executive one.
- Widget data functions run under the **viewer's** permissions — a dashboard never leaks what
  the viewer couldn't open directly.

### 9.2 Customizable reports (requirement #11)
- **Report types** registered by modules (risk register, treatment status, SoA, gap analysis,
  audit report, board pack…). Each = parameter schema (period, scope, filters) + a
  server-rendered print-CSS template.
- `report_templates` (saved parameter sets + branding: logo, cover, header/footer from
  settings) → run now or **schedule** (worker: generate → store → notify/email). Export: PDF
  (headless Chromium), XLSX/CSV (data-level export per module list views).
- Full drag-and-drop report *builder* is explicitly v2; parameterized templates cover the
  credible 80% first.

### 9.3 Integrations framework & public API (requirements #5, #6)
- **Connector SDK** (internal interface): `{ key, category, configSchema (zod), testConnection,
  sync(ctx) }` running in the worker on schedules; credentials encrypted at rest (§11);
  per-connector sync logs surfaced in settings; connectors map external data into module sinks
  (Catalog `asset-import`, Risk vulnerability findings, etc.) with dedupe keys.
- **First connectors:** vulnerability scanning (Tenable/Nessus, Qualys — imports assets +
  vulns; vulns can raise risks), asset sources (CSV/Excel import first — honest v1 —, then
  Lansweeper/Intune), patch status (WSUS/SCCM export ingestion first). CSV import is itself a
  connector, giving every customer a day-one integration path.
- **Public REST API** `/api/v1` (OpenAPI-documented): API tokens (hashed, workspace-scoped)
  carrying **permission scopes from the same RBAC catalog** — one authorization model for
  humans and machines. Rate limiting; audit-logged like any actor.
- **Webhooks:** subscriptions on domain events (from the outbox) with HMAC-signed deliveries
  and retry.

## 10. Data architecture

- **One PostgreSQL schema for platform + all modules**; module tables prefixed by convention
  (`risk_*`, `cat_*`, `task_*`…). All licensed-or-not tables exist in every install
  (empty when unlicensed) — migrations stay uniform, promotion is in-DB, support is sane.
- **Multi-tenancy:** cloud = shared DB, `workspace_id` on every row + composite indexes;
  isolation enforced by the action wrapper + query helpers + the per-module isolation test.
  Postgres **RLS as a backstop** is a hardening milestone before scaling cloud tenants.
  On-prem = same schema, one workspace row.
- **Migrations:** drizzle-kit generated SQL, committed, forward-only; run automatically on web
  start (with advisory lock so multi-container cloud doesn't double-apply) or via
  `unisentinel migrate` CLI for cautious on-prem admins. The v1 schema-drift hazard disappears
  with `db-push.mjs` (product side) retired.
- **Backups:** cloud — RDS PITR + restore drills; on-prem — documented `pg_dump` +
  files-volume snapshot, automatic pre-upgrade dump in the upgrade script, and a
  **workspace export** (JSON/CSV bundle) for data portability (also the no-lock-in answer).
- **Search:** Postgres FTS (tsvector) per entity type feeding the global search — no
  Elasticsearch on-prem burden.

## 11. Security architecture

- **AuthZ:** RBAC engine everywhere (UI hint + mandatory server check), approval primitive for
  sensitive transitions, data-scopes schema-ready.
- **Audit:** platform-wide immutable log (§6.4) + login/security events (SSO config change,
  role change, license upload are all audited).
- **Secrets:** connector/SMTP/SSO credentials encrypted at rest (AES-256-GCM) with an
  instance master key (env/keyfile on-prem, KMS-sourced env in cloud); never returned by APIs.
- **Transport:** TLS via Caddy (bundled option) or customer's proxy; HSTS; secure cookies.
- **App hardening:** CSP, rate limiting (login + API), session listing/revocation, password
  policy + lockout, 2FA, dependency audit in CI, `npm audit`/lockfile discipline.
- **DB privilege:** app runs as a restricted role (no DDL outside migrations, no
  UPDATE/DELETE on `audit_log`) — makes the "immutable trail" claim defensible.
- **On-prem posture:** no outbound calls required (offline license, no telemetry by default —
  opt-in error reporting only), documented ports, least-privilege service accounts on Windows.
- **Pre-first-customer gate (carried from v1, updated):** isolation tests green, backups
  restore-tested, RDS proxy + verified TLS (cloud), email verification (cloud signup), license
  enforcement tested, workspace export works, security headers verified.

## 12. Build phases & milestones

Honest solo-dev sequencing: platform first (M1), then prove the **ecosystem pattern with a
sellable module trio** (M2), then package for on-prem (M3), then widen (M4–M5). Each phase
remains independently shippable and demoable.

### M1 — Platform foundation
- **Phase 0 — Repo & runtime skeleton:** npm-workspaces restructure (`git mv` website/src,
  scaffold `apps/grc`); Next standalone + Docker image (web+worker); Postgres + drizzle-kit
  migration pipeline; CI on ubuntu **and windows-latest**; `/healthz`; structured logging.
  *Demo: fresh clone → one command → empty product shell running in Docker.*
- **Phase 1 — Identity & tenancy:** workspaces, users, sessions (+ session management UI),
  local auth, password policy, 2FA, setup wizard (first admin), org_units, profile capsule,
  audit log + trigger + restricted DB role. *Demo: install, create admin, invite user, see
  audit trail.*
- **Phase 2 — RBAC engine + role builder:** permission catalog build step, roles/user_roles,
  enforcement wrapper, role-builder UI, system roles. SMTP + notification framework (in-app +
  email). *Demo: build a custom "Risk Viewer" role, watch UI/actions obey it.*
- **Phase 3 — Module framework & licensing:** manifests + registries, app drawer shell,
  entitlement service, signed license files + settings upload, `entity_links`, event
  bus/outbox, action wrapper finalized, settings framework — including workspace
  **branding settings with company logo upload** (first consumer of the pluggable
  storage driver; logo appears in the top bar and login page immediately, in report
  headers when reports land). *Demo: toggle a stub module's license, watch
  drawer/nav/permissions appear; upload a logo and see the shell rebrand.*

### M2 — Ecosystem proof: the first sellable trio
- **Phase 4 — Service Catalog** (inventory, relationships, generated diagrams, CSV import).
- **Phase 5 — Tasks & Activities** (tasks, activities, kanban/calendar, My-tasks inbox).
- **Phase 6 — Risk Management** standalone-complete (methodologies, register, heatmap,
  treatments with local fallbacks, acceptance approvals).
- **Phase 7 — Integration & promotion proof:** wire Risk↔Catalog (scope) and Risk↔Tasks
  (treatment roll-up); build the **promotion wizard** for both fallbacks; this phase is the
  template every later module copies. *Demo: buy-order simulation — start Risk standalone,
  license Catalog, promote scope items, everything re-links.*
- **Phase 8 — Dashboards v1 + first reports:** widget framework, grid dashboards, risk/catalog/
  task widgets, PDF export pipeline, 3 parameterized reports. **← First sellable bundle.**

### M3 — Deployment GA
- **Phase 9 — On-prem Linux GA:** compose bundle, upgrade script + pre-upgrade dump, air-gap
  image tarballs, install/upgrade/backup docs, versioned release process (GitHub Actions
  release workflow).
- **Phase 10 — Cloud GA:** multi-tenant hardening (RLS backstop, rate limits), workspace
  provisioning flow, entitlement admin tooling, monitoring/alerting, restore drill.
- **Phase 11 — SSO (OIDC) + API v1:** OIDC login + JIT provisioning; public REST API + tokens
  + OpenAPI docs + webhooks.

### M4 — Module build-out (each: standalone + integrations + fallbacks + promotion + widgets + reports + seeds)
- **Phase 12 — Compliance** (requirements, policies, mappings, gaps).
- **Phase 13 — Assessments** (templates, campaigns, scoring) + Compliance/Audit hooks.
- **Phase 14 — Internal Audits** (universe, plans, engagements, findings, follow-up).
- **Phase 15 — Management Hub** (objectives, committees/meetings/actions, executive dashboard).

### M5 — Enterprise depth
- **Phase 16 — Windows Server native package** (services installer, upgrade script, docs) —
  CI has kept the code Windows-clean since Phase 0, so this phase is packaging, not porting.
- **Phase 17 — Integration connectors:** Tenable/Qualys, asset/patch sources beyond CSV;
  connector health UI.
- **Phase 18 — Enterprise auth & admin:** SAML, SCIM, data-scopes enforcement, report
  scheduling polish, per-workspace branding.

## 13. Open decisions

1. **Windows native vs Docker-only at launch** — plan assumes Docker path is offered first
   and native lands in M5; if early Windows deals demand native sooner, swap Phase 16 forward.
2. **PDF engine weight** — ~~Decide at Phase 8~~ **Decided (Phase 8): pure-JS pdfkit** for the
   v1 tabular reports — zero native deps, identical output in Docker and native Windows, no
   300MB Chromium in images/installs. The report-data contract (sections of stats + tables)
   is renderer-agnostic, so a headless-Chromium print-CSS pipeline can be added later for
   high-fidelity board packs without touching module report providers.
3. **Diagram editing depth** — generated + position-override diagrams (planned) vs full
   free-form editor (big scope). Revisit after Catalog ships.
4. **Billing automation for cloud** (Stripe etc.) — out of scope until M3; manual entitlements
   suffice for design partners.
5. **Seat counting semantics** per module (any-permission-holder vs named assignment) — a
   pricing decision that should land before the first license file is issued (M2/M3 boundary).
6. **Mobile/responsive depth** — console is desktop-first; decide how far tables/kanban must
   degrade on tablet before M2 demos.

## 14. Risks

- **Scope vs one developer.** This is a multi-year platform. Mitigations baked in: platform
  primitives are built once and reused by every module (RBAC, approvals, links, events,
  widgets, reports, action wrapper); modules are mechanical after Phase 7's template; the
  M2 trio is sellable long before the full suite exists. Resist parallel half-built modules.
- **The integration matrix grows quadratically.** Discipline: modules integrate only through
  named integration points, events, and `entity_links` — never direct imports (lint-enforced).
  Every point ships with fallback + promotion or it doesn't ship.
- **On-prem supportability.** Every customer environment differs. Mitigations: Docker-first,
  minimal moving parts (Postgres + Node only), `/healthz`+`/readyz`, structured logs, a
  `support-bundle` command (versions, migration state, redacted config), restore-tested
  upgrade script.
- **Windows path erosion.** Without CI enforcement it *will* break; `windows-latest` build+test
  from Phase 0 is non-negotiable.
- **RBAC performance.** Per-request fresh permission loads across many checks: memoize per
  request, single indexed query for a user's permission set; benchmark in Phase 2, before
  every module compounds the cost.
- **Licensed-content legal risk** (unchanged from v1): ISO/AICPA text is copyrighted — ship
  codes + paraphrases; NIST is public domain. A compliance vendor cannot get this wrong.
- **Tenant isolation** (cloud): app-level scoping until the RLS backstop lands (Phase 10);
  isolation tests are part of every module's definition-of-done from day one.
- **Modified-Next dependency:** the product pins Next and upgrades deliberately; the
  `AGENTS.md` read-the-docs-first rule applies to `apps/grc` as it did to `website/`.
- **Promotion-wizard correctness:** promotion rewrites live references — always dry-run
  preview, idempotent, keeps source rows marked-migrated for audit, covered by tests with
  messy duplicate data.
