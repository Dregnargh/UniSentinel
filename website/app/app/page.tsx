import type { Metadata } from "next";
import Link from "next/link";
import { Dollar, Pipeline, People, Pulse, Plus, Phone, Mail, Calendar, Policy, Check } from "@/components/icons";
import {
  deals, activities, contacts, companies, companyName, initials, money,
  pipelineValue, weightedPipeline, wonValue, openDeals, STAGES, type Stage, type Activity,
} from "@/lib/crm/data";

export const metadata: Metadata = { title: "Dashboard" };

const stageTone: Record<Stage, string> = {
  Lead: "neutral", Qualified: "info", Proposal: "brand", Negotiation: "warning", "Closed Won": "success",
};
const actIcon = { call: Phone, email: Mail, meeting: Calendar, note: Policy, task: Check } as const;

export default function DashboardPage() {
  const activeAccounts = companies.filter((c) => c.status === "Active" || c.status === "Customer").length;
  const recent = [...openDeals].sort((a, b) => b.value - a.value).slice(0, 6);
  const byStage = STAGES.map((s) => {
    const ds = deals.filter((d) => d.stage === s);
    return { stage: s, count: ds.length, value: ds.reduce((t, d) => t + d.value, 0) };
  });
  const maxStage = Math.max(...byStage.map((s) => s.value), 1);

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Good afternoon, Ada</h1>
          <p className="ap__page-sub">Here&apos;s what&apos;s happening across your pipeline today.</p>
        </div>
        <div className="ap__page-actions">
          <button className="btn btn-outline btn-sm"><Calendar size={16} /> This quarter</button>
          <button className="btn btn-dark btn-sm"><Plus size={16} /> New deal</button>
        </div>
      </div>

      <div className="stats-row">
        <StatTile label="Open pipeline" value={money(pipelineValue)} delta="+12% vs last qtr" tone="up" Icon={Pipeline} />
        <StatTile label="Weighted forecast" value={money(weightedPipeline)} delta="+5.4%" tone="up" Icon={Dollar} />
        <StatTile label="Won (this qtr)" value={money(wonValue)} delta="2 deals closed" tone="flat" Icon={Check} />
        <StatTile label="Active accounts" value={String(activeAccounts)} delta={`${contacts.length} contacts`} tone="flat" Icon={People} />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card__head">
            <h3>Top open deals</h3>
            <Link href="/app/deals" className="card__link">View pipeline →</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Deal</th><th>Company</th><th>Stage</th><th style={{ textAlign: "right" }}>Value</th></tr>
              </thead>
              <tbody>
                {recent.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-strong">{d.name}</td>
                    <td className="cell-muted">{companyName(d.companyId)}</td>
                    <td><span className={`badge badge--${stageTone[d.stage]}`}>{d.stage}</span></td>
                    <td style={{ textAlign: "right" }} className="cell-strong">{money(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card__head">
            <h3>Recent activity</h3>
            <Link href="/app/activities" className="card__link">All activity →</Link>
          </div>
          <div className="card__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            <div className="feed">
              {activities.slice(0, 6).map((a: Activity) => {
                const Icon = actIcon[a.type];
                return (
                  <div className="feed__item" key={a.id}>
                    <span className="feed__icon"><Icon size={17} /></span>
                    <div className="feed__main">
                      <div className="feed__title"><b>{a.title}</b></div>
                      <div className="feed__meta">{a.contact} · {companyName(a.companyId)}</div>
                    </div>
                    <span className="feed__when">{a.when}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="card__head"><h3>Pipeline by stage</h3><Pulse size={18} /></div>
        <div className="card__body">
          <div style={{ display: "grid", gap: 16 }}>
            {byStage.map((s) => (
              <div key={s.stage} style={{ display: "grid", gridTemplateColumns: "150px 1fr 90px", alignItems: "center", gap: 14 }}>
                <span className={`badge badge--${stageTone[s.stage as Stage]}`} style={{ justifySelf: "start" }}>{s.stage}</span>
                <div style={{ height: 10, borderRadius: 999, background: "var(--n-100)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.value / maxStage) * 100}%`, background: "var(--grad-brand)", borderRadius: 999 }} />
                </div>
                <span style={{ textAlign: "right", fontWeight: 600, color: "var(--heading)", fontSize: 14 }}>
                  {money(s.value)} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {s.count}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function StatTile({ label, value, delta, tone, Icon }: { label: string; value: string; delta: string; tone: "up" | "down" | "flat"; Icon: React.ComponentType<{ size?: number }> }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__top">
        <span className="stat-tile__label">{label}</span>
        <span className="stat-tile__icon"><Icon size={18} /></span>
      </div>
      <div className="stat-tile__value">{value}</div>
      <div className={`stat-tile__delta ${tone}`}>{delta}</div>
    </div>
  );
}
