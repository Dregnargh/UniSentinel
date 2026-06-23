import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionUser,
} from "./jwt";

export async function createSession(u: {
  id: string;
  email: string;
  name: string;
  role: string;
}): Promise<void> {
  const token = await signSession(u);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const c = (await cookies()).get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifySession(c.value);
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
