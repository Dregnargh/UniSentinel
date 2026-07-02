// Icon-key resolver for module manifests (manifests are pure data; icons are
// string keys mapped here).
const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </svg>
  ),
  catalog: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="m3 5.5 1.2 1.2L6.5 4.5M3 11.5l1.2 1.2 2.3-2.2M3 17.5l1.2 1.2 2.3-2.2" />
    </svg>
  ),
  risk: (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9.5v4.5" />
      <circle cx="12" cy="16.8" r="0.4" />
    </svg>
  ),
};

export function ModuleIcon({ name }: { name: string }) {
  return <>{icons[name] ?? icons.home}</>;
}
