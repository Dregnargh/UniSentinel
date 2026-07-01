import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/platform/auth/jwt";

// Edge gate: first-line JWT check only. Real authorization (session
// revocation, active flag, role) is enforced per request in the Node layer
// (platform/auth/session.ts) — this just keeps anonymous traffic off the
// console and signed-in users off the auth screens.

const PUBLIC_PATHS = new Set(["/login", "/login/totp", "/setup"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (PUBLIC_PATHS.has(pathname)) {
    if (session && pathname !== "/setup") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except health probes, Next internals and static files.
  matcher: ["/((?!healthz|readyz|_next/|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)"],
};
