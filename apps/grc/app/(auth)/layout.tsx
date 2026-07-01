export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <span className="auth__brand-mark" aria-hidden>
            ◆
          </span>
          UniSentinel
        </div>
        {children}
        <p className="auth__foot">UniSentinel GRC platform</p>
      </div>
    </div>
  );
}
