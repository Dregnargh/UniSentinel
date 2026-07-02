"use client";

import * as React from "react";
import { useTransition } from "react";
import { Alert, Avatar, Badge } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import type { TaskRow } from "@/modules/tasks/queries";
import { setTaskStatus } from "@/modules/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  adjacentStatus,
  isOverdue,
  priorityTone,
  type TaskStatus,
} from "@/modules/tasks/format";

export function BoardClient({ tasks, canManage }: { tasks: TaskRow[]; canManage: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (task: TaskRow, direction: -1 | 1) => {
    const next = adjacentStatus(task.status as TaskStatus, direction);
    if (!next) return;
    startTransition(async () => {
      const result: ActionState = await setTaskStatus(task.id, next);
      setError(result.error ?? null);
    });
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Board</h1>
          <p>Tasks by status — move cards with the arrows.</p>
        </div>
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <div className="board">
        {TASK_STATUSES.map((status) => {
          const column = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="board__col">
              <div className="board__col-head">
                {TASK_STATUS_LABEL[status]} <span className="muted">({column.length})</span>
              </div>
              {column.map((t) => (
                <div key={t.id} className="board__card" data-testid={`card-${status}`}>
                  <div className="board__card-title">{t.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge tone={priorityTone[t.priority] ?? "neutral"}>{t.priority}</Badge>
                    {t.dueDate && isOverdue(t.dueDate, t.status) && <Badge tone="danger">overdue</Badge>}
                    {t.originType && <Badge tone="brand">{t.originType.split(":")[0]}</Badge>}
                    {t.assigneeName && (
                      <span title={t.assigneeName} style={{ marginLeft: "auto" }}>
                        <Avatar name={t.assigneeName} size="xs" />
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <div className="board__card-actions">
                      <button
                        type="button"
                        aria-label={`Move ${t.title} back`}
                        disabled={pending || !adjacentStatus(t.status as TaskStatus, -1)}
                        onClick={() => move(t, -1)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${t.title} forward`}
                        disabled={pending || !adjacentStatus(t.status as TaskStatus, 1)}
                        onClick={() => move(t, 1)}
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
