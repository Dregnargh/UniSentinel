import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { listActivities, listTasks } from "@/modules/tasks/queries";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { AllTasksClient } from "./AllTasksClient";

export const metadata: Metadata = { title: "All tasks" };
export const dynamic = "force-dynamic";

export default async function AllTasksPage() {
  const ctx = await requireModule("tasks", "tasks.tasks.view");
  const [tasks, activities, members] = await Promise.all([
    listTasks(ctx.user.workspaceId),
    listActivities(ctx.user.workspaceId),
    listWorkspaceUsers(ctx.user.workspaceId),
  ]);
  return (
    <AllTasksClient
      tasks={tasks}
      activities={activities.map((a) => ({ id: a.id, name: a.name }))}
      assignees={members.filter((m) => m.active).map((m) => ({ id: m.id, name: m.name }))}
      canManage={permitted(ctx.permissions, "tasks.tasks.manage")}
    />
  );
}
