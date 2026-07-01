import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  companies, contacts, deals, activities,
  type Company, type Contact, type Deal, type Activity,
} from "@/lib/db/schema";

// All reads are scoped to the workspace so members share the same data.

export function listCompanies(workspaceId: string): Promise<Company[]> {
  return db.select().from(companies).where(eq(companies.workspaceId, workspaceId)).orderBy(asc(companies.name));
}

export function listContacts(workspaceId: string): Promise<Contact[]> {
  return db.select().from(contacts).where(eq(contacts.workspaceId, workspaceId)).orderBy(asc(contacts.name));
}

export function listDeals(workspaceId: string): Promise<Deal[]> {
  return db.select().from(deals).where(eq(deals.workspaceId, workspaceId)).orderBy(desc(deals.value));
}

export function listActivities(workspaceId: string): Promise<Activity[]> {
  return db.select().from(activities).where(eq(activities.workspaceId, workspaceId)).orderBy(desc(activities.createdAt));
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
export async function getDashboardData(workspaceId: string): Promise<DashboardData> {
  const [companyRows, contactRows, dealRows, activityRows] = await Promise.all([
    listCompanies(workspaceId),
    listContacts(workspaceId),
    listDeals(workspaceId),
    listActivities(workspaceId),
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
