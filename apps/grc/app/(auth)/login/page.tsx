import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { instanceHasUsers } from "@/platform/auth/actions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  // First run: no accounts yet -> setup wizard.
  if (!(await instanceHasUsers())) redirect("/setup");
  const { next } = await props.searchParams;
  return <LoginForm next={next} />;
}
