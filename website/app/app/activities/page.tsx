import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/auth/session";
import { listActivities, listCompanies, companyNameMap } from "@/lib/crm/queries";
import ActivitiesClient from "./ActivitiesClient";
import NewActivityButton from "./NewActivityButton";

export const metadata: Metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const { workspaceId } = await requireWorkspace();
  const [activities, companies] = await Promise.all([
    listActivities(workspaceId),
    listCompanies(workspaceId),
  ]);
  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Activities</h1>
          <p className="ap__page-sub">Calls, emails, meetings and tasks.</p>
        </div>
        <div className="ap__page-actions">
          <NewActivityButton companyOptions={companyOptions} />
        </div>
      </div>

      <ActivitiesClient activities={activities} companyNames={companyNameMap(companies)} />
    </>
  );
}
