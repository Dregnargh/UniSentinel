import type { Metadata } from "next";
import { requireAdmin } from "@/platform/auth/session";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { UsersClient } from "./UsersClient";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { user } = await requireAdmin();
  const members = await listWorkspaceUsers(user.workspaceId);
  return (
    <UsersClient
      meId={user.id}
      members={members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
    />
  );
}
