import type { Metadata } from "next";
import { requirePermission } from "@/platform/rbac/guard";
import { P } from "@/platform/rbac/catalog";
import { getBranding } from "@/platform/branding";
import { BrandingClient } from "./BrandingClient";

export const metadata: Metadata = { title: "Branding" };
export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const { user } = await requirePermission(P.settingsManage);
  const branding = await getBranding(user.workspaceId);
  return <BrandingClient hasLogo={branding !== null} />;
}
