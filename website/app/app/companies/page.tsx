import type { Metadata } from "next";
import { Plus } from "@/components/icons";
import { requireSession } from "@/lib/auth/session";
import { listCompanies } from "@/lib/crm/queries";
import CompaniesClient from "./CompaniesClient";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const { sub: ownerId } = await requireSession();
  const companies = await listCompanies(ownerId);

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Companies</h1>
          <p className="ap__page-sub">Accounts you are tracking.</p>
        </div>
        <div className="ap__page-actions">
          <button className="btn btn-dark btn-sm"><Plus size={16} /> Add company</button>
        </div>
      </div>

      <CompaniesClient companies={companies} />
    </>
  );
}
