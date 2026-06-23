import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function svg(path: React.ReactNode) {
  return function Icon({ size = 24, ...props }: P) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {path}
      </svg>
    );
  };
}

export const Shield = svg(<path d="M12 3 5 6v5c0 4.5 3 8.5 7 9.8 4-1.3 7-5.3 7-9.8V6l-7-3Z" />);
export const Scale = svg(
  <>
    <path d="M12 3v18" />
    <path d="M7 21h10" />
    <path d="M5 7h14" />
    <path d="m5 7-3 6a3 3 0 0 0 6 0L5 7Z" />
    <path d="m19 7-3 6a3 3 0 0 0 6 0l-3-6Z" />
  </>,
);
export const Risk = svg(
  <>
    <path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
);
export const Compliance = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>,
);
export const Audit = svg(
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 3v3h6V3" />
    <path d="m8.5 13 1.6 1.6 3.4-3.6" />
    <path d="M8.5 17.5h4" />
  </>,
);
export const Policy = svg(
  <>
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </>,
);
export const Vendor = svg(
  <>
    <path d="M3 21h18" />
    <path d="M5 21V8l7-5 7 5v13" />
    <path d="M9 21v-6h6v6" />
    <path d="M9 11h.01M15 11h.01" />
  </>,
);
export const Finance = svg(
  <>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <circle cx="12" cy="12.5" r="2.5" />
    <path d="M3 10h2M19 10h2" />
  </>,
);
export const Procurement = svg(
  <>
    <path d="M3 4h2l2.2 11.5a1 1 0 0 0 1 .8h8.5a1 1 0 0 0 1-.8L20 8H6" />
    <circle cx="9.5" cy="20" r="1.3" />
    <circle cx="17.5" cy="20" r="1.3" />
  </>,
);
export const People = svg(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.6" />
    <path d="M17.5 14.6A5.2 5.2 0 0 1 20.5 19" />
  </>,
);
export const Assets = svg(
  <>
    <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" />
    <path d="m12 2 9 5-9 5-9-5" />
    <path d="M12 12v10" />
  </>,
);
export const Pulse = svg(<path d="M2 12h4l2.5-7 5 16 2.5-9H22" />);
export const Lock = svg(
  <>
    <rect x="4.5" y="10" width="15" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>,
);
export const Globe = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.5 2.5 15 0 18-2.5-3-2.5-15.5 0-18Z" />
  </>,
);
export const Bolt = svg(<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />);
export const Link2 = svg(
  <>
    <path d="M9 12h6" />
    <path d="M10 8H8a4 4 0 0 0 0 8h2" />
    <path d="M14 8h2a4 4 0 0 1 0 8h-2" />
  </>,
);
export const ArrowRight = svg(
  <>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </>,
);
export const Check = svg(<path d="M20 6 9 17l-5-5" />);
export const Plug = svg(
  <>
    <path d="M12 22v-5" />
    <path d="M9 8V2M15 8V2" />
    <path d="M7 8h10v3a5 5 0 0 1-10 0V8Z" />
  </>,
);

// --- app/CRM icons ---
export const Grid = svg(
  <>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </>,
);
export const Search = svg(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
);
export const Bell = svg(
  <>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </>,
);
export const Settings = svg(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
  </>,
);
export const Plus = svg(<path d="M12 5v14M5 12h14" />);
export const Mail = svg(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>,
);
export const Phone = svg(
  <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
);
export const Filter = svg(<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />);
export const Calendar = svg(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
  </>,
);
export const Pipeline = svg(
  <>
    <rect x="3" y="4" width="5" height="16" rx="1" />
    <rect x="10" y="4" width="5" height="11" rx="1" />
    <rect x="17" y="4" width="4" height="7" rx="1" />
  </>,
);
export const Dollar = svg(
  <>
    <path d="M12 2v20" />
    <path d="M17 6.5A4 4 0 0 0 13 4h-1.5a3.5 3.5 0 0 0 0 7h3a3.5 3.5 0 0 1 0 7H10a4 4 0 0 1-4-2.5" />
  </>,
);
