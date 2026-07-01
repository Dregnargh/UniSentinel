"use client";

import React from "react";
import { Phone, Mail, Calendar, Check, Policy } from "@/components/icons";
import type { Activity } from "@/lib/db/schema";

const actIcon = { call: Phone, email: Mail, meeting: Calendar, task: Check, note: Policy } as const;

type FilterKey = "all" | Activity["type"];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "call", label: "Calls" },
  { key: "email", label: "Emails" },
  { key: "meeting", label: "Meetings" },
  { key: "task", label: "Tasks" },
  { key: "note", label: "Notes" },
];

export default function ActivitiesClient({
  activities,
  companyNames,
}: {
  activities: Activity[];
  companyNames: Record<string, string>;
}) {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const companyName = (id: string) => companyNames[id] ?? "—";

  const filtered = React.useMemo(
    () => (filter === "all" ? activities : activities.filter((a) => a.type === filter)),
    [activities, filter],
  );

  return (
    <>
      <div className="toolbar">
        <div className="seg">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              data-active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="card">
        <div className="card__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
              No activities match this filter.
            </div>
          ) : (
            <div className="feed">
              {filtered.map((a) => {
                const Icon = actIcon[a.type as keyof typeof actIcon] ?? Policy;
                return (
                  <div className="feed__item" key={a.id}>
                    <span className="feed__icon"><Icon size={17} /></span>
                    <div className="feed__main">
                      <div className="feed__title">
                        <b>{a.title}</b>
                        {a.done && (
                          <span className="badge badge--success" style={{ marginLeft: 8 }}>Done</span>
                        )}
                      </div>
                      <div className="feed__meta">{a.contact} · {companyName(a.companyId)}</div>
                    </div>
                    <span className="feed__when">{a.when}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
