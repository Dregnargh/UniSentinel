"use client";

import * as React from "react";
import { useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { TaskRow } from "@/modules/tasks/queries";
import { deleteTask } from "@/modules/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  isOverdue,
  priorityTone,
  taskStatusTone,
} from "@/modules/tasks/format";
import { TaskEditorModal, type Option } from "../TaskEditorModal";

export function AllTasksClient({
  tasks,
  activities,
  assignees,
  canManage,
}: {
  tasks: TaskRow[];
  activities: Option[];
  assignees: Option[];
  canManage: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [editorTarget, setEditorTarget] = React.useState<TaskRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TaskRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = tasks.filter(
    (t) =>
      (statusFilter === "all" || t.status === statusFilter) &&
      t.title.toLowerCase().includes(query.toLowerCase()),
  );

  const remove = (task: TaskRow) =>
    startTransition(async () => {
      const result: ActionState = await deleteTask(task.id);
      setError(result.error ?? null);
      setDeleteTarget(null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>All tasks</h1>
          <p>Every task in the workspace, whoever owns it.</p>
        </div>
        {canManage && <Button onClick={() => setEditorTarget("new")}>New task</Button>}
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          <div style={{ display: "flex", gap: "var(--us-space-2)", marginBottom: "var(--us-space-4)", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 280, flex: 1, minWidth: 200 }}>
              <Input placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="seg">
              <button type="button" data-active={statusFilter === "all" || undefined} onClick={() => setStatusFilter("all")}>
                All
              </button>
              {TASK_STATUSES.map((s) => (
                <button key={s} type="button" data-active={statusFilter === s || undefined} onClick={() => setStatusFilter(s)}>
                  {TASK_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              {tasks.length === 0 ? "No tasks yet." : "No tasks match."}
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Task</Table.HeaderCell>
                  <Table.HeaderCell>Activity</Table.HeaderCell>
                  <Table.HeaderCell>Assignee</Table.HeaderCell>
                  <Table.HeaderCell>Priority</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Due</Table.HeaderCell>
                  {canManage && <Table.HeaderCell align="right">Actions</Table.HeaderCell>}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {visible.map((t) => (
                  <Table.Row key={t.id}>
                    <Table.Cell>
                      <div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.originType && <Badge tone="brand">{t.originType}</Badge>}
                    </Table.Cell>
                    <Table.Cell>{t.activityName ?? <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>{t.assigneeName ?? <span className="muted">unassigned</span>}</Table.Cell>
                    <Table.Cell>
                      <Badge tone={priorityTone[t.priority] ?? "neutral"}>{t.priority}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={taskStatusTone[t.status] ?? "neutral"} dot>
                        {TASK_STATUS_LABEL[t.status] ?? t.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {t.dueDate ? (
                        <span>
                          {t.dueDate.slice(0, 10)} {isOverdue(t.dueDate, t.status) && <Badge tone="danger">overdue</Badge>}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </Table.Cell>
                    {canManage && (
                      <Table.Cell align="right">
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <Button size="sm" variant="ghost" onClick={() => setEditorTarget(t)}>
                            Open
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(t)}>
                            Delete
                          </Button>
                        </div>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
      <TaskEditorModal
        key={editorTarget === "new" ? "new" : (editorTarget?.id ?? "none")}
        target={editorTarget}
        assignees={assignees}
        activities={activities}
        onClose={() => setEditorTarget(null)}
      />
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete task" size="sm">
        <Modal.Body>
          Delete <strong>{deleteTarget?.title}</strong>? Comments go with it; the audit trail keeps the history.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={() => deleteTarget && remove(deleteTarget)}>
            Delete task
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
