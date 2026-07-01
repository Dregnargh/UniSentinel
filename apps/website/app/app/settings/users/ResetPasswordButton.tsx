"use client";

import React from "react";
import { useActionState } from "react";
import Modal from "@/components/app/Modal";
import { resetUserPassword, type ActionState } from "@/lib/users/actions";

export default function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(resetUserPassword, {});

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button type="button" className="row-btn" onClick={() => setOpen(true)}>
        Reset password
      </button>

      {open && (
        <Modal title={`Reset password — ${userName}`} onClose={() => setOpen(false)}>
          <form action={action}>
            <div className="modal__body">
              {state.error && <div className="field__error">{state.error}</div>}
              <input type="hidden" name="userId" value={userId} />
              <div className="field">
                <label htmlFor={`rp-${userId}`}>New temporary password</label>
                <input id={`rp-${userId}`} name="password" type="text" required minLength={8} placeholder="min. 8 chars" />
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                Share it securely with {userName}.
              </p>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
                {pending ? "Saving…" : "Set password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
