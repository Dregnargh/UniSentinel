import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { listTasks } from "@/modules/tasks/queries";
import { BoardClient } from "./BoardClient";

export const metadata: Metadata = { title: "Board" };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const ctx = await requireModule("tasks", "tasks.tasks.view");
  const tasks = await listTasks(ctx.user.workspaceId);
  return <BoardClient tasks={tasks} canManage={permitted(ctx.permissions, "tasks.tasks.manage")} />;
}
