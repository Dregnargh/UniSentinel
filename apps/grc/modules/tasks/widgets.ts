// Tasks widget data (server-only). Dispatched by platform/dashboards/data.ts
// AFTER the module-license and viewer-permission checks have passed.
import type { WidgetData } from "@/modules/types";
import { listMyTasks, listTasks } from "./queries";

const priorityTone = { urgent: "danger", high: "warning", medium: "info", low: "neutral" } as const;

export async function tasksWidgetData(
  widgetKey: string,
  workspaceId: string,
  viewerUserId: string,
): Promise<WidgetData | null> {
  if (widgetKey === "tasks.my") {
    const mine = (await listMyTasks(workspaceId, viewerUserId)).filter((t) => t.status !== "done");
    return {
      kind: "list",
      items: mine.slice(0, 6).map((t) => ({
        title: t.title,
        meta: t.dueDate ? `due ${t.dueDate.slice(0, 10)}` : undefined,
        href: "/m/tasks",
        badge: t.priority,
        badgeTone: priorityTone[t.priority as keyof typeof priorityTone] ?? "neutral",
      })),
      empty: "No open tasks assigned to you.",
    };
  }

  if (widgetKey === "tasks.status") {
    const tasks = await listTasks(workspaceId);
    const count = (status: string) => tasks.filter((t) => t.status === status).length;
    const now = Date.now();
    const overdue = tasks.filter(
      (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < now,
    ).length;
    return {
      kind: "stats",
      stats: [
        { label: "To do", value: String(count("todo")), tone: "neutral" },
        { label: "In progress", value: String(count("in_progress")), tone: "info" },
        { label: "Done", value: String(count("done")), tone: "success" },
        { label: "Overdue", value: String(overdue), tone: overdue > 0 ? "danger" : "neutral" },
      ],
    };
  }

  return null;
}
