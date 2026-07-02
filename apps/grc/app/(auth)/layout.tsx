import { getInstanceBranding } from "@/platform/branding";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const branding = await getInstanceBranding();
  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          {branding ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src="/api/branding/logo" alt="Company logo" className="auth__brand-logo" />
          ) : (
            <span className="auth__brand-mark" aria-hidden>
              ◆
            </span>
          )}
          UniSentinel
        </div>
        {children}
        <p className="auth__foot">UniSentinel GRC platform</p>
      </div>
    </div>
  );
}
