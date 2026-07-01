import type { Metadata } from "next";
import { TotpForm } from "./TotpForm";

export const metadata: Metadata = { title: "Two-factor authentication" };
export const dynamic = "force-dynamic";

export default function TotpPage() {
  return <TotpForm />;
}
