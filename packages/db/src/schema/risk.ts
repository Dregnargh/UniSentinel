import { boolean, index, pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { orgUnits, users, workspaces } from "./core";

// ---------------------------------------------------------------------------
// Risk Management module (rsk_*). The methodology (3×3..5×5 scales, labels,
// band thresholds) lives in the settings framework; risks store raw level
// numbers and are scored/banded at read time. Scope items and treatment
// actions are the STANDALONE FALLBACKS — deliberately shaped for promotion to
// Service Catalog references / Tasks module tasks when those are licensed
// (Phase 7 promotion wizard).
// ---------------------------------------------------------------------------

export const rskRisks = pgTable(
  "rsk_risks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    ref: text("ref").notNull(), // RSK-1, RSK-2, … per workspace
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default(""),
    // draft | assessed | in_treatment | accepted | closed
    status: text("status").notNull().default("draft"),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    orgUnitId: text("org_unit_id").references(() => orgUnits.id, { onDelete: "set null" }),
    inherentLikelihood: integer("inherent_likelihood").notNull(),
    inherentImpact: integer("inherent_impact").notNull(),
    residualLikelihood: integer("residual_likelihood"),
    residualImpact: integer("residual_impact"),
    // accept | mitigate | transfer | avoid (null until decided)
    treatmentStrategy: text("treatment_strategy"),
    treatmentNotes: text("treatment_notes").notNull().default(""),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    // Acceptance record (actor snapshotted; approval-gated action).
    acceptedByName: text("accepted_by_name"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_rsk_risks_workspace").on(t.workspaceId),
    uniqueIndex("uq_rsk_risks_ref").on(t.workspaceId, t.ref),
  ],
);

export type RskRisk = typeof rskRisks.$inferSelect;

// Standalone scope fallback: what the risk affects. Promoted to entity_links
// against catalog:service/catalog:asset when Service Catalog is licensed.
export const rskScopeItems = pgTable(
  "rsk_scope_items",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    riskId: text("risk_id")
      .notNull()
      .references(() => rskRisks.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // service | asset | process | other — mirrors catalog kinds for promotion.
    kind: text("kind").notNull().default("other"),
    notes: text("notes").notNull().default(""),
    // Set when the promotion wizard converts this row into a catalog link.
    promotedTo: text("promoted_to"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_rsk_scope_items_risk").on(t.riskId)],
);

export type RskScopeItem = typeof rskScopeItems.$inferSelect;

// Standalone treatment checklist fallback. Promoted to Tasks-module tasks
// (origin risk:risk) when Tasks is licensed.
export const rskTreatmentActions = pgTable(
  "rsk_treatment_actions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    riskId: text("risk_id")
      .notNull()
      .references(() => rskRisks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    dueDate: timestamp("due_date", { withTimezone: true }),
    promotedTo: text("promoted_to"), // task id after promotion
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_rsk_treatment_actions_risk").on(t.riskId)],
);

export type RskTreatmentAction = typeof rskTreatmentActions.$inferSelect;

// Point-in-time assessment history (inherent and residual) for trends.
export const rskAssessments = pgTable(
  "rsk_assessments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    riskId: text("risk_id")
      .notNull()
      .references(() => rskRisks.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // inherent | residual
    likelihood: integer("likelihood").notNull(),
    impact: integer("impact").notNull(),
    note: text("note").notNull().default(""),
    assessedByName: text("assessed_by_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_rsk_assessments_risk").on(t.riskId)],
);

export type RskAssessment = typeof rskAssessments.$inferSelect;
