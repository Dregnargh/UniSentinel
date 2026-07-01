// Minimal inline icon set for the shell (16px stroke icons on the ui tokens).
const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
  </svg>
);

export const UsersIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
    <path d="M15.5 5.2a3.5 3.5 0 0 1 0 5.6M18 15.4c1.7.7 3 2.2 3.5 4.6" />
  </svg>
);

export const OrgIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <rect x="9" y="3" width="6" height="5" rx="1" />
    <rect x="3" y="16" width="6" height="5" rx="1" />
    <rect x="15" y="16" width="6" height="5" rx="1" />
    <path d="M12 8v4M6 16v-2.5h12V16" />
  </svg>
);

export const AuditIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
    <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M9.5 8h5M9.5 12h5M9.5 16h3" />
  </svg>
);

export const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...p}>
    <circle cx="5" cy="5" r="1.6" /><circle cx="12" cy="5" r="1.6" /><circle cx="19" cy="5" r="1.6" />
    <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
    <circle cx="5" cy="19" r="1.6" /><circle cx="12" cy="19" r="1.6" /><circle cx="19" cy="19" r="1.6" />
  </svg>
);
