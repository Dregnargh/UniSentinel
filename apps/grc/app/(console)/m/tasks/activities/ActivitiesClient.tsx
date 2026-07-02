"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Progress, Select, Table, Textarea } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { deleteActivity, saveActivity } from "@/modules/tasks/actions";
import { ACTIVITY_STATUSES, ACTIVITY_STATUS_LABEL, activityStatusTone } from "@/modules/tasks/format";

interface Option {
  id: string;
  name: string;
}

interface ActivityViewRow {
  id: string;
  name: string;
  description: string;
  status: string;
  ownerName: string | null;
  startDate: string | null;
  dueDate: string | null;
  taskCount: number;
  progress: number;
}

export function ActivitiesClient({
  activities,
  owners,
  canManage,
}: {
  activities: ActivityViewRow[];
  owners: Option[];
  canManage: boolean;
}) {
  const [editorTarget, setEditorTarget] = React.useState<ActivityViewRow | "new" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (activity: ActivityViewRow) =>
    startTransition(async () => {
      const result = await deleteActivity(activity.id);
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Activities</h1>
          <p>Plans grouping related tasks — progress rolls up automatically.</p>
        </div>
        {canManage && <Button onClick={() => setEditorTarget("new")}>New activity</Button>}
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          {activities.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No activities yet.
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Activity</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Owner</Table.HeaderCell>
                  <Table.HeaderCell>Due</Table.HeaderCell>
                  <Table.HeaderCell style={{ width: 220 }}>Progress</Table.HeaderCell>
                  {canManage && <Table.HeaderCell align="right">Actions</Table.HeaderCell>}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {activities.map((a) => (
                  <Table.Row key={a.id}>
                    <Table.Cell>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      <div className="muted" style={{ fontSize: "var(--us-text-sm)" }}>
                        {a.taskCount} task{a.taskCount === 1 ? "" : "s"}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={activityStatusTone[a.status] ?? "neutral"} dot>
                        {ACTIVITY_STATUS_LABEL[a.status] ?? a.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{a.ownerName ?? <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>{a.dueDate ? a.dueDate.slice(0, 10) : <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Progress value={a.progress} style={{ flex: 1 }} />
                        <span className="muted" style={{ fontSize: "var(--us-text-xs)", width: 34 }}>
                          {a.progress}%
                        </span>
                      </div>
                    </Table.Cell>
                    {canManage && (
                      <Table.Cell align="right">
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <Button size="sm" variant="ghost" onClick={() => setEditorTarget(a)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(a)}>
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
      <ActivityEditorModal
        key={editorTarget === "new" ? "new" : (editorTarget?.id ?? "none")}
        target={editorTarget}
        owners={owners}
        onClose={() => setEditorTarget(null)}
      />
    </div>
  );
}

function ActivityEditorModal({
  target,
  owners,
  onClose,
}: {
  target: ActivityViewRow | "new" | null;
  owners: Option[];
  onClose: () => void;
}) {
  const isNew = target === "new";
  const activity = isNew || target === null ? null : target;
  const [state, action, pending] = useActionState<ActionState, FormData>(saveActivity, {});
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={target !== null} onClose={onClose} title={isNew ? "New activity" : `Edit — ${activity?.name}`} size="md">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {!isNew && <input type="hidden" name="activityId" value={activity?.id ?? ""} />}
            <label htmlFor="act-name">Name</label>
            <Input id="act-name" name="name" defaultValue={activity?.name} required placeholder="SOC 2 readiness" />
            <label htmlFor="act-desc">Description</label>
            <Textarea id="act-desc" name="description" defaultValue={activity?.description} rows={2} />
            <label htmlFor="act-status">Status</label>
            <Select id="act-status" name="status" defaultValue={activity?.status ?? "planned"}>
              {ACTIVITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ACTIVITY_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <label htmlFor="act-owner">Owner</label>
            <Select id="act-owner" name="ownerUserId" defaultValue="">
              <option value="">— none —</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div className="form-grid">
                <label htmlFor="act-start">Start</label>
                <Input id="act-start" name="startDate" type="date" defaultValue={activity?.startDate?.slice(0, 10) ?? ""} />
              </div>
              <div className="form-grid">
                <label htmlFor="act-due">Due</label>
                <Input id="act-due" name="dueDate" type="date" defaultValue={activity?.dueDate?.slice(0, 10) ?? ""} />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isNew ? "Create activity" : "Save"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
