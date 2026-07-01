"use client";

import React from "react";
import { Search } from "@/components/icons";
import { initials, statusTone } from "@/lib/crm/format";
import type { Contact } from "@/lib/db/schema";

const STATUS_FILTERS = ["All", "Lead", "Engaged", "Champion", "Customer"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function ContactsClient({
  contacts,
  companyNames,
}: {
  contacts: Contact[];
  companyNames: Record<string, string>;
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("All");
  const companyName = (id: string) => companyNames[id] ?? "—";

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (!q) return true;
      const haystack = [c.name, c.title, c.email, companyName(c.companyId)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, companyNames, query, status]);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__search">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            aria-label="Search contacts"
          />
        </div>
        <div className="seg" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              data-active={status === s}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last touch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="cell-muted" style={{ textAlign: "center", padding: "32px 16px" }}>
                    No contacts match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-id">
                        <span className="avatar">{initials(c.name)}</span>
                        <div>
                          <div className="cell-strong">{c.name}</div>
                          <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{c.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cell-muted">{companyName(c.companyId)}</td>
                    <td className="cell-muted">{c.email}</td>
                    <td>
                      <span className={`badge badge--${statusTone[c.status]}`}>
                        <span className="dot" />
                        {c.status}
                      </span>
                    </td>
                    <td className="cell-muted">{c.lastTouch}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
