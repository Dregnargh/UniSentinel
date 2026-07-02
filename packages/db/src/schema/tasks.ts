import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users, workspaces } from "./core";

// ---------------------------------------------------------------------------
// Tasks & Activities module (tsk_*). The execution engine: activities are
// lightweight plans/projects; tasks live inside an activity or standalone.
// origin_type/origin_id is the cross-module backlink ("this task exists
// because of risk X / finding Y") — validated against the entity-type
// registry at the action layer. User FKs SET NULL: work items outlive people.
// ---------------------------------------------------------------------------

export const tskActivities = pgTable(
  "tsk_activities",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    // planned | in_progress | on_hold | done
    status: text("status").notNull().default("planned"),
    ownerUserId: text("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_tsk_activities_workspace").on(t.workspaceId)],
);

export type TskActivity = typeof tskActivities.$inferSelect;

export const tskTasks = pgTable(
  "tsk_tasks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    activityId: text("activity_id").references(() => tskActivities.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    // todo | in_progress | blocked | done
    status: text("status").notNull().default("todo"),
    // low | medium | high | urgent
    priority: text("priority").notNull().default("medium"),
    assigneeUserId: text("assignee_user_id").references(() => users.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // Cross-module backlink, e.g. origin_type "risk:risk" (registry-validated).
    originType: text("origin_type"),
    originId: text("origin_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("idx_tsk_tasks_workspace").on(t.workspaceId),
    index("idx_tsk_tasks_assignee").on(t.assigneeUserId),
    index("idx_tsk_tasks_activity").on(t.activityId),
    index("idx_tsk_tasks_origin").on(t.workspaceId, t.originType, t.originId),
  ],
);

export type TskTask = typeof tskTasks.$inferSelect;

// Comments: author identity snapshotted so threads survive user deletion.
export const tskComments = pgTable(
  "tsk_comments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tskTasks.id, { onDelete: "cascade" }),
    authorUserId: text("author_user_id"),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("idx_tsk_comments_task").on(t.taskId)],
);

export type TskComment = typeof tskComments.$inferSelect;
