import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { listActivities, listCompanies, companyNameMap } from "@/lib/crm/queries";
import ActivitiesClient from "./ActivitiesClient";
import NewActivityButton from "./NewActivityButton";

export const metadata: Metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const { sub: ownerId } = await requireSession();
  const [activities, companies] = await Promise.all([
    listActivities(ownerId),
    listCompanies(ownerId),
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
