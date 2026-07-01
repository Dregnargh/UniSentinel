import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
} from "drizzle-orm/pg-core";

/** Application users (auth). Each user owns their own CRM workspace (see below). */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// CRM. Every row is scoped to the user that owns it via `ownerId` (FK -> users)
// so each workspace only ever sees its own data. String-union columns (status,
// stage, riskTier, type) are kept as plain text and typed at the query layer.
// `frameworks` is a jsonb column (native Postgres JSON).
// ---------------------------------------------------------------------------

export const companies = pgTable("companies", {
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
  frameworks: jsonb("frameworks").notNull().$type<string[]>().default([]),
  arr: doublePrecision("arr").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const contacts = pgTable("contacts", {
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
