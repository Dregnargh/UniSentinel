import { Check, Pulse } from "./icons";

const POINTS = [
  "Evidence collected automatically, 24/7 — not the week before the audit.",
  "Every transaction inherits the controls that govern it.",
  "Real-time control effectiveness, mapped to every framework at once.",
  "One inventory of risks, assets, vendors and owners — no reconciliation.",
];

export default function Platform() {
  return (
    <section className="section platform" id="platform">
      <div className="container platform__inner">
        <div className="platform__copy reveal">
          <p className="eyebrow">The platform</p>
          <h2 className="section-title">Continuous assurance, not a point-in-time scramble</h2>
          <p className="section-lead">
            UniSentinel watches your controls and operations around the clock, so you walk into
            every audit, board meeting and renewal already prepared.
          </p>
          <ul className="platform__list">
            {POINTS.map((p) => (
              <li key={p}><span className="platform__check"><Check size={14} /></span>{p}</li>
            ))}
          </ul>
        </div>

        {/* Dogfooded product mock — UniSentinel's own design language */}
        <div className="platform__visual">
          <div className="mock reveal" data-speed="0.6">
            <div className="mock__bar">
              <span className="mock__dots"><i /><i /><i /></span>
              <span className="mock__bar-title">Compliance overview</span>
              <span className="mock__live"><Pulse size={13} /> Live</span>
            </div>
            <div className="mock__body">
              <div className="mock__top">
                <div className="mock__ring" style={{ ["--p" as string]: "92" }}>
                  <span className="mock__ring-val">92<small>%</small></span>
                  <span className="mock__ring-label">Posture</span>
                </div>
                <div className="mock__tiles">
                  <div className="mock__tile"><span>Open risks</span><strong>37</strong><em className="up">↓ 8</em></div>
                  <div className="mock__tile"><span>Controls</span><strong>248</strong><em className="up">98% ok</em></div>
                  <div className="mock__tile"><span>Overdue</span><strong>5</strong><em className="down">+2</em></div>
                </div>
              </div>
              <div className="mock__table">
                {[
                  ["AC-2 Account Management", "SOC 2", "ok", "Effective"],
                  ["A.9.4 Access Restriction", "ISO 27001", "warn", "Needs review"],
                  ["Art. 32 Encryption", "GDPR", "bad", "Failing"],
                  ["CC6.1 Logical Access", "SOC 2", "ok", "Effective"],
                ].map(([c, fw, tone, label]) => (
                  <div className="mock__tr" key={c}>
                    <span className="mock__c">{c}</span>
                    <span className="mock__fw">{fw}</span>
                    <span className={`mock__badge mock__badge--${tone}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mock-float mock-float--a reveal" data-speed="1.4">
            <span className="mock-float__dot" /> Control CC6.1 passed
          </div>
          <div className="mock-float mock-float--b reveal" data-speed="1.1">
            <strong data-count="14">14</strong>
            <span>frameworks tracked</span>
          </div>
        </div>
      </div>
    </section>
  );
}
