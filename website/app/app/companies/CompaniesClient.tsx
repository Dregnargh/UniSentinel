"use client";

import React from "react";
import { Search } from "@/components/icons";
import { initials, money, statusTone, riskTone } from "@/lib/crm/format";
import type { Company } from "@/lib/db/schema";

type StatusFilter = "All" | Company["status"];
const STATUS_FILTERS: StatusFilter[] = ["All", "Prospect", "Active", "Customer", "Churned"];

export default function CompaniesClient({ companies }: { companies: Company[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("All");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((co) => {
      if (status !== "All" && co.status !== status) return false;
      if (!q) return true;
      return (
        co.name.toLowerCase().includes(q) ||
        co.industry.toLowerCase().includes(q) ||
        co.location.toLowerCase().includes(q)
      );
    });
  }, [companies, query, status]);

  return (
    <>
      <div className="toolbar">
        <label className="toolbar__search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search by name, industry, or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search companies"
          />
        </label>
        <div className="seg" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              data-active={status === s}
              aria-selected={status === s}
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
                <th>Company</th>
                <th>Location</th>
                <th>Risk tier</th>
                <th>Frameworks</th>
                <th>Status</th>
                <th>Owner</th>
                <th style={{ textAlign: "right" }}>ARR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((co) => (
                <tr key={co.id}>
                  <td>
                    <div className="cell-id">
                      <span className="avatar">{initials(co.name)}</span>
                      <div>
                        <div className="cell-strong">{co.name}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>{co.industry}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-muted">{co.location}</td>
                  <td>
                    <span className={`badge badge--${riskTone[co.riskTier]}`}>
                      <span className="dot" />{co.riskTier}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {co.frameworks.slice(0, 3).map((f) => (
                        <span key={f} className="badge badge--neutral">{f}</span>
                      ))}
                      {co.frameworks.length > 3 && (
                        <span className="badge badge--neutral">+{co.frameworks.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge--${statusTone[co.status]}`}>{co.status}</span>
                  </td>
                  <td className="cell-muted">{co.owner}</td>
                  <td style={{ textAlign: "right" }} className="cell-strong">
                    {co.arr > 0 ? money(co.arr) : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)" }}>
                    No companies match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
