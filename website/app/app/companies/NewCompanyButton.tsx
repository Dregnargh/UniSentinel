"use client";

import React from "react";
import { useActionState } from "react";
import { Plus } from "@/components/icons";
import Modal from "@/components/app/Modal";
import { createCompany, type ActionState } from "@/lib/crm/actions";

export default function NewCompanyButton() {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(createCompany, {});

  React.useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <>
      <button className="btn btn-dark btn-sm" onClick={() => setOpen(true)}>
        <Plus size={16} /> Add company
      </button>

      {open && (
        <Modal title="Add company" onClose={() => setOpen(false)}>
          <form action={action}>
            <div className="modal__body">
              {state.error && <div className="field__error">{state.error}</div>}
              <div className="field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" name="name" required placeholder="Acme Corp" />
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="c-industry">Industry</label>
                  <input id="c-industry" name="industry" required placeholder="Financial Services" />
                </div>
                <div className="field">
                  <label htmlFor="c-size">Size</label>
                  <input id="c-size" name="size" required placeholder="1,200" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="c-location">Location</label>
                <input id="c-location" name="location" required placeholder="Boston, US" />
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="c-risk">Risk tier</label>
                  <select id="c-risk" name="riskTier" defaultValue="Medium">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="c-status">Status</label>
                  <select id="c-status" name="status" defaultValue="Prospect">
                    <option>Prospect</option><option>Active</option><option>Customer</option><option>Churned</option>
                  </select>
                </div>
              </div>
              <div className="modal__grid2">
                <div className="field">
                  <label htmlFor="c-owner">Owner</label>
                  <input id="c-owner" name="owner" required placeholder="Maya Chen" />
                </div>
                <div className="field">
                  <label htmlFor="c-arr">ARR ($)</label>
                  <input id="c-arr" name="arr" type="number" min="0" defaultValue={0} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="c-frameworks">Frameworks (comma-separated)</label>
                <input id="c-frameworks" name="frameworks" placeholder="SOC 2, ISO 27001" />
              </div>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
                {pending ? "Saving…" : "Save company"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
