"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Badge, Tooltip } from "@unisentinel/ui";
import { logout } from "@/platform/auth/actions";
import { AuditIcon, GridIcon, HomeIcon, OrgIcon, UsersIcon } from "./icons";

export interface ShellUser {
  name: string;
  email: string;
  role: string;
}

const NAV = [
  { href: "/", label: "Home", icon: <HomeIcon />, adminOnly: false },
];

const SETTINGS_NAV = [
  { href: "/settings/users", label: "Users", icon: <UsersIcon /> },
  { href: "/settings/org-units", label: "Organization", icon: <OrgIcon /> },
  { href: "/settings/audit-log", label: "Audit log", icon: <AuditIcon /> },
];

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="shell">
      <header className="shell__topbar">
        <div className="shell__topbar-left">
          {/* App drawer — becomes the M365-style module switcher with Phase 3 licensing. */}
          <Tooltip content="Modules arrive with the module framework (Phase 3)">
            <button className="shell__drawer-btn" aria-label="Modules" type="button">
              <GridIcon />
            </button>
          </Tooltip>
          <Link href="/" className="shell__brand">
            <span className="shell__brand-mark" aria-hidden>
              ◆
            </span>
            UniSentinel
          </Link>
        </div>
        {/* Profile capsule */}
        <div className="shell__capsule-wrap" ref={menuRef}>
          <button
            type="button"
            className="shell__capsule"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Avatar name={user.name} size="sm" />
            <span className="shell__capsule-name">{user.name}</span>
            {user.role === "admin" && <Badge tone="brand">admin</Badge>}
          </button>
          {menuOpen && (
            <div className="shell__menu" role="menu">
              <div className="shell__menu-id">
                <div className="shell__menu-name">{user.name}</div>
                <div className="shell__menu-email">{user.email}</div>
              </div>
              <Link href="/profile" className="shell__menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                My profile &amp; security
              </Link>
              <Link
                href="/change-password"
                className="shell__menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Change password
              </Link>
              <form action={logout}>
                <button type="submit" className="shell__menu-item shell__menu-item--danger" role="menuitem">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <div className="shell__body">
        <nav className="shell__sidebar">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="shell__nav-item" data-active={isActive(item.href) || undefined}>
              {item.icon}
              {item.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <>
              <div className="shell__nav-group">Settings</div>
              {SETTINGS_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shell__nav-item"
                  data-active={isActive(item.href) || undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <main className="shell__content">{children}</main>
      </div>
    </div>
  );
}
