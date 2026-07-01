import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Workspaces & users. A workspace is a shared team space; every user belongs to
// one workspace (users.workspaceId) and CRM data is scoped to the workspace, so
// members of the same workspace collaborate on the same records. `role` is the
// user's role within their workspace (admin | member).
// ---------------------------------------------------------------------------

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// CRM. Every row is scoped to a workspace via `workspaceId` (FK -> workspaces)
// so all members of a workspace share the data. The free-text `owner` field is
// display-only (e.g. "Maya Chen"). String-union columns (status, stage,
// riskTier, type) are plain text, typed at the query layer. `frameworks` is a
// jsonb column (native Postgres JSON).
// ---------------------------------------------------------------------------

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  size: text("size").notNull(),
  location: text("location").notNull(),
  riskTier: text("risk_tier").notNull().default("Medium"),
  status: text("status").notNull().default("Prospect"),
  owner: text("owner").notNull(),
  frameworks: jsonb("frameworks").notNull().$type<string[]>().default([]),
  arr: doublePrecision("arr").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("Lead"),
  lastTouch: text("last_touch").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: doublePrecision("value").notNull().default(0),
  stage: text("stage").notNull().default("Lead"),
  owner: text("owner").notNull(),
  probability: integer("probability").notNull().default(0),
  closeDate: text("close_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  contact: text("contact").notNull(),
  when: text("when").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
