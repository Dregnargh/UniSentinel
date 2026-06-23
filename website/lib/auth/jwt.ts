import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Edge-safe (jose only — no next/headers, bcrypt, or db). Shared by middleware
// and the Node-runtime session helpers.
export const SESSION_COOKIE = "us_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode("dev-insecure-secret-change-me-please-0000");
}

export interface SessionUser extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

export async function signSession(u: {
  id: string;
  email: string;
  name: string;
  role: string;
}): Promise<string> {
  return new SignJWT({ email: u.email, name: u.name, role: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as SessionUser;
  } catch {
    return null;
  }
}
