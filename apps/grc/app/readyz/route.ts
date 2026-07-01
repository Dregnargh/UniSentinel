import { APP_VERSION } from "@/platform/version";
import { getReadiness } from "@/platform/readiness";

export const dynamic = "force-dynamic";

// Readiness: database reachable + migrations applied. Load balancers and
// `docker compose` health checks gate traffic on this.
export async function GET() {
  const readiness = await getReadiness();
  return Response.json(
    { version: APP_VERSION, ...readiness },
    { status: readiness.ready ? 200 : 503 },
  );
}
