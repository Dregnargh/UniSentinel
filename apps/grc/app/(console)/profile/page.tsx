import type { Metadata } from "next";
import { requireSession } from "@/platform/auth/session";
import { listOwnSessions } from "@/platform/profile/actions";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "My profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireSession();
  const sessions = await listOwnSessions();
  return (
    <ProfileClient
      user={{ name: user.name, email: user.email, role: user.role, totpEnabled: user.totpEnabled }}
      sessions={sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
      }))}
    />
  );
}
