"use client";

import Link from "next/link";
import { Alert } from "@unisentinel/ui";

/**
 * The buy-a-module-later nudge: local fallback data exists and the module
 * that supersedes it is now licensed. Rendered on the risk overview and
 * register pages for users who can manage risks.
 */
export function PromoteBanner({ scope, treatments }: { scope: number; treatments: number }) {
  if (scope + treatments === 0) return null;
  const parts: string[] = [];
  if (scope > 0) parts.push(`${scope} local scope item${scope === 1 ? "" : "s"} can move into the Service Catalog`);
  if (treatments > 0)
    parts.push(`${treatments} local treatment action${treatments === 1 ? "" : "s"} can become Tasks`);
  return (
    <Alert tone="info" title="Local risk data can be promoted">
      {parts.join(" and ")}. <Link href="/m/risk/promote">Open the promotion wizard</Link> to link or migrate them —
      nothing is changed until you confirm.
    </Alert>
  );
}
