"use client";

import React from "react";
import { initials } from "@/lib/crm/format";
import { updateUserRole, setUserActive, deleteWorkspaceUser } from "@/lib/users/actions";
import type { WorkspaceUser } from "@/lib/users/queries";
import ResetPasswordButton from "./ResetPasswordButton";

export default function UsersClient({
  users,
  currentUserId,
}: {
  users: WorkspaceUser[];
  currentUserId: string;
}) {
  const [pending, start] = React.useTransition();

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res?.error) window.alert(res.error);
    });

  return (
    <section className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="cell-id">
                      <span className="avatar">{initials(u.name)}</span>
                      <div>
                        <div className="cell-strong">
                          {u.name}{isSelf && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> (you)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-muted">{u.email}</td>
                  <td>
                    <select
                      className="row-select"
                      value={u.role}
                      disabled={pending || isSelf}
                      onChange={(e) => run(() => updateUserRole(u.id, e.target.value))}
                      aria-label={`Role for ${u.name}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge badge--${u.active ? "success" : "neutral"}`}>
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <ResetPasswordButton userId={u.id} userName={u.name} />
                      <button
                        type="button"
                        className="row-btn"
                        disabled={pending || isSelf}
                        onClick={() => run(() => setUserActive(u.id, !u.active))}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="row-btn row-btn--danger"
                        disabled={pending || isSelf}
                        onClick={() => {
                          if (!window.confirm(`Delete ${u.name}? This removes their access.`)) return;
                          run(() => deleteWorkspaceUser(u.id));
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
