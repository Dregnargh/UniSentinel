import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Edge-safe (jose only — no next/headers, bcrypt or db). Shared by proxy.ts
// and the Node-runtime session helpers. The cookie carries ONLY a signed
// pointer (user id + server-side session id); authorization state is always
// loaded fresh from the database per request.
export const SESSION_COOKIE = "usg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Short-lived cookie bridging password success -> TOTP challenge.
export const TOTP_PENDING_COOKIE = "usg_totp_pending";
export const TOTP_PENDING_MAX_AGE = 60 * 5;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode("dev-insecure-secret-change-me-please-0000");
}

export interface SessionToken extends JWTPayload {
  /** User id. */
  sub: string;
  /** Server-side session record id. */
  sid: string;
}

export async function signSessionToken(userId: string, sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    return payload as SessionToken;
  } catch {
    return null;
  }
}

export interface TotpPendingToken extends JWTPayload {
  sub: string;
  next?: string;
}

export async function signTotpPendingToken(userId: string, next?: string): Promise<string> {
  return new SignJWT({ next })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${TOTP_PENDING_MAX_AGE}s`)
    .sign(secret());
}

export async function verifyTotpPendingToken(token: string): Promise<TotpPendingToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string") return null;
    return payload as TotpPendingToken;
  } catch {
    return null;
  }
}
