"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Tooltip } from "@unisentinel/ui";
import { logout } from "@/platform/auth/actions";
import type { InboxItem } from "@/platform/notify/queries";
import { NotificationsBell } from "./NotificationsBell";
import { AuditIcon, GridIcon, HomeIcon, OrgIcon, RolesIcon, MailIcon, UsersIcon } from "./icons";

export interface ShellUser {
  name: string;
  email: string;
  roleNames: string[];
}

export interface ShellNavFlags {
  users: boolean;
  roles: boolean;
  org: boolean;
  audit: boolean;
  settings: boolean;
}

export function AppShell({
  user,
  nav,
  inbox,
  children,
}: {
  user: ShellUser;
  nav: ShellNavFlags;
  inbox: { items: InboxItem[]; unread: number };
  children: React.ReactNode;
}) {
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
  const showSettingsGroup = nav.users || nav.roles || nav.org || nav.audit || nav.settings;

  const settingsItems = [
    nav.users && { href: "/settings/users", label: "Users", icon: <UsersIcon /> },
    nav.roles && { href: "/settings/roles", label: "Roles", icon: <RolesIcon /> },
    nav.org && { href: "/settings/org-units", label: "Organization", icon: <OrgIcon /> },
    nav.audit && { href: "/settings/audit-log", label: "Audit log", icon: <AuditIcon /> },
    nav.settings && { href: "/settings/mail", label: "Mail", icon: <MailIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

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
        <div style={{ display: "flex", alignItems: "center", gap: "var(--us-space-3)" }}>
          <NotificationsBell items={inbox.items} unread={inbox.unread} />
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
            </button>
            {menuOpen && (
              <div className="shell__menu" role="menu">
                <div className="shell__menu-id">
                  <div className="shell__menu-name">{user.name}</div>
                  <div className="shell__menu-email">{user.email}</div>
                  {user.roleNames.length > 0 && (
                    <div className="shell__menu-email">{user.roleNames.join(" · ")}</div>
                  )}
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
        </div>
      </header>

      <div className="shell__body">
        <nav className="shell__sidebar">
          <Link href="/" className="shell__nav-item" data-active={isActive("/") || undefined}>
            <HomeIcon />
            Home
          </Link>
          {showSettingsGroup && (
            <>
              <div className="shell__nav-group">Settings</div>
              {settingsItems.map((item) => (
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
