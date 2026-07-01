import Link from "next/link";
import Logo from "@/components/Logo";
import "../console.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__brand">
        <Link href="/" className="auth__back">← Back to site</Link>
        <span className="auth__brand-glow" aria-hidden />
        <span className="auth__brand-grid" aria-hidden />
        <Logo />
        <div className="auth__brand-body">
          <h2>Continuous assurance for risk, compliance &amp; operations.</h2>
          <p>
            Sign in to run controls, audits, vendors and your pipeline on one continuously-assured
            system of record.
          </p>
          <div className="auth__brand-stats">
            <div><span>40+</span><small>Frameworks</small></div>
            <div><span>24/7</span><small>Monitoring</small></div>
            <div><span>SOC 2</span><small>Type II</small></div>
          </div>
        </div>
      </aside>
      <main className="auth__panel">{children}</main>
    </div>
  );
}
