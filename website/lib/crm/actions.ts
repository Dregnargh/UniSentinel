"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { companies, contacts, deals, activities } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";

export type ActionState = { ok?: boolean; error?: string };

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";

// Refresh the CRM list pages + the dashboard (which aggregates everything).
function revalidateCrm(page: string) {
  revalidatePath(page);
  revalidatePath("/app");
}

/** Ensure a companyId belongs to the current owner before referencing it. */
async function assertOwnedCompany(companyId: string, ownerId: string) {
  const rows = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.ownerId, ownerId)))
    .limit(1);
  if (!rows.length) throw new Error("Company not found");
}

// ---- Companies ------------------------------------------------------------

const companySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  industry: z.string().trim().min(1, "Industry is required."),
  size: z.string().trim().min(1, "Size is required."),
  location: z.string().trim().min(1, "Location is required."),
  riskTier: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Prospect", "Active", "Customer", "Churned"]),
  owner: z.string().trim().min(1, "Owner is required."),
  frameworks: z.string().optional().default(""),
  arr: z.coerce.number().min(0).default(0),
});

export async function createCompany(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { sub: ownerId } = await requireSession();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  await db.insert(companies).values({
    id: crypto.randomUUID(),
    ownerId,
    name: d.name,
    industry: d.industry,
    size: d.size,
    location: d.location,
    riskTier: d.riskTier,
    status: d.status,
    owner: d.owner,
    frameworks: d.frameworks.split(",").map((s) => s.trim()).filter(Boolean),
    arr: d.arr,
    createdAt: new Date(),
  });
  revalidateCrm("/app/companies");
  return { ok: true };
}

export async function deleteCompany(id: string): Promise<void> {
  const { sub: ownerId } = await requireSession();
  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.ownerId, ownerId)));
  revalidateCrm("/app/companies");
}

// ---- Contacts -------------------------------------------------------------

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  title: z.string().trim().min(1, "Title is required."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().min(1, "Phone is required."),
  companyId: z.string().trim().min(1, "Choose a company."),
  status: z.enum(["Lead", "Engaged", "Champion", "Customer"]),
  lastTouch: z.string().trim().min(1).default("today"),
});

export async function createContact(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { sub: ownerId } = await requireSession();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  await assertOwnedCompany(d.companyId, ownerId);
  await db.insert(contacts).values({
    id: crypto.randomUUID(),
    ownerId,
    companyId: d.companyId,
    name: d.name,
    title: d.title,
    email: d.email,
    phone: d.phone,
    status: d.status,
    lastTouch: d.lastTouch,
    createdAt: new Date(),
  });
  revalidateCrm("/app/contacts");
  return { ok: true };
}

export async function deleteContact(id: string): Promise<void> {
  const { sub: ownerId } = await requireSession();
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.ownerId, ownerId)));
  revalidateCrm("/app/contacts");
}

// ---- Deals ----------------------------------------------------------------

const dealSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  companyId: z.string().trim().min(1, "Choose a company."),
  value: z.coerce.number().min(0).default(0),
  stage: z.enum(["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"]),
  owner: z.string().trim().min(1, "Owner is required."),
  probability: z.coerce.number().min(0).max(100).default(0),
  closeDate: z.string().trim().min(1, "Close date is required."),
});

export async function createDeal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { sub: ownerId } = await requireSession();
  const parsed = dealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  await assertOwnedCompany(d.companyId, ownerId);
  await db.insert(deals).values({
    id: crypto.randomUUID(),
    ownerId,
    companyId: d.companyId,
    name: d.name,
    value: d.value,
    stage: d.stage,
    owner: d.owner,
    probability: d.probability,
    closeDate: d.closeDate,
    createdAt: new Date(),
  });
  revalidateCrm("/app/deals");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<void> {
  const { sub: ownerId } = await requireSession();
  await db.delete(deals).where(and(eq(deals.id, id), eq(deals.ownerId, ownerId)));
  revalidateCrm("/app/deals");
}

// ---- Activities -----------------------------------------------------------

const activitySchema = z.object({
  type: z.enum(["call", "email", "meeting", "task", "note"]),
  title: z.string().trim().min(1, "Title is required."),
  contact: z.string().trim().min(1, "Contact is required."),
  companyId: z.string().trim().min(1, "Choose a company."),
  when: z.string().trim().min(1, "When is required."),
});

export async function createActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { sub: ownerId } = await requireSession();
  const parsed = activitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  await assertOwnedCompany(d.companyId, ownerId);
  await db.insert(activities).values({
    id: crypto.randomUUID(),
    ownerId,
    companyId: d.companyId,
    type: d.type,
    title: d.title,
    contact: d.contact,
    when: d.when,
    done: false,
    createdAt: new Date(),
  });
  revalidateCrm("/app/activities");
  return { ok: true };
}

export async function toggleActivityDone(id: string, done: boolean): Promise<void> {
  const { sub: ownerId } = await requireSession();
  await db
    .update(activities)
    .set({ done })
    .where(and(eq(activities.id, id), eq(activities.ownerId, ownerId)));
  revalidateCrm("/app/activities");
}

export async function deleteActivity(id: string): Promise<void> {
  const { sub: ownerId } = await requireSession();
  await db.delete(activities).where(and(eq(activities.id, id), eq(activities.ownerId, ownerId)));
  revalidateCrm("/app/activities");
}
