"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { moduleEntitlements } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import { guardAction } from "../rbac/guard";
import { P } from "../rbac/catalog";
import { setSetting } from "../settings";
import { verifyLicenseFile } from "../licensing/license";
import { getModule } from "@/modules/registry";
import type { ActionState } from "../auth/actions";

const LICENSE_PATH = "/settings/license";

export async function uploadLicense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.settingsManage);
  if ("error" in gate) return gate;

  const file = formData.get("license");
  let content: string;
  if (file instanceof File) content = await file.text();
  else if (typeof file === "string") content = file;
  else return { error: "Choose a license file." };
  if (!content.trim()) return { error: "Choose a license file." };

  const result = verifyLicenseFile(content);
  if (!result.valid) return { error: result.reason };

  const { payload, expired } = result;
  const unknown = payload.modules.filter((m) => !getModule(m.key));
  if (unknown.length > 0) {
    return { error: `License names unknown module(s): ${unknown.map((m) => m.key).join(", ")}.` };
  }

  const { db } = getDb();
  const now = new Date();
  const expiresAt = new Date(payload.expiresAt);
  await db.transaction(async (tx) => {
    // Replace license-sourced entitlements wholesale (a new license is the
    // complete statement of what's licensed).
    await tx.delete(moduleEntitlements).where(eq(moduleEntitlements.workspaceId, gate.user.workspaceId));
    for (const m of payload.modules) {
      await tx.insert(moduleEntitlements).values({
        id: crypto.randomUUID(),
        workspaceId: gate.user.workspaceId,
        moduleKey: m.key,
        status: expired ? "expired" : "active",
        seats: m.seats ?? null,
        expiresAt,
        source: "license",
        createdAt: now,
        updatedAt: now,
      });
    }
  });
  await setSetting(gate.user.workspaceId, "license", "current", {
    licenseId: payload.licenseId,
    customer: payload.customer,
    modules: payload.modules,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "license.uploaded",
    entityType: "license",
    entityId: payload.licenseId,
    summary: `Applied license ${payload.licenseId} for “${payload.customer}”: ${payload.modules
      .map((m) => m.key)
      .join(", ")} (expires ${payload.expiresAt.slice(0, 10)}${expired ? " — ALREADY EXPIRED" : ""}).`,
  });
  revalidatePath(LICENSE_PATH);
  revalidatePath("/", "layout"); // app drawer changes everywhere
  return { ok: true };
}
