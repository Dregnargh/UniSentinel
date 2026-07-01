import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const { pathname } = req.nextUrl;

  // Gate the app + the change-password screen
  if ((pathname.startsWith("/app") || pathname === "/change-password") && !session) {
    const url = new URL("/login", req.url);
    if (pathname !== "/app") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  // Logged-in users skip the auth screens
  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*", "/login", "/register", "/change-password"],
};
