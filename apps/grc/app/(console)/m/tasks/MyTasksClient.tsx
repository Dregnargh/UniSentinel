"use client";

import * as React from "react";
import { useTransition } from "react";
import Link from "next/link";
import { Alert, Badge, Button, Card, Stat, Table } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { TaskRow } from "@/modules/tasks/queries";
import { setTaskStatus } from "@/modules/tasks/actions";
import { TASK_STATUS_LABEL, isOverdue, priorityTone, taskStatusTone } from "@/modules/tasks/format";

export function MyTasksClient({ tasks }: { tasks: TaskRow[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => isOverdue(t.dueDate, t.status));

  const complete = (task: TaskRow) =>
    startTransition(async () => {
      const result: ActionState = await setTaskStatus(task.id, "done");
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>My tasks</h1>
          <p>Everything assigned to you — including work spawned by other modules.</p>
        </div>
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "var(--us-space-4)" }}>
        <Stat label="Open" value={String(open.length)} />
        <Stat label="Overdue" value={String(overdue.length)} />
        <Stat label="Done" value={String(tasks.length - open.length)} />
      </div>
      <Card>
        <Card.Body>
          {tasks.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nothing assigned to you. Browse <Link href="/m/tasks/all">all tasks</Link>.
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Task</Table.HeaderCell>
                  <Table.HeaderCell>Activity</Table.HeaderCell>
                  <Table.HeaderCell>Priority</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Due</Table.HeaderCell>
                  <Table.HeaderCell align="right">Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {tasks.map((t) => (
                  <Table.Row key={t.id}>
                    <Table.Cell>
                      <div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.originType && (
                        <Badge tone="brand" style={{ marginTop: 2 }}>
                          {t.originType}
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>{t.activityName ?? <span className="muted">—</span>}</Table.Cell>
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
                          {t.dueDate.slice(0, 10)}{" "}
                          {isOverdue(t.dueDate, t.status) && <Badge tone="danger">overdue</Badge>}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </Table.Cell>
                    <Table.Cell align="right">
                      {t.status !== "done" && (
                        <Button size="sm" variant="outline" disabled={pending} onClick={() => complete(t)}>
                          Mark done
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
