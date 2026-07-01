type Props = { className?: string; mark?: boolean };

/** UniSentinel shield mark + wordmark. Inherits text color from context;
 *  "Sentinel" is always brand teal. Pass mark={false} for the shield only. */
export default function Logo({ className, mark = true }: Props) {
  return (
    <span className={`logo ${className ?? ""}`} aria-label="UniSentinel">
      <svg className="logo__mark" width="30" height="32" viewBox="0 0 30 32" aria-hidden="true">
        <defs>
          <linearGradient id="lg-shield" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0e3a5c" />
            <stop offset="1" stopColor="#0a5570" />
          </linearGradient>
        </defs>
        <path
          d="M15 1 2 5.5v10.2C2 23.4 7.4 29.3 15 31c7.6-1.7 13-7.6 13-15.3V5.5L15 1Z"
          fill="url(#lg-shield)"
          stroke="#2f95b8"
          strokeWidth="1.1"
          strokeOpacity="0.55"
        />
        <path d="M9.5 9.5v7.2a5.5 5.5 0 0 0 5.5 5.5" fill="none" stroke="#cfe9f1" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20.5 22.5v-7.2a5.5 5.5 0 0 0-5.5-5.5" fill="none" stroke="#2f95b8" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {mark && (
        <span className="logo__word">
          Uni<span className="logo__word--accent">Sentinel</span>
        </span>
      )}
    </span>
  );
}
