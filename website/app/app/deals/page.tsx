import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { listCompanies, listDeals, companyNameMap } from "@/lib/crm/queries";
import DealsClient from "./DealsClient";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage() {
  const { sub: ownerId } = await requireSession();
  const [deals, companies] = await Promise.all([
    listDeals(ownerId),
    listCompanies(ownerId),
  ]);

  return <DealsClient deals={deals} companyNames={companyNameMap(companies)} />;
}
