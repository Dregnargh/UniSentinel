import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { listMyTasks } from "@/modules/tasks/queries";
import { MyTasksClient } from "./MyTasksClient";

export const metadata: Metadata = { title: "My tasks" };
export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const ctx = await requireModule("tasks", "tasks.tasks.view");
  const tasks = await listMyTasks(ctx.user.workspaceId, ctx.user.id);
  return <MyTasksClient tasks={tasks} />;
}
