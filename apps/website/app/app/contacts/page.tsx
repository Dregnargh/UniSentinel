import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/auth/session";
import { listCompanies, listContacts, companyNameMap } from "@/lib/crm/queries";
import ContactsClient from "./ContactsClient";
import NewContactButton from "./NewContactButton";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const { workspaceId } = await requireWorkspace();
  const [contacts, companies] = await Promise.all([
    listContacts(workspaceId),
    listCompanies(workspaceId),
  ]);
  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Contacts</h1>
          <p className="ap__page-sub">Everyone across your accounts.</p>
        </div>
        <div className="ap__page-actions">
          <NewContactButton companyOptions={companyOptions} />
        </div>
      </div>

      <ContactsClient contacts={contacts} companyNames={companyNameMap(companies)} />
    </>
  );
}
