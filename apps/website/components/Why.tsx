import { Link2, Pulse, Shield, Lock } from "./icons";

const ITEMS = [
  { icon: Link2, title: "One system of record", body: "GRC and ERP share the same data model. A risk, a control, a vendor and a transaction are linked — not copied between tools." },
  { icon: Pulse, title: "Continuous & evidence-backed", body: "Always-on monitoring collects evidence automatically, so your posture is current the moment anyone asks." },
  { icon: Shield, title: "Audit-ready by design", body: "Every change, approval and control test writes to an immutable trail auditors can follow without a fire drill." },
  { icon: Lock, title: "Secure by default", body: "Least-privilege access, segregation of duties and encryption are enforced in the platform, not bolted on." },
];

export default function Why() {
  return (
    <section className="section why" id="why">
      <div className="container">
        <div className="why__head reveal">
          <p className="eyebrow eyebrow--light">Why UniSentinel</p>
          <h2 className="section-title">Built for teams that can&apos;t afford surprises</h2>
        </div>
        <div className="why__grid">
          {ITEMS.map((it) => (
            <article className="why-card reveal" key={it.title}>
              <span className="why-card__icon"><it.icon size={24} /></span>
              <h3 className="why-card__title">{it.title}</h3>
              <p className="why-card__body">{it.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
