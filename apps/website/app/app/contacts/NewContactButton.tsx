"use client";

import React from "react";
import { useActionState } from "react";
import { Plus } from "@/components/icons";
import Modal from "@/components/app/Modal";
import { createContact, type ActionState } from "@/lib/crm/actions";

export default function NewContactButton({
  companyOptions,
}: {
  companyOptions: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createContact, {});

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add contact
      </button>

      {open && (
        <Modal title="Add contact" onClose={() => setOpen(false)}>
          <form action={action}>
            <div className="modal__body">
              {state.error && <div className="field__error">{state.error}</div>}
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="ct-name">Name</label>
                  <input id="ct-name" name="name" required placeholder="Elena Fischer" />
                </div>
                <div className="field">
                  <label htmlFor="ct-title">Title</label>
                  <input id="ct-title" name="title" required placeholder="CISO" />
                </div>
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="ct-email">Email</label>
                  <input id="ct-email" name="email" type="email" required placeholder="elena@acme.com" />
                </div>
                <div className="field">
                  <label htmlFor="ct-phone">Phone</label>
                  <input id="ct-phone" name="phone" required placeholder="+1 212 555 0148" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ct-company">Company</label>
                <select id="ct-company" name="companyId" required defaultValue="">
                  <option value="" disabled>Select a company…</option>
                  {companyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="ct-status">Status</label>
                  <select id="ct-status" name="status" defaultValue="Lead">
                    <option>Lead</option><option>Engaged</option><option>Champion</option><option>Customer</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ct-touch">Last touch</label>
                  <input id="ct-touch" name="lastTouch" defaultValue="today" />
                </div>
              </div>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
                {pending ? "Saving…" : "Save contact"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
