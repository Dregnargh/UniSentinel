// Internal inline-SVG icon set. NOT exported from the package barrel — these
// are decorative internals used by components (Alert, Select, Checkbox, …).
// All strokes/fills use currentColor so they inherit component text color.
import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function make(path: React.ReactNode, opts: { fill?: boolean } = {}) {
  return function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={opts.fill ? 'currentColor' : 'none'}
        stroke={opts.fill ? 'none' : 'currentColor'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {path}
      </svg>
    );
  };
}

export const CheckIcon = make(<polyline points="20 6 9 17 4 12" />);
export const MinusIcon = make(<line x1="5" y1="12" x2="19" y2="12" />);
export const ChevronDownIcon = make(<polyline points="6 9 12 15 18 9" />);
export const ChevronRightIcon = make(<polyline points="9 18 15 12 9 6" />);
export const XIcon = make(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>,
);
export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <line x1="12" y1="8" x2="12" y2="8" />
  </>,
);
export const CheckCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8.5 12 11 14.5 15.5 9.5" />
  </>,
);
export const WarningIcon = make(
  <>
    <path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
    <line x1="12" y1="9" x2="12" y2="13.5" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </>,
);
export const DangerIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="12" y1="16.5" x2="12" y2="16.5" />
  </>,
);
export const ShieldIcon = make(
  <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6l-7-3Z" />,
);
