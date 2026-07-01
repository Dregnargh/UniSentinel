const STATS = [
  { count: "40", suffix: "+", label: "Frameworks mapped out of the box" },
  { count: "70", suffix: "%", label: "Less time spent preparing for audits" },
  { count: "24", suffix: "/7", label: "Continuous control monitoring" },
  { count: "99.9", suffix: "%", label: "Platform uptime, SLA-backed" },
];

export default function Stats() {
  return (
    <section className="stats">
      <div className="container">
        <div className="stats__grid">
          {STATS.map((s) => (
            <div className="stat reveal" key={s.label}>
              <div className="stat__num">
                <span data-count={s.count} data-suffix={s.suffix}>
                  {s.count}
                  {s.suffix}
                </span>
              </div>
              <p className="stat__label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
