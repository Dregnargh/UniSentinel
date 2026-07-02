import { and, asc, desc, eq } from "drizzle-orm";
import {
  tskActivities,
  tskComments,
  tskTasks,
  users,
  type TskActivity,
} from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { activityProgress } from "./format";

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  activityId: string | null;
  activityName: string | null;
  dueDate: string | null;
  originType: string | null;
  originId: string | null;
}

function toRow(t: {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeUserId: string | null;
  assigneeName: string | null;
  activityId: string | null;
  activityName: string | null;
  dueDate: Date | null;
  originType: string | null;
  originId: string | null;
}): TaskRow {
  return { ...t, dueDate: t.dueDate ? t.dueDate.toISOString() : null };
}

const taskSelection = {
  id: tskTasks.id,
  title: tskTasks.title,
  description: tskTasks.description,
  status: tskTasks.status,
  priority: tskTasks.priority,
  assigneeUserId: tskTasks.assigneeUserId,
  assigneeName: users.name,
  activityId: tskTasks.activityId,
  activityName: tskActivities.name,
  dueDate: tskTasks.dueDate,
  originType: tskTasks.originType,
  originId: tskTasks.originId,
};

export async function listTasks(workspaceId: string): Promise<TaskRow[]> {
  const { db } = getDb();
  const rows = await db
    .select(taskSelection)
    .from(tskTasks)
    .leftJoin(users, eq(tskTasks.assigneeUserId, users.id))
    .leftJoin(tskActivities, eq(tskTasks.activityId, tskActivities.id))
    .where(eq(tskTasks.workspaceId, workspaceId))
    .orderBy(desc(tskTasks.createdAt));
  return rows.map(toRow);
}

export async function listMyTasks(workspaceId: string, userId: string): Promise<TaskRow[]> {
  const { db } = getDb();
  const rows = await db
    .select(taskSelection)
    .from(tskTasks)
    .leftJoin(users, eq(tskTasks.assigneeUserId, users.id))
    .leftJoin(tskActivities, eq(tskTasks.activityId, tskActivities.id))
    .where(and(eq(tskTasks.workspaceId, workspaceId), eq(tskTasks.assigneeUserId, userId)))
    .orderBy(asc(tskTasks.status), asc(tskTasks.dueDate));
  return rows.map(toRow);
}

export async function taskInWorkspace(id: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(tskTasks)
    .where(and(eq(tskTasks.id, id), eq(tskTasks.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function activityInWorkspace(id: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(tskActivities)
    .where(and(eq(tskActivities.id, id), eq(tskActivities.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export interface ActivityRow extends TskActivity {
  ownerName: string | null;
  taskCount: number;
  progress: number;
}

export async function listActivities(workspaceId: string): Promise<ActivityRow[]> {
  const { db } = getDb();
  const [activities, tasks] = await Promise.all([
    db
      .select({ activity: tskActivities, ownerName: users.name })
      .from(tskActivities)
      .leftJoin(users, eq(tskActivities.ownerUserId, users.id))
      .where(eq(tskActivities.workspaceId, workspaceId))
      .orderBy(asc(tskActivities.createdAt)),
    db
      .select({ activityId: tskTasks.activityId, status: tskTasks.status })
      .from(tskTasks)
      .where(eq(tskTasks.workspaceId, workspaceId)),
  ]);
  return activities.map(({ activity, ownerName }) => {
    const own = tasks.filter((t) => t.activityId === activity.id);
    return { ...activity, ownerName, taskCount: own.length, progress: activityProgress(own) };
  });
}

export interface CommentRow {
  id: string;
  authorName: string;
  body: string;
  at: string;
}

export async function listComments(taskId: string, workspaceId: string): Promise<CommentRow[]> {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(tskComments)
    .where(and(eq(tskComments.taskId, taskId), eq(tskComments.workspaceId, workspaceId)))
    .orderBy(asc(tskComments.createdAt));
  return rows.map((c) => ({ id: c.id, authorName: c.authorName, body: c.body, at: c.createdAt.toISOString() }));
}

/** Provider surface: tasks spawned by another module's entity (origin link). */
export async function listTasksByOrigin(
  workspaceId: string,
  origin: { type: string; id: string },
): Promise<{ id: string; title: string; status: string; assigneeName: string | null; dueDate: string | null }[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: tskTasks.id,
      title: tskTasks.title,
      status: tskTasks.status,
      assigneeName: users.name,
      dueDate: tskTasks.dueDate,
    })
    .from(tskTasks)
    .leftJoin(users, eq(tskTasks.assigneeUserId, users.id))
    .where(
      and(
        eq(tskTasks.workspaceId, workspaceId),
        eq(tskTasks.originType, origin.type),
        eq(tskTasks.originId, origin.id),
      ),
    )
    .orderBy(asc(tskTasks.createdAt));
  return rows.map((r) => ({ ...r, dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null }));
}
