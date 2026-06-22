import {
  Risk, Compliance, Audit, Policy, Vendor, Scale,
  Finance, Procurement, Assets, People,
} from "./icons";

const GRC = [
  { icon: Risk, title: "Risk Management", body: "Quantify, prioritise and treat risk with a living register tied to your controls, assets and frameworks." },
  { icon: Compliance, title: "Compliance Automation", body: "Map once, comply many — continuous evidence across SOC 2, ISO 27001, GDPR and 30+ frameworks." },
  { icon: Audit, title: "Audit Management", body: "Run internal and external audits with sampling, workpapers and a defensible end-to-end trail." },
  { icon: Policy, title: "Policy & Controls", body: "Author, version and attest policies; monitor control effectiveness as it happens." },
  { icon: Vendor, title: "Vendor Risk", body: "Onboard, assess and continuously monitor third parties from one shared inventory." },
  { icon: Scale, title: "Governance", body: "Board-ready dashboards with clear ownership and accountability across the program." },
];

const ERP = [
  { icon: Finance, title: "Finance", body: "GL, AP/AR and the close — with controls and approvals baked into every transaction." },
  { icon: Procurement, title: "Procurement", body: "Requisitions to POs to receipts, with vendor risk and budget checks applied inline." },
  { icon: Assets, title: "Asset Management", body: "Track assets and their owners, data classification and control coverage." },
  { icon: People, title: "People & Access", body: "Joiner-mover-leaver flows with periodic access reviews and segregation of duties." },
];

function Card({ icon: Icon, title, body }: { icon: typeof Risk; title: string; body: string }) {
  return (
    <article className="mod-card reveal">
      <span className="mod-card__icon"><Icon size={22} /></span>
      <h3 className="mod-card__title">{title}</h3>
      <p className="mod-card__body">{body}</p>
    </article>
  );
}

export default function Modules() {
  return (
    <section className="section modules" id="modules">
      <div className="container">
        <div className="modules__head">
          <p className="eyebrow">One platform, every module</p>
          <h2 className="section-title">
            GRC and ERP, finally on the <span className="text-grad">same system of record</span>
          </h2>
          <p className="section-lead">
            Stop reconciling spreadsheets across teams. UniSentinel runs your risk and compliance
            program and your core operations on shared data, shared controls and one audit trail.
          </p>
        </div>

        <div className="modules__group">
          <div className="modules__label"><span className="dot dot--teal" /> Governance, Risk &amp; Compliance</div>
          <div className="modules__grid modules__grid--3">
            {GRC.map((m) => <Card key={m.title} {...m} />)}
          </div>
        </div>

        <div className="modules__group">
          <div className="modules__label"><span className="dot dot--navy" /> Enterprise Resource Planning</div>
          <div className="modules__grid modules__grid--4">
            {ERP.map((m) => <Card key={m.title} {...m} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
