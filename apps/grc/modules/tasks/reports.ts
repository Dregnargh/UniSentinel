// Tasks report data (server-only). Dispatched by platform/reports/service.ts
// AFTER license/permission checks; params arrive validated against the
// manifest's option lists.
import type { ReportSection } from "@/platform/reports/pdf";
import { listTasks } from "./queries";

const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export async function tasksReportData(
  reportKey: string,
  params: Record<string, string>,
  workspaceId: string,
): Promise<ReportSection[] | null> {
  if (reportKey !== "tasks.status") return null;
  const tasks = await listTasks(workspaceId);
  const filtered = tasks.filter((t) => {
    if (params.status === "open" && t.status === "done") return false;
    if (params.status === "done" && t.status !== "done") return false;
    if (params.priority !== "all" && t.priority !== params.priority) return false;
    return true;
  });

  const now = Date.now();
  const overdue = filtered.filter(
    (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < now,
  ).length;
  const count = (status: string) => filtered.filter((t) => t.status === status).length;

  return [
    {
      stats: [
        { label: "Tasks", value: String(filtered.length) },
        { label: "To do", value: String(count("todo")) },
        { label: "In progress", value: String(count("in_progress")) },
        { label: "Done", value: String(count("done")) },
        { label: "Overdue", value: String(overdue) },
      ],
    },
    {
      table: {
        columns: ["Task", "Status", "Priority", "Assignee", "Due", "Activity", "Origin"],
        rows: filtered.map((t) => [
          t.title,
          STATUS_LABEL[t.status] ?? t.status,
          t.priority,
          t.assigneeName ?? "—",
          t.dueDate ? t.dueDate.slice(0, 10) : "—",
          t.activityName ?? "—",
          t.originType ?? "standalone",
        ]),
      },
    },
  ];
}
