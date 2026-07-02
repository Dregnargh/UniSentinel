"use client";

import * as React from "react";
import Link from "next/link";
import { GridIcon } from "./icons";
import { ModuleIcon } from "./moduleIcons";

export interface DrawerModule {
  key: string;
  name: string;
  description: string;
  icon: string;
  licensed: boolean;
  expired: boolean;
}

export function AppDrawer({ modules }: { modules: DrawerModule[] }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="shell__drawer-wrap" ref={wrapRef}>
      <button
        className="shell__drawer-btn"
        aria-label="Modules"
        aria-expanded={open}
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <GridIcon />
      </button>
      {open && (
        <div className="shell__drawer" role="menu">
          <div className="shell__drawer-title">UniSentinel modules</div>
          <div className="shell__drawer-grid">
            <Link href="/" className="shell__drawer-tile" onClick={() => setOpen(false)}>
              <span className="shell__drawer-tile-icon">
                <ModuleIcon name="home" />
              </span>
              Home
            </Link>
            {modules.map((m) =>
              m.licensed ? (
                <Link key={m.key} href={`/m/${m.key}`} className="shell__drawer-tile" onClick={() => setOpen(false)}>
                  <span className="shell__drawer-tile-icon">
                    <ModuleIcon name={m.icon} />
                  </span>
                  {m.name}
                </Link>
              ) : (
                <div
                  key={m.key}
                  className="shell__drawer-tile shell__drawer-tile--locked"
                  title={m.expired ? "License expired — contact sales to renew" : "Not licensed — contact sales"}
                >
                  <span className="shell__drawer-tile-icon">
                    <ModuleIcon name={m.icon} />
                  </span>
                  {m.name}
                  <span className="shell__drawer-lock">{m.expired ? "expired" : "locked"}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
