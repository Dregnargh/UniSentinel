// Pure helpers shared by server and client — no db imports (unit-tested).

export const TASK_STATUSES = ["todo", "in_progress", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const ACTIVITY_STATUSES = ["planned", "in_progress", "on_hold", "done"] as const;

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

export const taskStatusTone: Record<string, Tone> = {
  todo: "neutral",
  in_progress: "info",
  blocked: "danger",
  done: "success",
};

export const priorityTone: Record<string, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export const activityStatusTone: Record<string, Tone> = {
  planned: "neutral",
  in_progress: "info",
  on_hold: "warning",
  done: "success",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const ACTIVITY_STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  on_hold: "On hold",
  done: "Done",
};

export function isOverdue(dueDate: Date | string | null, status: string, now: Date = new Date()): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate).getTime() < now.getTime();
}

/** Activity progress in percent — done tasks over total (0 when empty). */
export function activityProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

/** Board column order and adjacent moves. */
export function adjacentStatus(status: TaskStatus, direction: -1 | 1): TaskStatus | null {
  const i = TASK_STATUSES.indexOf(status);
  const next = TASK_STATUSES[i + direction];
  return next ?? null;
}
