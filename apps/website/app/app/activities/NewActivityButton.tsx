"use client";

import React from "react";
import { useActionState } from "react";
import { Plus } from "@/components/icons";
import Modal from "@/components/app/Modal";
import { createActivity, type ActionState } from "@/lib/crm/actions";

export default function NewActivityButton({
  companyOptions,
}: {
  companyOptions: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createActivity, {});

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> Log activity
      </button>

      {open && (
        <Modal title="Log activity" onClose={() => setOpen(false)}>
          <form action={action}>
            <div className="modal__body">
              {state.error && <div className="field__error">{state.error}</div>}
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="a-type">Type</label>
                  <select id="a-type" name="type" defaultValue="call">
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="a-when">When</label>
                  <input id="a-when" name="when" required placeholder="Today, 2:00 PM" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="a-title">Title</label>
                <input id="a-title" name="title" required placeholder="Security review with Elena Fischer" />
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="a-contact">Contact</label>
                  <input id="a-contact" name="contact" required placeholder="Elena Fischer" />
                </div>
                <div className="field">
                  <label htmlFor="a-company">Company</label>
                  <select id="a-company" name="companyId" required defaultValue="">
                    <option value="" disabled>Select…</option>
                    {companyOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
                {pending ? "Saving…" : "Log activity"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
