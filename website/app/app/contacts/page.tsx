import type { Metadata } from "next";
import { Plus } from "@/components/icons";
import { requireSession } from "@/lib/auth/session";
import { listCompanies, listContacts, companyNameMap } from "@/lib/crm/queries";
import ContactsClient from "./ContactsClient";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const { sub: ownerId } = await requireSession();
  const [contacts, companies] = await Promise.all([
    listContacts(ownerId),
    listCompanies(ownerId),
  ]);

  return (
    <>
      <div className="ap__page-head">
        <div>
          <h1 className="ap__page-title">Contacts</h1>
          <p className="ap__page-sub">Everyone across your accounts.</p>
        </div>
        <div className="ap__page-actions">
          <button className="btn btn-dark btn-sm"><Plus size={16} /> Add contact</button>
        </div>
      </div>

      <ContactsClient contacts={contacts} companyNames={companyNameMap(companies)} />
    </>
  );
}
