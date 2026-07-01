import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/** Application users (auth). Each user owns their own CRM workspace (see below). */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// CRM. Every row is scoped to the user that owns it via `ownerId` (FK -> users)
// so each workspace only ever sees its own data. String-union columns (status,
// stage, riskTier, type) are kept as plain text and typed at the query layer.
// SQLite has no array type, so `frameworks` is a JSON-encoded text column.
// ---------------------------------------------------------------------------

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  size: text("size").notNull(),
  location: text("location").notNull(),
  riskTier: text("risk_tier").notNull().default("Medium"),
  status: text("status").notNull().default("Prospect"),
  owner: text("owner").notNull(),
  frameworks: text("frameworks", { mode: "json" }).notNull().$type<string[]>().default([]),
  arr: real("arr").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("Lead"),
  lastTouch: text("last_touch").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const deals = sqliteTable("deals", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: real("value").notNull().default(0),
  stage: text("stage").notNull().default("Lead"),
  owner: text("owner").notNull(),
  probability: integer("probability").notNull().default(0),
  closeDate: text("close_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  contact: text("contact").notNull(),
  when: text("when").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
