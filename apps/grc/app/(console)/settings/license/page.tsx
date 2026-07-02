import type { Metadata } from "next";
import { z } from "zod";
import { requirePermission } from "@/platform/rbac/guard";
import { P } from "@/platform/rbac/catalog";
import { getEntitlements } from "@/platform/modules/entitlements";
import { getSetting } from "@/platform/settings";
import { MODULES } from "@/modules/registry";
import { LicenseClient } from "./LicenseClient";

export const metadata: Metadata = { title: "License" };
export const dynamic = "force-dynamic";

const currentLicenseSchema = z.object({
  licenseId: z.string(),
  customer: z.string(),
  modules: z.array(z.object({ key: z.string(), seats: z.number().optional() })),
  issuedAt: z.string(),
  expiresAt: z.string(),
});

export default async function LicensePage() {
  const { user } = await requirePermission(P.settingsManage);
  const [entitlements, current] = await Promise.all([
    getEntitlements(user.workspaceId),
    getSetting(user.workspaceId, "license", "current", currentLicenseSchema),
  ]);
  return (
    <LicenseClient
      current={current}
      modules={MODULES.map((m) => {
        const e = entitlements.get(m.key);
        return {
          key: m.key,
          name: m.name,
          plannedPhase: m.plannedPhase,
          status: e ? e.status : "unlicensed",
          seats: e?.seats ?? null,
          expiresAt: e?.expiresAt?.toISOString() ?? null,
        };
      })}
    />
  );
}
