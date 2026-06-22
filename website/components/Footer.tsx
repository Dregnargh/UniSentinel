import Logo from "./Logo";

const COLS = [
  {
    title: "Platform",
    links: ["Overview", "Risk management", "Compliance", "Audit", "ERP modules", "Integrations"],
  },
  {
    title: "Solutions",
    links: ["SOC 2", "ISO 27001", "GDPR", "HIPAA", "PCI DSS", "Vendor risk"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers", "Security", "Contact"],
  },
  {
    title: "Resources",
    links: ["Docs", "Blog", "Trust center", "Status", "Changelog"],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo />
          <p className="footer__tag">
            The unified platform for risk, compliance and operations.
          </p>
          <div className="footer__badges">
            <span className="chip chip--dark">SOC 2 Type II</span>
            <span className="chip chip--dark">ISO 27001</span>
          </div>
        </div>
        <div className="footer__cols">
          {COLS.map((c) => (
            <div className="footer__col" key={c.title}>
              <h4>{c.title}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={l}><a href="#">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} UniSentinel. All rights reserved.</span>
        <span className="footer__legal">
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a>
        </span>
      </div>
    </footer>
  );
}
