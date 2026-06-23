"use client";

import React from "react";
import { Plus } from "@/components/icons";
import {
  deals, companyName, initials, money, STAGES, type Stage,
} from "@/lib/crm/data";

const stageTone: Record<Stage, string> = {
  Lead: "neutral", Qualified: "info", Proposal: "brand", Negotiation: "warning", "Closed Won": "success",
};

export default function DealsPage() {
  const [owner, setOwner] = React.useState<string>("All");

  const owners = React.useMemo(
    () => ["All", ...Array.from(new Set(deals.map((d) => d.owner)))],
    [],
  );

  const visible = React.useMemo(
    () => (owner === "All" ? deals : deals.filter((d) => d.owner === owner)),
    [owner],
  );

  const openPipeline = React.useMemo(
    () => deals
      .filter((d) => d.stage !== "Closed Won")
      .reduce((s, d) => s + d.value, 0),
    [],
  );

  const columns = React.useMemo(
    () => STAGES.map((stage) => {
      const list = visible.filter((d) => d.stage === stage);
      return { stage, list, total: list.reduce((s, d) => s + d.value, 0) };
    }),
    [visible],
  );

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Deals</h1>
          <p className="ap__page-sub">{money(openPipeline)} in open pipeline across {STAGES.length} stages.</p>
        </div>
        <div className="ap__page-actions">
          <div className="seg" role="group" aria-label="Filter by owner">
            {owners.map((o) => (
              <button
                key={o}
                type="button"
                data-active={owner === o}
                onClick={() => setOwner(o)}
              >
                {o}
              </button>
            ))}
          </div>
          <button className="btn btn-dark btn-sm"><Plus size={16} /> New deal</button>
        </div>
      </div>

      <div className="kanban">
        {columns.map(({ stage, list, total }) => (
          <div className="kcol" key={stage}>
            <div className="kcol__head">
              <span className="kcol__title">
                <span className={`badge badge--${stageTone[stage]}`} style={{ padding: "2px 8px" }}>
                  <span className="dot" />{stage}
                </span>
                <span className="kcol__count">{list.length}</span>
              </span>
              <span className="kcol__sum">{money(total)}</span>
            </div>
            <div className="kcol__list">
              {list.length === 0 ? (
                <div
                  className="deal"
                  style={{ cursor: "default", color: "var(--text-muted)", fontSize: 13, textAlign: "center", boxShadow: "none", borderStyle: "dashed" }}
                >
                  No deals here
                </div>
              ) : (
                list.map((d) => (
                  <div className="deal" key={d.id}>
                    <div className="deal__name">{d.name}</div>
                    <div className="deal__co">{companyName(d.companyId)}</div>
                    <div className="deal__foot">
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="avatar avatar--sm" title={d.owner}>{initials(d.owner)}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.closeDate}</span>
                      </span>
                      <span className="deal__val">{money(d.value)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
