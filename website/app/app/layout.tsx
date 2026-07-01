import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/app/AppShell";
import "../console.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Force a password change for temp/reset accounts before they can use the app.
  const rows = await db
    .select({ mustChangePassword: users.mustChangePassword })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);
  if (rows[0]?.mustChangePassword) redirect("/change-password");

  return (
    <AppShell user={{ name: session.name, email: session.email, role: session.role }}>
      {children}
    </AppShell>
  );
}
