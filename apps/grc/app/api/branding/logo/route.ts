import { getInstanceBranding } from "@/platform/branding";
import { getStorage } from "@/platform/storage";

export const dynamic = "force-dynamic";

// Serves the instance logo (also on the pre-auth login screen). Raster
// formats only (enforced at upload), cached briefly.
export async function GET() {
  const branding = await getInstanceBranding();
  if (!branding) return new Response(null, { status: 404 });
  const file = await getStorage().get(branding.logoKey);
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
