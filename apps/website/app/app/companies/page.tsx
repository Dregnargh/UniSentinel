import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/auth/session";
import { listCompanies } from "@/lib/crm/queries";
import CompaniesClient from "./CompaniesClient";
import NewCompanyButton from "./NewCompanyButton";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const { workspaceId } = await requireWorkspace();
  const companies = await listCompanies(workspaceId);

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Companies</h1>
          <p className="ap__page-sub">Accounts you are tracking.</p>
        </div>
        <div className="ap__page-actions">
          <NewCompanyButton />
        </div>
      </div>

      <CompaniesClient companies={companies} />
    </>
  );
}
