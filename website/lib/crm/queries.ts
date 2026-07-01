import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies, contacts, deals, activities,
  type Company, type Contact, type Deal, type Activity,
} from "@/lib/db/schema";

// All reads are scoped to the owning user so a workspace only sees its own data.

export function listCompanies(ownerId: string): Promise<Company[]> {
  return db.select().from(companies).where(eq(companies.ownerId, ownerId)).orderBy(asc(companies.name));
}

export function listContacts(ownerId: string): Promise<Contact[]> {
  return db.select().from(contacts).where(eq(contacts.ownerId, ownerId)).orderBy(asc(contacts.name));
}

export function listDeals(ownerId: string): Promise<Deal[]> {
  return db.select().from(deals).where(eq(deals.ownerId, ownerId)).orderBy(desc(deals.value));
}

export function listActivities(ownerId: string): Promise<Activity[]> {
  return db.select().from(activities).where(eq(activities.ownerId, ownerId)).orderBy(desc(activities.createdAt));
}

/** id -> name lookup for resolving companyId references in the UI. */
export function companyNameMap(rows: Company[]): Record<string, string> {
  return Object.fromEntries(rows.map((c) => [c.id, c.name]));
}

export interface DashboardData {
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  pipelineValue: number;
  weightedPipeline: number;
  wonValue: number;
}

/** Everything the dashboard needs, fetched in parallel and reduced to metrics. */
export async function getDashboardData(ownerId: string): Promise<DashboardData> {
  const [companyRows, contactRows, dealRows, activityRows] = await Promise.all([
    listCompanies(ownerId),
    listContacts(ownerId),
    listDeals(ownerId),
    listActivities(ownerId),
  ]);

  const openDeals = dealRows.filter((d) => d.stage !== "Closed Won");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const wonValue = dealRows.filter((d) => d.stage === "Closed Won").reduce((s, d) => s + d.value, 0);
  const weightedPipeline = Math.round(
    openDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0),
  );

  return {
    companies: companyRows,
    contacts: contactRows,
    deals: dealRows,
    activities: activityRows,
    pipelineValue,
    weightedPipeline,
    wonValue,
  };
}
