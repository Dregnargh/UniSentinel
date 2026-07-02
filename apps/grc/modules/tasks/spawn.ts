// The "task-spawn" integration point: other modules (risk treatments, audit
// findings, compliance gaps, attestation campaigns) create linked tasks
// through this — never by writing tsk_* tables directly. Server-only; the
// CALLER is responsible for its own module/permission gating and audit entry.
import { tskTasks } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { notify } from "@/platform/notify/service";
import { allEntityTypes } from "@/modules/registry";

export async function spawnTask(input: {
  workspaceId: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assigneeUserId?: string | null;
  dueDate?: Date | null;
  origin: { type: string; id: string };
  actor: { id: string; name: string };
}): Promise<string> {
  if (!allEntityTypes().has(input.origin.type)) {
    throw new Error(`Unknown origin entity type: ${input.origin.type}`);
  }
  const { db } = getDb();
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(tskTasks).values({
    id,
    workspaceId: input.workspaceId,
    title: input.title,
    description: input.description ?? "",
    status: "todo",
    priority: input.priority ?? "medium",
    assigneeUserId: input.assigneeUserId ?? null,
    dueDate: input.dueDate ?? null,
    originType: input.origin.type,
    originId: input.origin.id,
    createdAt: now,
    updatedAt: now,
  });
  if (input.assigneeUserId && input.assigneeUserId !== input.actor.id) {
    await notify({
      workspaceId: input.workspaceId,
      userIds: [input.assigneeUserId],
      type: "task.assigned",
      title: "Task assigned to you",
      body: `${input.actor.name} assigned you: “${input.title}”.`,
      href: "/m/tasks",
    });
  }
  return id;
}
