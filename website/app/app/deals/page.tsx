import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/auth/session";
import { listCompanies, listDeals, companyNameMap } from "@/lib/crm/queries";
import DealsClient from "./DealsClient";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage() {
  const { workspaceId } = await requireWorkspace();
  const [deals, companies] = await Promise.all([
    listDeals(workspaceId),
    listCompanies(workspaceId),
  ]);

  return <DealsClient deals={deals} companyNames={companyNameMap(companies)} />;
}
