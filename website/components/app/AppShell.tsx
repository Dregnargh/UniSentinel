"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { logout } from "@/lib/auth/actions";
import { Grid, People, Vendor, Pipeline, Pulse, Search, Bell } from "@/components/icons";
import { initials } from "@/lib/crm/format";

const NAV = [
  { href: "/app", label: "Dashboard", Icon: Grid },
  { href: "/app/contacts", label: "Contacts", Icon: People },
  { href: "/app/companies", label: "Companies", Icon: Vendor },
  { href: "/app/deals", label: "Deals", Icon: Pipeline },
  { href: "/app/activities", label: "Activities", Icon: Pulse },
];

export default function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <div className={`ap ${navOpen ? "ap--nav-open" : ""}`}>
      <aside className="ap__sidebar">
        <div className="ap__brand">
          <Link href="/app"><Logo /></Link>
        </div>
        <div className="ap__nav-label">Workspace</div>
        <nav className="ap__nav">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className="ap__link"
              onClick={() => setNavOpen(false)}
            >
              <Icon /> {label}
            </Link>
          ))}
        </nav>
        <div className="ap__sidebar-foot">
          <div className="ap__upsell">
            <strong>GRC modules</strong>
            Risk, compliance &amp; audit are included in your plan.
          </div>
        </div>
      </aside>

      <div className="ap__body">
        <header className="ap__topbar">
          <button
            className="ap__icon-btn ap__burger"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>≡</span>
          </button>
          <div className="ap__search">
            <Search size={17} />
            <input placeholder="Search contacts, companies, deals…" aria-label="Search" />
          </div>
          <div className="ap__topbar-spacer" />
          <button className="ap__icon-btn" aria-label="Notifications"><Bell size={18} /></button>
          <div className="ap__user">
            <div className="ap__user-meta">
              <b>{user.name}</b>
              <span style={{ textTransform: "capitalize" }}>{user.role}</span>
            </div>
            <div className="ap__avatar">{initials(user.name)}</div>
            <form action={logout}>
              <button className="ap__logout" type="submit">Log out</button>
            </form>
          </div>
        </header>
        <main className="ap__main">{children}</main>
      </div>
    </div>
  );
}
