import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { orgUnits, users, workspaces } from "./core";

// ---------------------------------------------------------------------------
// Service Catalog module (cat_*). The provider hub: services/processes, the
// asset inventory, typed relationships and data flows. Other modules reference
// these ONLY through entity_links ("catalog:service" / "catalog:asset").
// Enum-ish columns are plain text validated by zod at the action layer.
// User references use SET NULL — catalog records outlive their owners.
// ---------------------------------------------------------------------------

export const catServices = pgTable(
  "cat_services",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    // low | medium | high | critical
    criticality: text("criticality").notNull().default("medium"),
    // active | planned | retired
    status: text("status").notNull().default("active"),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    orgUnitId: text("org_unit_id").references(() => orgUnits.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_cat_services_workspace").on(t.workspaceId)],
);

export type CatService = typeof catServices.$inferSelect;
export type NewCatService = typeof catServices.$inferInsert;

export const catAssets = pgTable(
  "cat_assets",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // hardware | software | data | people | facility | cloud
    type: text("type").notNull(),
    description: text("description").notNull().default(""),
    location: text("location").notNull().default(""),
    // public | internal | confidential | restricted
    classification: text("classification").notNull().default("internal"),
    // active | planned | retired
    status: text("status").notNull().default("active"),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    // Free typed attributes (e.g. ip, vendor, version) — templates per asset
    // type become a settings panel later.
    attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_cat_assets_workspace").on(t.workspaceId),
    index("idx_cat_assets_type").on(t.workspaceId, t.type),
  ],
);

export type CatAsset = typeof catAssets.$inferSelect;
export type NewCatAsset = typeof catAssets.$inferInsert;

// Typed edges between catalog entities (service or asset endpoints), feeding
// the generated network map. Endpoint integrity is enforced at the action
// layer (polymorphic within the module by design).
export const catRelationships = pgTable(
  "cat_relationships",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceKind: text("source_kind").notNull(), // service | asset
    sourceId: text("source_id").notNull(),
    targetKind: text("target_kind").notNull(),
    targetId: text("target_id").notNull(),
    // hosts | connects_to | stores | processes | depends_on | supports
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_cat_relationships_workspace").on(t.workspaceId),
    uniqueIndex("uq_cat_relationships").on(
      t.workspaceId,
      t.sourceKind,
      t.sourceId,
      t.targetKind,
      t.targetId,
      t.kind,
    ),
  ],
);

export type CatRelationship = typeof catRelationships.$inferSelect;

// Data flows: who sends what to whom, with classification — feeds the
// data-flow view and later the compliance applicability analysis.
export const catDataFlows = pgTable(
  "cat_data_flows",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceKind: text("source_kind").notNull(),
    sourceId: text("source_id").notNull(),
    targetKind: text("target_kind").notNull(),
    targetId: text("target_id").notNull(),
    name: text("name").notNull().default(""),
    // public | internal | confidential | restricted
    dataClassification: text("data_classification").notNull().default("internal"),
    protocol: text("protocol").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_cat_data_flows_workspace").on(t.workspaceId)],
);

export type CatDataFlow = typeof catDataFlows.$inferSelect;
