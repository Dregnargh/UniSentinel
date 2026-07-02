// Demo/staging seed CLI (framework-free, bundled to dist/seed-demo.cjs).
//   docker compose run --rm web seed-demo        # in the self-hosted stack
//   node dist/seed-demo.cjs                      # local dev (DATABASE_URL set)
//
// Populates a FRESH instance (no workspaces yet) with a realistic "day 90"
// workspace across all shipped modules, so staging reviews never start from
// an empty screen. Refuses to run on a non-empty instance — this is a
// provisioning tool, not a fixture loader. Entitlements are inserted
// directly (source "manual"); applying a real license later replaces them.
import { sql } from "drizzle-orm";
import {
  catAssets,
  catDataFlows,
  catRelationships,
  catServices,
  entityLinks,
  moduleEntitlements,
  notifications,
  orgUnits,
  rolePermissions,
  roles,
  rskAssessments,
  rskRisks,
  rskScopeItems,
  rskTreatmentActions,
  settings,
  tskActivities,
  tskTasks,
  users,
  workspaces,
} from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { hashPassword } from "@/platform/auth/password";
import { assignRole, createSystemRoles } from "@/platform/roles/system";
import { createLogger } from "@/platform/log";

const log = createLogger("seed-demo");

const id = () => crypto.randomUUID();
const days = (n: number) => new Date(Date.now() + n * 86_400_000);

function randomPassword(): string {
  // Readable but strong enough for a staging box: Demo-xxxxxxxxxx
  const raw = crypto.getRandomValues(new Uint8Array(8));
  return `Demo-${Buffer.from(raw).toString("hex").slice(0, 12)}`;
}

async function main(): Promise<void> {
  const { db, pool } = getDb();
  try {
    const existing = await db.select({ count: sql<number>`count(*)::int` }).from(workspaces);
    if ((existing[0]?.count ?? 0) > 0) {
      log.error("instance is not empty — seed-demo only provisions fresh instances");
      console.error("\nThis instance already has a workspace. seed-demo provisions FRESH");
      console.error("staging instances only. Reset the database first (staging docs).");
      process.exitCode = 1;
      return;
    }

    const password = process.env.SEED_DEMO_PASSWORD || randomPassword();
    const now = new Date();
    const ws = id();

    // ---- Workspace, org units, users, roles -----------------------------------
    await db.insert(workspaces).values({ id: ws, name: "Acme Corporation (Demo)", createdAt: now });

    const corp = id();
    const itOps = id();
    const engineering = id();
    const finance = id();
    await db.insert(orgUnits).values([
      { id: corp, workspaceId: ws, name: "Acme Corporation", kind: "company", sortOrder: 0, createdAt: now },
      { id: itOps, workspaceId: ws, parentId: corp, name: "IT Operations", kind: "department", sortOrder: 1, createdAt: now },
      { id: engineering, workspaceId: ws, parentId: corp, name: "Engineering", kind: "department", sortOrder: 2, createdAt: now },
      { id: finance, workspaceId: ws, parentId: corp, name: "Finance", kind: "department", sortOrder: 3, createdAt: now },
    ]);

    const passwordHash = await hashPassword(password);
    const alice = id();
    const riley = id();
    const taylor = id();
    await db.insert(users).values([
      { id: alice, workspaceId: ws, name: "Alice Demo", email: "demo-admin@acme.test", passwordHash, active: true, createdAt: now, updatedAt: now },
      { id: riley, workspaceId: ws, name: "Riley Riskman", email: "demo-risk@acme.test", passwordHash, active: true, createdAt: now, updatedAt: now },
      { id: taylor, workspaceId: ws, name: "Taylor Tasker", email: "demo-tasks@acme.test", passwordHash, active: true, createdAt: now, updatedAt: now },
    ]);

    const { adminRoleId, memberRoleId } = await createSystemRoles(db, ws);
    const riskManager = id();
    const taskWorker = id();
    await db.insert(roles).values([
      { id: riskManager, workspaceId: ws, name: "Risk Manager", description: "Owns the risk register and methodology.", isSystem: false, createdAt: now, updatedAt: now },
      { id: taskWorker, workspaceId: ws, name: "Task Worker", description: "Works the task queue.", isSystem: false, createdAt: now, updatedAt: now },
    ]);
    const perms = (roleId: string, list: string[]) =>
      list.map((permission) => ({ id: id(), roleId, permission }));
    await db.insert(rolePermissions).values([
      ...perms(riskManager, [
        "risk.risks.view",
        "risk.risks.manage",
        "risk.risks.approve",
        "risk.methodology.manage",
        "catalog.services.view",
        "catalog.assets.view",
        "tasks.tasks.view",
        "tasks.tasks.manage",
        "tasks.activities.view",
      ]),
      ...perms(taskWorker, ["tasks.tasks.view", "tasks.tasks.manage", "tasks.activities.view"]),
    ]);
    await assignRole(db, ws, alice, adminRoleId);
    await assignRole(db, ws, riley, riskManager);
    await assignRole(db, ws, taylor, taskWorker);
    await assignRole(db, ws, taylor, memberRoleId);

    // ---- Entitlements (all shipped modules, one year) ----------------------------
    await db.insert(moduleEntitlements).values(
      ["catalog", "tasks", "risk"].map((moduleKey) => ({
        id: id(),
        workspaceId: ws,
        moduleKey,
        status: "active",
        seats: null,
        expiresAt: days(365),
        source: "manual",
        createdAt: now,
        updatedAt: now,
      })),
    );

    // ---- Service Catalog -----------------------------------------------------------
    const svc = {
      billing: id(),
      payments: id(),
      hr: id(),
      dwh: id(),
      website: id(),
    };
    await db.insert(catServices).values([
      { id: svc.billing, workspaceId: ws, name: "Customer Billing", description: "Invoicing and payment processing.", criticality: "critical", status: "active", ownerUserId: alice, orgUnitId: finance, createdAt: now, updatedAt: now },
      { id: svc.payments, workspaceId: ws, name: "Payments API", description: "External payment gateway integration.", criticality: "high", status: "active", ownerUserId: riley, orgUnitId: engineering, createdAt: now, updatedAt: now },
      { id: svc.hr, workspaceId: ws, name: "HR Portal", description: "Employee self-service.", criticality: "medium", status: "active", orgUnitId: corp, createdAt: now, updatedAt: now },
      { id: svc.dwh, workspaceId: ws, name: "Data Warehouse", description: "Analytics and reporting.", criticality: "high", status: "active", ownerUserId: alice, orgUnitId: itOps, createdAt: now, updatedAt: now },
      { id: svc.website, workspaceId: ws, name: "Corporate Website", description: "Public marketing site.", criticality: "low", status: "active", createdAt: now, updatedAt: now },
    ]);
    const asset = {
      coreDb: id(),
      firewall: id(),
      pii: id(),
      nas: id(),
      erp: id(),
      laptops: id(),
      s3: id(),
      hq: id(),
    };
    await db.insert(catAssets).values([
      { id: asset.coreDb, workspaceId: ws, name: "core-db-01", type: "software", description: "Primary PostgreSQL cluster.", location: "eu-west-1", classification: "restricted", status: "active", ownerUserId: alice, attributes: { engine: "postgres16", ha: "multi-az" }, createdAt: now, updatedAt: now },
      { id: asset.firewall, workspaceId: ws, name: "edge-firewall", type: "hardware", description: "Perimeter firewall pair.", location: "HQ server room", classification: "confidential", status: "active", attributes: { vendor: "Fortinet", model: "FG-200F" }, createdAt: now, updatedAt: now },
      { id: asset.pii, workspaceId: ws, name: "customer-pii", type: "data", description: "Customer personal data set.", classification: "restricted", status: "active", ownerUserId: riley, attributes: { records: "1.2M" }, createdAt: now, updatedAt: now },
      { id: asset.nas, workspaceId: ws, name: "backup-nas", type: "hardware", description: "On-site backup storage.", location: "HQ server room", classification: "confidential", status: "active", createdAt: now, updatedAt: now },
      { id: asset.erp, workspaceId: ws, name: "erp-app", type: "software", description: "Finance ERP.", classification: "confidential", status: "active", ownerUserId: alice, createdAt: now, updatedAt: now },
      { id: asset.laptops, workspaceId: ws, name: "laptop-fleet", type: "hardware", description: "Employee laptops (240 devices).", classification: "internal", status: "active", createdAt: now, updatedAt: now },
      { id: asset.s3, workspaceId: ws, name: "s3-archive", type: "cloud", description: "Long-term object archive.", location: "eu-west-1", classification: "confidential", status: "active", createdAt: now, updatedAt: now },
      { id: asset.hq, workspaceId: ws, name: "hq-building", type: "facility", description: "Headquarters.", location: "Amsterdam", classification: "internal", status: "active", createdAt: now, updatedAt: now },
    ]);
    await db.insert(catRelationships).values([
      { id: id(), workspaceId: ws, sourceKind: "asset", sourceId: asset.coreDb, targetKind: "service", targetId: svc.billing, kind: "supports", createdAt: now },
      { id: id(), workspaceId: ws, sourceKind: "asset", sourceId: asset.coreDb, targetKind: "service", targetId: svc.payments, kind: "supports", createdAt: now },
      { id: id(), workspaceId: ws, sourceKind: "asset", sourceId: asset.coreDb, targetKind: "asset", targetId: asset.pii, kind: "stores", createdAt: now },
      { id: id(), workspaceId: ws, sourceKind: "asset", sourceId: asset.nas, targetKind: "asset", targetId: asset.coreDb, kind: "connects_to", createdAt: now },
      { id: id(), workspaceId: ws, sourceKind: "service", sourceId: svc.dwh, targetKind: "asset", targetId: asset.coreDb, kind: "depends_on", createdAt: now },
    ]);
    await db.insert(catDataFlows).values([
      { id: id(), workspaceId: ws, sourceKind: "service", sourceId: svc.billing, targetKind: "service", targetId: svc.dwh, name: "Nightly billing export", dataClassification: "confidential", protocol: "TLS/SFTP", createdAt: now },
      { id: id(), workspaceId: ws, sourceKind: "asset", sourceId: asset.coreDb, targetKind: "asset", targetId: asset.nas, name: "Backups", dataClassification: "restricted", protocol: "TLS", createdAt: now },
    ]);

    // ---- Tasks & Activities ----------------------------------------------------------
    const hardening = id();
    const soc2 = id();
    await db.insert(tskActivities).values([
      { id: hardening, workspaceId: ws, name: "Q3 Security Hardening", description: "Close the top findings from the spring review.", status: "in_progress", ownerUserId: riley, startDate: days(-30), dueDate: days(45), createdAt: days(-30), updatedAt: now },
      { id: soc2, workspaceId: ws, name: "SOC 2 Readiness", description: "Evidence collection and control walkthroughs.", status: "planned", ownerUserId: alice, startDate: days(10), dueDate: days(120), createdAt: days(-10), updatedAt: now },
    ]);
    const task = (t: {
      title: string; status?: string; priority?: string; assignee?: string | null;
      due?: number; activity?: string | null; done?: boolean; origin?: { type: string; id: string };
    }) => ({
      id: id(),
      workspaceId: ws,
      title: t.title,
      description: "",
      status: t.done ? "done" : (t.status ?? "todo"),
      priority: t.priority ?? "medium",
      assigneeUserId: t.assignee ?? null,
      activityId: t.activity ?? null,
      dueDate: t.due !== undefined ? days(t.due) : null,
      completedAt: t.done ? days(-2) : null,
      originType: t.origin?.type ?? null,
      originId: t.origin?.id ?? null,
      createdAt: days(-14),
      updatedAt: now,
    });

    // ---- Risk Management ----------------------------------------------------------------
    const risk = (r: {
      ref: string; title: string; category: string; l: number; i: number;
      rl?: number; ri?: number; status?: string; owner?: string; strategy?: string;
      notes?: string; accepted?: boolean; org?: string;
    }) => ({
      id: id(),
      workspaceId: ws,
      ref: r.ref,
      title: r.title,
      description: "",
      category: r.category,
      status: r.accepted ? "accepted" : (r.status ?? "assessed"),
      ownerUserId: r.owner ?? riley,
      orgUnitId: r.org ?? itOps,
      inherentLikelihood: r.l,
      inherentImpact: r.i,
      residualLikelihood: r.rl ?? null,
      residualImpact: r.ri ?? null,
      treatmentStrategy: r.strategy ?? null,
      treatmentNotes: r.notes ?? "",
      acceptedByName: r.accepted ? "Alice Demo" : null,
      acceptedAt: r.accepted ? days(-5) : null,
      createdAt: days(-60),
      updatedAt: now,
    });
    const risks = [
      risk({ ref: "RSK-1", title: "Loss of customer database", category: "Availability", l: 5, i: 4, rl: 2, ri: 3, status: "in_treatment", strategy: "mitigate", notes: "Encryption at rest + tested restores." }),
      risk({ ref: "RSK-2", title: "Ransomware via phishing", category: "Security", l: 4, i: 4, status: "in_treatment", strategy: "mitigate", notes: "Awareness campaign + EDR rollout." }),
      risk({ ref: "RSK-3", title: "Payment gateway outage", category: "Availability", l: 3, i: 4, owner: riley, org: engineering }),
      risk({ ref: "RSK-4", title: "GDPR data-retention breach", category: "Compliance", l: 4, i: 2, rl: 2, ri: 2, status: "in_treatment", strategy: "mitigate" }),
      risk({ ref: "RSK-5", title: "Office printer outage", category: "Availability", l: 2, i: 2, accepted: true, strategy: "accept", notes: "Cost of redundancy exceeds impact." }),
      risk({ ref: "RSK-6", title: "Key-person dependency (payments)", category: "Operational", l: 3, i: 3, owner: alice }),
      risk({ ref: "RSK-7", title: "Vendor SLA miss — hosting provider", category: "Vendor", l: 5, i: 2, status: "assessed" }),
      risk({ ref: "RSK-8", title: "Stale offboarding removes access late", category: "Security", l: 1, i: 2, status: "draft" }),
    ];
    await db.insert(rskRisks).values(risks);
    const riskId = (ref: string) => risks.find((r) => r.ref === ref)!.id;

    await db.insert(rskAssessments).values(
      risks.flatMap((r) => {
        const rows = [
          { id: id(), workspaceId: ws, riskId: r.id, kind: "inherent", likelihood: r.inherentLikelihood, impact: r.inherentImpact, note: "Initial assessment", assessedByName: "Riley Riskman", createdAt: days(-60) },
        ];
        if (r.residualLikelihood && r.residualImpact) {
          rows.push({ id: id(), workspaceId: ws, riskId: r.id, kind: "residual", likelihood: r.residualLikelihood, impact: r.residualImpact, note: "After current controls", assessedByName: "Riley Riskman", createdAt: days(-20) });
        }
        return rows;
      }),
    );

    // Risk ↔ Catalog scope (the enriched path, via entity_links).
    const affects = (ref: string, targetType: string, targetId: string) => ({
      id: id(),
      workspaceId: ws,
      sourceType: "risk:risk",
      sourceId: riskId(ref),
      targetType,
      targetId,
      linkKind: "affects",
      createdBy: riley,
      createdAt: days(-30),
    });
    await db.insert(entityLinks).values([
      affects("RSK-1", "catalog:asset", asset.coreDb),
      affects("RSK-1", "catalog:asset", asset.pii),
      affects("RSK-1", "catalog:service", svc.billing),
      affects("RSK-3", "catalog:service", svc.payments),
      affects("RSK-4", "catalog:asset", asset.pii),
    ]);

    // Tasks, including treatment tasks spawned from risks (origin links).
    await db.insert(tskTasks).values([
      task({ title: "Enable DB encryption at rest", done: true, priority: "high", assignee: taylor, activity: hardening, origin: { type: "risk:risk", id: riskId("RSK-1") } }),
      task({ title: "Quarterly restore test", status: "in_progress", priority: "high", assignee: taylor, due: 7, activity: hardening, origin: { type: "risk:risk", id: riskId("RSK-1") } }),
      task({ title: "Roll out EDR to laptop fleet", status: "in_progress", priority: "urgent", assignee: taylor, due: 14, activity: hardening, origin: { type: "risk:risk", id: riskId("RSK-2") } }),
      task({ title: "Phishing awareness campaign", status: "todo", priority: "medium", assignee: riley, due: 21, activity: hardening, origin: { type: "risk:risk", id: riskId("RSK-2") } }),
      task({ title: "Document data-retention schedule", status: "blocked", priority: "medium", assignee: alice, due: -3, origin: { type: "risk:risk", id: riskId("RSK-4") } }),
      task({ title: "Collect access-review evidence", status: "todo", priority: "medium", assignee: taylor, due: 30, activity: soc2 }),
      task({ title: "Draft vendor management policy", status: "todo", priority: "low", assignee: alice, due: 40, activity: soc2 }),
      task({ title: "Fix TLS config on staging LB", done: true, priority: "medium", assignee: taylor, activity: hardening }),
      task({ title: "Renew firewall support contract", status: "todo", priority: "high", assignee: alice, due: -5 }),
      task({ title: "Update on-call rota", status: "todo", priority: "low", assignee: riley, due: 10 }),
    ]);

    // Local fallbacks left UNPROMOTED on purpose: the promotion banner +
    // wizard are part of the staging demo path.
    await db.insert(rskScopeItems).values([
      { id: id(), workspaceId: ws, riskId: riskId("RSK-2"), name: "erp-app", kind: "asset", notes: "Named before Catalog was licensed.", createdAt: days(-45) },
      { id: id(), workspaceId: ws, riskId: riskId("RSK-2"), name: "Mail Gateway", kind: "service", notes: "", createdAt: days(-45) },
    ]);
    await db.insert(rskTreatmentActions).values([
      { id: id(), workspaceId: ws, riskId: riskId("RSK-2"), title: "Block macro-enabled attachments", done: true, dueDate: days(-10), createdAt: days(-45) },
      { id: id(), workspaceId: ws, riskId: riskId("RSK-2"), title: "Tabletop exercise with IT Ops", done: false, dueDate: days(20), createdAt: days(-45) },
    ]);

    // ---- Welcome notification + seed marker ---------------------------------------
    await db.insert(notifications).values({
      id: id(),
      workspaceId: ws,
      userId: alice,
      type: "demo.welcome",
      title: "Welcome to the demo workspace",
      body: "Seeded with catalog, tasks and risks — RSK-2 has unpromoted local data so you can try the promotion wizard.",
      href: "/m/risk/register",
      createdAt: now,
    });
    await db.insert(settings).values({
      id: id(),
      workspaceId: ws,
      namespace: "demo",
      key: "seeded",
      value: { at: now.toISOString(), version: process.env.APP_VERSION ?? "dev" },
      updatedAt: now,
    });

    log.info("demo workspace seeded", { workspace: ws });
    console.log("\n  Demo workspace seeded: Acme Corporation (Demo)");
    console.log("  ------------------------------------------------");
    console.log("  Administrator:  demo-admin@acme.test");
    console.log("  Risk Manager:   demo-risk@acme.test");
    console.log("  Task Worker:    demo-tasks@acme.test");
    console.log(`  Password (all): ${password}`);
    console.log("  ------------------------------------------------");
    console.log("  Modules licensed: catalog, tasks, risk (365 days, source: manual seed)");
    console.log("  Try: dashboard widgets, /reports PDFs, and the promotion");
    console.log("  banner on the risk register (RSK-2 has local fallback data).\n");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("seed-demo failed:", err);
  process.exit(1);
});
