"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tskActivities, tskComments, tskTasks, users } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { logAudit } from "@/platform/audit";
import { emitEvent } from "@/platform/events";
import { notify } from "@/platform/notify/service";
import { moduleGuardAction } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import type { ActionState } from "@/platform/auth/actions";
import { ACTIVITY_STATUSES, TASK_PRIORITIES, TASK_STATUSES, activityProgress } from "./format";
import { activityInWorkspace, taskInWorkspace } from "./queries";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const MODULE = "tasks";
const P_TASKS = "tasks.tasks.manage";
const P_ASSIGN = "tasks.tasks.assign";
const P_ACTIVITIES = "tasks.activities.manage";

function revalidateTasks() {
  for (const p of ["/m/tasks", "/m/tasks/all", "/m/tasks/board", "/m/tasks/activities"]) {
    revalidatePath(p);
  }
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function emitActivityProgress(workspaceId: string, activityId: string | null, actorId: string) {
  if (!activityId) return;
  const { db } = getDb();
  const tasks = await db
    .select({ status: tskTasks.status })
    .from(tskTasks)
    .where(and(eq(tskTasks.workspaceId, workspaceId), eq(tskTasks.activityId, activityId)));
  await emitEvent({
    workspaceId,
    type: "task.progress",
    payload: { activityId, progress: activityProgress(tasks), taskCount: tasks.length },
    actorUserId: actorId,
  });
}

// ---- Activities ---------------------------------------------------------------

const activitySchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(140),
  description: z.string().trim().max(2000).optional().default(""),
  status: z.enum(ACTIVITY_STATUSES),
  ownerUserId: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function saveActivity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ACTIVITIES);
  if ("error" in gate) return gate;
  const parsed = activitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { db } = getDb();

  let ownerUserId: string | null = null;
  if (d.ownerUserId) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, d.ownerUserId), eq(users.workspaceId, gate.user.workspaceId)))
      .limit(1);
    ownerUserId = rows[0]?.id ?? null;
  }

  const activityId = String(formData.get("activityId") ?? "");
  const now = new Date();
  const values = {
    name: d.name,
    description: d.description,
    status: d.status,
    ownerUserId,
    startDate: parseDate(d.startDate),
    dueDate: parseDate(d.dueDate),
    updatedAt: now,
  };
  if (activityId) {
    const target = await activityInWorkspace(activityId, gate.user.workspaceId);
    if (!target) return { error: "Activity not found." };
    await db.update(tskActivities).set(values).where(eq(tskActivities.id, activityId));
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "tasks.activity_updated",
      entityType: "tasks:activity",
      entityId: activityId,
      summary: `Updated activity “${d.name}”.`,
    });
  } else {
    const id = crypto.randomUUID();
    await db.insert(tskActivities).values({ id, workspaceId: gate.user.workspaceId, ...values, createdAt: now });
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "tasks.activity_created",
      entityType: "tasks:activity",
      entityId: id,
      summary: `Created activity “${d.name}”.`,
    });
  }
  revalidateTasks();
  return { ok: true };
}

export async function deleteActivity(activityId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ACTIVITIES);
  if ("error" in gate) return gate;
  const target = await activityInWorkspace(activityId, gate.user.workspaceId);
  if (!target) return { error: "Activity not found." };
  const { db } = getDb();
  // Tasks survive (activity_id SET NULL) — an activity is a grouping, not the work.
  await db.delete(tskActivities).where(eq(tskActivities.id, activityId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "tasks.activity_deleted",
    entityType: "tasks:activity",
    entityId: activityId,
    summary: `Deleted activity “${target.name}” (its tasks were kept).`,
  });
  revalidateTasks();
  return { ok: true };
}

// ---- Tasks -----------------------------------------------------------------------

const taskSchema = z.object({
  title: z.string().trim().min(2, "Title is too short.").max(160),
  description: z.string().trim().max(4000).optional().default(""),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  assigneeUserId: z.string().optional(),
  activityId: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function saveTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_TASKS);
  if ("error" in gate) return gate;
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { db } = getDb();

  let assigneeUserId: string | null = null;
  if (d.assigneeUserId) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, d.assigneeUserId), eq(users.workspaceId, gate.user.workspaceId)))
      .limit(1);
    if (!rows[0]) return { error: "Assignee not found." };
    assigneeUserId = rows[0].id;
    if (assigneeUserId !== gate.user.id && !permitted(gate.permissions, P_ASSIGN)) {
      return { error: "You don't have permission to assign tasks to others." };
    }
  }
  let activityId: string | null = null;
  if (d.activityId) {
    const activity = await activityInWorkspace(d.activityId, gate.user.workspaceId);
    if (!activity) return { error: "Activity not found." };
    activityId = activity.id;
  }

  const taskId = String(formData.get("taskId") ?? "");
  const now = new Date();
  if (taskId) {
    const target = await taskInWorkspace(taskId, gate.user.workspaceId);
    if (!target) return { error: "Task not found." };
    const becameDone = d.status === "done" && target.status !== "done";
    await db
      .update(tskTasks)
      .set({
        title: d.title,
        description: d.description,
        status: d.status,
        priority: d.priority,
        assigneeUserId,
        activityId,
        dueDate: parseDate(d.dueDate),
        completedAt: d.status === "done" ? (target.completedAt ?? now) : null,
        updatedAt: now,
      })
      .where(eq(tskTasks.id, taskId));
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "tasks.task_updated",
      entityType: "tasks:task",
      entityId: taskId,
      summary: `Updated task “${d.title}”.`,
    });
    if (becameDone) await onTaskCompleted(gate.user.workspaceId, gate.user.id, taskId, d.title, target.originType, target.originId, activityId);
    if (assigneeUserId && assigneeUserId !== target.assigneeUserId && assigneeUserId !== gate.user.id) {
      await notifyAssignee(gate.user, assigneeUserId, d.title, taskId);
    }
  } else {
    const id = crypto.randomUUID();
    await db.insert(tskTasks).values({
      id,
      workspaceId: gate.user.workspaceId,
      activityId,
      title: d.title,
      description: d.description,
      status: d.status,
      priority: d.priority,
      assigneeUserId,
      dueDate: parseDate(d.dueDate),
      completedAt: d.status === "done" ? now : null,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "tasks.task_created",
      entityType: "tasks:task",
      entityId: id,
      summary: `Created task “${d.title}” (${d.priority}${assigneeUserId ? ", assigned" : ""}).`,
    });
    if (assigneeUserId && assigneeUserId !== gate.user.id) {
      await notifyAssignee(gate.user, assigneeUserId, d.title, id);
    }
  }
  await emitActivityProgress(gate.user.workspaceId, activityId, gate.user.id);
  revalidateTasks();
  return { ok: true };
}

async function notifyAssignee(
  actor: { id: string; name: string; email: string; workspaceId: string },
  assigneeUserId: string,
  title: string,
  taskId: string,
) {
  await notify({
    workspaceId: actor.workspaceId,
    userIds: [assigneeUserId],
    type: "task.assigned",
    title: "Task assigned to you",
    body: `${actor.name} assigned you: “${title}”.`,
    href: "/m/tasks",
  });
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "tasks.task_assigned",
    entityType: "tasks:task",
    entityId: taskId,
    summary: `Assigned “${title}”.`,
  });
}

async function onTaskCompleted(
  workspaceId: string,
  actorId: string,
  taskId: string,
  title: string,
  originType: string | null,
  originId: string | null,
  activityId: string | null,
) {
  await emitEvent({
    workspaceId,
    type: "task.completed",
    payload: { taskId, title, originType, originId, activityId },
    actorUserId: actorId,
  });
}

/** Board/inline status change (scalar action + useTransition on the client). */
export async function setTaskStatus(taskId: string, status: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_TASKS);
  if ("error" in gate) return gate;
  if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) return { error: "Invalid status." };
  const target = await taskInWorkspace(taskId, gate.user.workspaceId);
  if (!target) return { error: "Task not found." };
  const now = new Date();
  const { db } = getDb();
  await db
    .update(tskTasks)
    .set({
      status,
      completedAt: status === "done" ? (target.completedAt ?? now) : null,
      updatedAt: now,
    })
    .where(eq(tskTasks.id, taskId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "tasks.task_status_changed",
    entityType: "tasks:task",
    entityId: taskId,
    summary: `Moved “${target.title}” to ${status.replace("_", " ")}.`,
  });
  if (status === "done" && target.status !== "done") {
    await onTaskCompleted(gate.user.workspaceId, gate.user.id, taskId, target.title, target.originType, target.originId, target.activityId);
  }
  await emitActivityProgress(gate.user.workspaceId, target.activityId, gate.user.id);
  revalidateTasks();
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_TASKS);
  if ("error" in gate) return gate;
  const target = await taskInWorkspace(taskId, gate.user.workspaceId);
  if (!target) return { error: "Task not found." };
  const { db } = getDb();
  await db.delete(tskTasks).where(eq(tskTasks.id, taskId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "tasks.task_deleted",
    entityType: "tasks:task",
    entityId: taskId,
    summary: `Deleted task “${target.title}”.`,
  });
  await emitActivityProgress(gate.user.workspaceId, target.activityId, gate.user.id);
  revalidateTasks();
  return { ok: true };
}

// ---- Comments ----------------------------------------------------------------------

const commentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().trim().min(1, "Write a comment.").max(4000),
});

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, "tasks.tasks.view");
  if ("error" in gate) return gate;
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await taskInWorkspace(parsed.data.taskId, gate.user.workspaceId);
  if (!target) return { error: "Task not found." };
  const { db } = getDb();
  await db.insert(tskComments).values({
    id: crypto.randomUUID(),
    workspaceId: gate.user.workspaceId,
    taskId: target.id,
    authorUserId: gate.user.id,
    authorName: gate.user.name,
    body: parsed.data.body,
    createdAt: new Date(),
  });
  if (target.assigneeUserId && target.assigneeUserId !== gate.user.id) {
    await notify({
      workspaceId: gate.user.workspaceId,
      userIds: [target.assigneeUserId],
      type: "task.commented",
      title: "New comment on your task",
      body: `${gate.user.name} commented on “${target.title}”.`,
      href: "/m/tasks",
    });
  }
  revalidateTasks();
  return { ok: true };
}

/** Comments for the task editor modal (called from the client on open). */
export async function getTaskComments(taskId: string) {
  const gate = await moduleGuardAction(MODULE, "tasks.tasks.view");
  if ("error" in gate) return [];
  const { listComments } = await import("./queries");
  return listComments(taskId, gate.user.workspaceId);
}
