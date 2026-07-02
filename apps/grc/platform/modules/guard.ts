import { redirect } from "next/navigation";
import { requireSession } from "../auth/session";
import { getPermissionSet } from "../rbac/permissions";
import { permitted } from "../rbac/catalog";
import { getModule } from "@/modules/registry";
import type { AuthorizedContext } from "../rbac/guard";
import { isModuleEnabled } from "./entitlements";

/**
 * Page guard for module routes: session + module licensed (+ optional
 * permissions). Redirects home when the module is unknown or unlicensed.
 */
export async function requireModule(moduleKey: string, ...perms: string[]): Promise<AuthorizedContext> {
  const ctx = await requireSession();
  if (!getModule(moduleKey) || !(await isModuleEnabled(ctx.user.workspaceId, moduleKey))) {
    redirect("/");
  }
  const permissions = await getPermissionSet(ctx.user.id);
  if (!perms.every((p) => permitted(permissions, p))) redirect("/");
  return { ...ctx, permissions };
}

/** Action guard for module mutations: returnable error instead of redirect. */
export async function moduleGuardAction(
  moduleKey: string,
  ...perms: string[]
): Promise<AuthorizedContext | { error: string }> {
  const ctx = await requireSession();
  if (!getModule(moduleKey) || !(await isModuleEnabled(ctx.user.workspaceId, moduleKey))) {
    return { error: "This module is not licensed on this workspace." };
  }
  const permissions = await getPermissionSet(ctx.user.id);
  if (!perms.every((p) => permitted(permissions, p))) {
    return { error: "You don't have permission to do that." };
  }
  return { ...ctx, permissions };
}
