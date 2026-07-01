import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listWorkspaceUsers } from "@/lib/users/queries";
import UsersClient from "./UsersClient";
import AddUserButton from "./AddUserButton";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const { session, workspaceId } = await requireAdmin();
  const users = await listWorkspaceUsers(workspaceId);

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Users</h1>
          <p className="ap__page-sub">Manage who can access this workspace.</p>
        </div>
        <div className="ap__page-actions">
          <AddUserButton />
        </div>
      </div>

      <UsersClient users={users} currentUserId={session.sub} />
    </>
  );
}
