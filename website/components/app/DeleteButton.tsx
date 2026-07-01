"use client";

import React from "react";

export default function DeleteButton({
  action,
  id,
  label = "Delete",
  confirm,
}: {
  action: (id: string) => Promise<void>;
  id: string;
  label?: string;
  confirm?: string;
}) {
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      className="row-btn row-btn--danger"
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          await action(id);
        });
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
