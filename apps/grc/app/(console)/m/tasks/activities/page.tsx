import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { listActivities } from "@/modules/tasks/queries";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { ActivitiesClient } from "./ActivitiesClient";

export const metadata: Metadata = { title: "Activities" };
export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const ctx = await requireModule("tasks", "tasks.activities.view");
  const [activities, members] = await Promise.all([
    listActivities(ctx.user.workspaceId),
    listWorkspaceUsers(ctx.user.workspaceId),
  ]);
  return (
    <ActivitiesClient
      activities={activities.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        status: a.status,
        ownerName: a.ownerName,
        startDate: a.startDate?.toISOString() ?? null,
        dueDate: a.dueDate?.toISOString() ?? null,
        taskCount: a.taskCount,
        progress: a.progress,
      }))}
      owners={members.filter((m) => m.active).map((m) => ({ id: m.id, name: m.name }))}
      canManage={permitted(ctx.permissions, "tasks.activities.manage")}
    />
  );
}
