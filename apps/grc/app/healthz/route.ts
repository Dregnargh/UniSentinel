import { APP_VERSION } from "@/platform/version";

export const dynamic = "force-dynamic";

// Liveness: answers 200 whenever the Node process is up — deliberately no
// database dependency, so orchestrators don't kill a web pod because the DB
// is briefly unavailable.
export async function GET() {
  return Response.json({
    status: "ok",
    version: APP_VERSION,
    uptime_s: Math.round(process.uptime()),
  });
}
