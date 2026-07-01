import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { instanceHasUsers } from "@/platform/auth/actions";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set up UniSentinel" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await instanceHasUsers()) redirect("/login");
  return <SetupForm />;
}
