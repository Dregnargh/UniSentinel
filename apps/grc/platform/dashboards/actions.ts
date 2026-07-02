"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/platform/auth/session";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { permitted } from "@/platform/rbac/catalog";
import { findWidget } from "@/modules/registry";
import { getEntitlements } from "@/platform/modules/entitlements";
import type { ActionState } from "@/platform/auth/actions";
import { addInstance, defaultLayout, moveInstance, removeInstance } from "./layout";
import { availableWidgets } from "./data";
import { getSavedLayout, saveLayout } from "./store";

// Dashboard edits are user preferences — session-gated but not audited.
// The first edit materializes the computed default so later ops are stable.

async function effectiveLayout(workspaceId: string, userId: string, permissions: Set<string>) {
  const saved = await getSavedLayout(workspaceId, userId);
  if (saved) return saved;
  const available = await availableWidgets(workspaceId, permissions);
  return defaultLayout(available.map((w) => w.key));
}

export async function addDashboardWidget(widgetKey: string): Promise<ActionState> {
  const { user } = await requireSession();
  const permissions = await getPermissionSet(user.id);
  const def = findWidget(widgetKey);
  if (!def) return { error: "Unknown widget." };
  const entitlements = await getEntitlements(user.workspaceId);
  if (entitlements.get(def.moduleKey)?.status !== "active") {
    return { error: `${def.moduleName} is not licensed on this workspace.` };
  }
  if (!permitted(permissions, def.permission)) {
    return { error: "You don't have permission to view that widget." };
  }
  const layout = await effectiveLayout(user.workspaceId, user.id, permissions);
  await saveLayout(user.workspaceId, user.id, addInstance(layout, widgetKey));
  revalidatePath("/");
  return { ok: true };
}

export async function removeDashboardWidget(instanceId: string): Promise<ActionState> {
  const { user } = await requireSession();
  const permissions = await getPermissionSet(user.id);
  const layout = await effectiveLayout(user.workspaceId, user.id, permissions);
  await saveLayout(user.workspaceId, user.id, removeInstance(layout, instanceId));
  revalidatePath("/");
  return { ok: true };
}

export async function moveDashboardWidget(instanceId: string, direction: -1 | 1): Promise<ActionState> {
  const { user } = await requireSession();
  const permissions = await getPermissionSet(user.id);
  if (direction !== -1 && direction !== 1) return { error: "Invalid direction." };
  const layout = await effectiveLayout(user.workspaceId, user.id, permissions);
  await saveLayout(user.workspaceId, user.id, moveInstance(layout, instanceId, direction));
  revalidatePath("/");
  return { ok: true };
}
