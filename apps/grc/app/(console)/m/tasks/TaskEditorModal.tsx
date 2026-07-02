"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Divider, Input, Modal, Select, Textarea } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { TaskRow, CommentRow } from "@/modules/tasks/queries";
import { addComment, getTaskComments, saveTask } from "@/modules/tasks/actions";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_STATUS_LABEL } from "@/modules/tasks/format";

export interface Option {
  id: string;
  name: string;
}

export function TaskEditorModal({
  target,
  assignees,
  activities,
  onClose,
}: {
  target: TaskRow | "new" | null;
  assignees: Option[];
  activities: Option[];
  onClose: () => void;
}) {
  const isNew = target === "new";
  const task = isNew || target === null ? null : target;
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTask, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={target !== null} onClose={onClose} title={isNew ? "New task" : `Task — ${task?.title}`} size="md">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {!isNew && <input type="hidden" name="taskId" value={task?.id ?? ""} />}
            {task?.originType && (
              <Badge tone="brand" style={{ justifySelf: "start" }}>
                origin: {task.originType}
              </Badge>
            )}
            <label htmlFor="task-title">Title</label>
            <Input id="task-title" name="title" defaultValue={task?.title} required placeholder="Review firewall rules" />
            <label htmlFor="task-desc">Description</label>
            <Textarea id="task-desc" name="description" defaultValue={task?.description} rows={2} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-grid">
                <label htmlFor="task-status">Status</label>
                <Select id="task-status" name="status" defaultValue={task?.status ?? "todo"}>
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TASK_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="form-grid">
                <label htmlFor="task-priority">Priority</label>
                <Select id="task-priority" name="priority" defaultValue={task?.priority ?? "medium"}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <label htmlFor="task-assignee">Assignee</label>
            <Select id="task-assignee" name="assigneeUserId" defaultValue={task?.assigneeUserId ?? ""}>
              <option value="">— unassigned —</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <label htmlFor="task-activity">Activity</label>
            <Select id="task-activity" name="activityId" defaultValue={task?.activityId ?? ""}>
              <option value="">— none —</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <label htmlFor="task-due">Due date</label>
            <Input id="task-due" name="dueDate" type="date" defaultValue={task?.dueDate ? task.dueDate.slice(0, 10) : ""} />
          </div>
          {task && (
            <>
              <Divider style={{ margin: "var(--us-space-4) 0" }} />
              <Comments taskId={task.id} />
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isNew ? "Create task" : "Save"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function Comments({ taskId }: { taskId: string }) {
  const [comments, setComments] = React.useState<CommentRow[] | null>(null);
  const [loading, startLoad] = useTransition();
  const [state, action, pending] = useActionState<ActionState, FormData>(addComment, {});

  const reload = React.useCallback(() => {
    startLoad(async () => {
      setComments(await getTaskComments(taskId));
    });
  }, [taskId]);

  React.useEffect(() => {
    reload();
  }, [reload]);
  React.useEffect(() => {
    if (state.ok) reload();
  }, [state.ok, reload]);

  return (
    <div className="stack" style={{ gap: "var(--us-space-3)" }}>
      <div style={{ fontWeight: 600, fontSize: "var(--us-text-sm)" }}>Comments</div>
      {loading && comments === null ? (
        <p className="muted" style={{ margin: 0 }}>
          Loading…
        </p>
      ) : comments && comments.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "var(--us-space-2)" }}>
          {comments.map((c) => (
            <li key={c.id} style={{ fontSize: "var(--us-text-sm)" }}>
              <strong>{c.authorName}</strong>{" "}
              <span className="muted" style={{ fontSize: "var(--us-text-xs)" }}>
                {c.at.replace("T", " ").slice(0, 16)}
              </span>
              <div>{c.body}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ margin: 0, fontSize: "var(--us-text-sm)" }}>
          No comments yet.
        </p>
      )}
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <div style={{ display: "flex", gap: 8 }}>
        <Input name="comment-draft" id={`comment-${taskId}`} placeholder="Add a comment…" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={pending}
          onClick={() => {
            const input = document.getElementById(`comment-${taskId}`) as HTMLInputElement | null;
            if (!input?.value.trim()) return;
            const fd = new FormData();
            fd.set("taskId", taskId);
            fd.set("body", input.value);
            React.startTransition(() => action(fd));
            input.value = "";
          }}
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
