"use client";

import React from "react";
import { useActionState } from "react";
import { Plus } from "@/components/icons";
import Modal from "@/components/app/Modal";
import { createWorkspaceUser, type ActionState } from "@/lib/users/actions";

export default function AddUserButton() {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createWorkspaceUser, {});

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add user
      </button>

      {open && (
        <Modal title="Add user" onClose={() => setOpen(false)}>
          <form action={action}>
            <div className="modal__body">
              {state.error && <div className="field__error">{state.error}</div>}
              <div className="field">
                <label htmlFor="u-name">Name</label>
                <input id="u-name" name="name" required placeholder="Jordan Lee" />
              </div>
              <div className="field">
                <label htmlFor="u-email">Email</label>
                <input id="u-email" name="email" type="email" required placeholder="jordan@company.com" />
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="u-role">Role</label>
                  <select id="u-role" name="role" defaultValue="member">
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="u-password">Temporary password</label>
                  <input id="u-password" name="password" type="text" required minLength={8} placeholder="min. 8 chars" />
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                Share this temporary password with the user securely; they can change it later.
              </p>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
                {pending ? "Adding…" : "Add user"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
