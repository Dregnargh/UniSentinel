"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { InboxItem } from "@/platform/notify/queries";
import { markAllNotificationsRead } from "@/platform/notify/actions";

const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9" />
    <path d="M10 20a2.2 2.2 0 0 0 4 0" />
  </svg>
);

export function NotificationsBell({ items, unread }: { items: InboxItem[]; unread: number }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unread > 0) {
      startTransition(async () => {
        await markAllNotificationsRead();
        router.refresh();
      });
    }
  };

  return (
    <div className="shell__bell-wrap" ref={wrapRef}>
      <button type="button" className="shell__bell" onClick={toggle} aria-label={`Notifications (${unread} unread)`}>
        <BellIcon />
        {unread > 0 && <span className="shell__bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="shell__menu shell__menu--wide" role="menu">
          <div className="shell__menu-id">
            <div className="shell__menu-name">Notifications</div>
          </div>
          {items.length === 0 ? (
            <p className="muted" style={{ padding: "var(--us-space-3)", margin: 0, fontSize: "var(--us-text-sm)" }}>
              Nothing yet.
            </p>
          ) : (
            <ul className="shell__inbox">
              {items.map((n) => (
                <li key={n.id} data-unread={!n.read || undefined}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => setOpen(false)}>
                      <span className="shell__inbox-title">{n.title}</span>
                      <span className="shell__inbox-body">{n.body}</span>
                    </Link>
                  ) : (
                    <div>
                      <span className="shell__inbox-title">{n.title}</span>
                      <span className="shell__inbox-body">{n.body}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
