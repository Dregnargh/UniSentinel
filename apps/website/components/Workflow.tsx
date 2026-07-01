const STEPS = [
  { n: "01", title: "Connect", body: "Integrate your cloud, identity, finance and ticketing systems in minutes with native connectors." },
  { n: "02", title: "Map", body: "Map controls once to your frameworks. UniSentinel keeps the crosswalk current as standards change." },
  { n: "03", title: "Monitor", body: "Controls are tested continuously; risks, assets and vendors stay live across the whole program." },
  { n: "04", title: "Prove", body: "Export audit-ready evidence and board reports on demand — every claim backed by a trail." },
];

export default function Workflow() {
  return (
    <section className="section workflow" id="workflow">
      <div className="container">
        <div className="workflow__head reveal">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title">From scattered tools to continuous assurance</h2>
          <p className="section-lead">
            Go live in weeks, not quarters. UniSentinel meets your stack where it is and turns it
            into a single, always-current source of truth.
          </p>
        </div>
        <ol className="workflow__steps">
          {STEPS.map((s) => (
            <li className="step reveal" key={s.n}>
              <span className="step__n">{s.n}</span>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__body">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
