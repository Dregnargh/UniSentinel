import { redirect } from "next/navigation";
import { requireSession, type SessionContext } from "../auth/session";
import { permitted } from "./catalog";
import { getPermissionSet } from "./permissions";

export interface AuthorizedContext extends SessionContext {
  permissions: Set<string>;
}

/**
 * Page guard: session + permission or redirect home. Use in server components.
 */
export async function requirePermission(...perms: string[]): Promise<AuthorizedContext> {
  const ctx = await requireSession();
  const permissions = await getPermissionSet(ctx.user.id);
  if (!perms.every((p) => permitted(permissions, p))) redirect("/");
  return { ...ctx, permissions };
}

/**
 * Action guard: session + permission or a returnable error. Use at the top of
 * server actions:  const gate = await guardAction(P.usersCreate);
 *                  if ("error" in gate) return gate;
 */
export async function guardAction(
  ...perms: string[]
): Promise<AuthorizedContext | { error: string }> {
  const ctx = await requireSession();
  const permissions = await getPermissionSet(ctx.user.id);
  if (!perms.every((p) => permitted(permissions, p))) {
    return { error: "You don't have permission to do that." };
  }
  return { ...ctx, permissions };
}
