"use client";

import React from "react";
import { useActionState } from "react";
import { Plus } from "@/components/icons";
import Modal from "@/components/app/Modal";
import { STAGES } from "@/lib/crm/format";
import { createDeal, type ActionState } from "@/lib/crm/actions";

export default function NewDealButton({
  companyOptions,
}: {
  companyOptions: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createDeal, {});

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> New deal
      </button>

      {open && (
        <Modal title="New deal" onClose={() => setOpen(false)}>
          <form action={action}>
            <div className="modal__body">
              {state.error && <div className="field__error">{state.error}</div>}
              <div className="field">
                <label htmlFor="d-name">Deal name</label>
                <input id="d-name" name="name" required placeholder="Acme — Platform expansion" />
              </div>
              <div className="field">
                <label htmlFor="d-company">Company</label>
                <select id="d-company" name="companyId" required defaultValue="">
                  <option value="" disabled>Select a company…</option>
                  {companyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="d-value">Value ($)</label>
                  <input id="d-value" name="value" type="number" min="0" defaultValue={0} />
                </div>
                <div className="field">
                  <label htmlFor="d-stage">Stage</label>
                  <select id="d-stage" name="stage" defaultValue="Lead">
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="d-owner">Owner</label>
                  <input id="d-owner" name="owner" required placeholder="Maya Chen" />
                </div>
                <div className="field">
                  <label htmlFor="d-prob">Probability (%)</label>
                  <input id="d-prob" name="probability" type="number" min="0" max="100" defaultValue={20} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="d-close">Close date</label>
                <input id="d-close" name="closeDate" required placeholder="Aug 02" />
              </div>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
                {pending ? "Saving…" : "Save deal"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
