import { getSession } from "@/platform/auth/session";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { permitted } from "@/platform/rbac/catalog";
import { getEntitlements } from "@/platform/modules/entitlements";
import { findReport } from "@/modules/registry";
import { extractParams, generateReportPdf } from "@/platform/reports/service";

export const dynamic = "force-dynamic";

// Streams a generated report as a PDF download. Auth is cookie-based (same
// session as the console); license + permission are enforced per request.
export async function GET(request: Request, ctx: { params: Promise<{ reportKey: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { reportKey } = await ctx.params;
  const def = findReport(reportKey);
  if (!def) return new Response("Unknown report", { status: 404 });

  const [permissions, entitlements] = await Promise.all([
    getPermissionSet(session.user.id),
    getEntitlements(session.user.workspaceId),
  ]);
  if (entitlements.get(def.moduleKey)?.status !== "active" || !permitted(permissions, def.permission)) {
    return new Response("Forbidden", { status: 403 });
  }

  const params = extractParams(def, new URL(request.url).searchParams);
  const pdf = await generateReportPdf({
    def,
    params,
    workspaceId: session.user.workspaceId,
    actor: { id: session.user.id, name: session.user.name, email: session.user.email },
  });
  if (!pdf) return new Response("Report has no data provider", { status: 500 });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${def.key.replace(".", "-")}-${date}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
