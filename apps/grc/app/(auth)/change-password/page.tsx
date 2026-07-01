import type { Metadata } from "next";
import { requireSession } from "@/platform/auth/session";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Change password" };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const { user } = await requireSession();
  return <ChangePasswordForm forced={user.mustChangePassword} />;
}
