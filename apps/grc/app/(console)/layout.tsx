import { redirect } from "next/navigation";
import { requireSession } from "@/platform/auth/session";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  if (user.mustChangePassword) redirect("/change-password");
  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role }}>{children}</AppShell>
  );
}
