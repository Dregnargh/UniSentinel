// Seed data for the CRM demo (in-app, not persisted). Themed around UniSentinel
// selling its GRC + ERP platform to prospect companies.

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";
export type Stage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won";

export const STAGES: Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"];

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  riskTier: "Low" | "Medium" | "High";
  status: "Prospect" | "Active" | "Customer" | "Churned";
  owner: string;
  frameworks: string[];
  arr: number; // annual recurring revenue (won), 0 if prospect
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  companyId: string;
  status: "Lead" | "Engaged" | "Champion" | "Customer";
  lastTouch: string;
}

export interface Deal {
  id: string;
  name: string;
  companyId: string;
  value: number;
  stage: Stage;
  owner: string;
  probability: number;
  closeDate: string;
}

export interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  title: string;
  contact: string;
  companyId: string;
  when: string;
  done?: boolean;
}

export const companies: Company[] = [
  { id: "c1", name: "Northwind Bank", industry: "Financial Services", size: "5,000+", location: "New York, US", riskTier: "High", status: "Active", owner: "Maya Chen", frameworks: ["SOC 2", "ISO 27001", "PCI DSS"], arr: 148000 },
  { id: "c2", name: "Helios Health", industry: "Healthcare", size: "1,200", location: "Boston, US", riskTier: "High", status: "Customer", owner: "Sam Reyes", frameworks: ["HIPAA", "SOC 2"], arr: 96000 },
  { id: "c3", name: "Orbit Logistics", industry: "Transportation", size: "800", location: "Rotterdam, NL", riskTier: "Medium", status: "Prospect", owner: "Maya Chen", frameworks: ["ISO 27001", "GDPR"], arr: 0 },
  { id: "c4", name: "Vertex Manufacturing", industry: "Industrial", size: "3,400", location: "Stuttgart, DE", riskTier: "Medium", status: "Active", owner: "Liam Novak", frameworks: ["ISO 27001"], arr: 72000 },
  { id: "c5", name: "Lumen Media", industry: "Media", size: "450", location: "London, UK", riskTier: "Low", status: "Prospect", owner: "Sam Reyes", frameworks: ["GDPR", "SOC 2"], arr: 0 },
  { id: "c6", name: "Cobalt Energy", industry: "Energy", size: "2,100", location: "Calgary, CA", riskTier: "High", status: "Prospect", owner: "Liam Novak", frameworks: ["NIST CSF", "SOC 2"], arr: 0 },
  { id: "c7", name: "Pinecrest Retail", industry: "Retail", size: "9,000", location: "Austin, US", riskTier: "Medium", status: "Customer", owner: "Maya Chen", frameworks: ["PCI DSS", "SOC 2"], arr: 120000 },
  { id: "c8", name: "Aster Biotech", industry: "Biotech", size: "320", location: "Basel, CH", riskTier: "High", status: "Prospect", owner: "Sam Reyes", frameworks: ["ISO 27001", "GDPR", "HIPAA"], arr: 0 },
  { id: "c9", name: "Sterling Insurance", industry: "Insurance", size: "4,200", location: "Hartford, US", riskTier: "Medium", status: "Active", owner: "Liam Novak", frameworks: ["SOC 2", "NIST CSF"], arr: 84000 },
  { id: "c10", name: "Quanta Software", industry: "Technology", size: "600", location: "Berlin, DE", riskTier: "Low", status: "Prospect", owner: "Maya Chen", frameworks: ["SOC 2", "ISO 27001", "GDPR"], arr: 0 },
  { id: "c11", name: "Harbor Freight Co", industry: "Logistics", size: "1,800", location: "Singapore, SG", riskTier: "Medium", status: "Churned", owner: "Sam Reyes", frameworks: ["ISO 27001"], arr: 0 },
  { id: "c12", name: "Meridian Pay", industry: "Fintech", size: "240", location: "Dublin, IE", riskTier: "High", status: "Prospect", owner: "Liam Novak", frameworks: ["PCI DSS", "SOC 2", "GDPR"], arr: 0 },
];

export const contacts: Contact[] = [
  { id: "p1", name: "Elena Fischer", title: "CISO", email: "elena.fischer@northwind.com", phone: "+1 212 555 0148", companyId: "c1", status: "Champion", lastTouch: "2d ago" },
  { id: "p2", name: "Marcus Webb", title: "Head of Compliance", email: "m.webb@northwind.com", phone: "+1 212 555 0162", companyId: "c1", status: "Engaged", lastTouch: "5d ago" },
  { id: "p3", name: "Dr. Priya Nair", title: "VP, Information Security", email: "priya.nair@helioshealth.org", phone: "+1 617 555 0193", companyId: "c2", status: "Customer", lastTouch: "1w ago" },
  { id: "p4", name: "Tom Vandermeer", title: "IT Risk Manager", email: "t.vandermeer@orbitlog.nl", phone: "+31 10 555 0111", companyId: "c3", status: "Lead", lastTouch: "3d ago" },
  { id: "p5", name: "Sabine Krüger", title: "Compliance Director", email: "sabine.krueger@vertex-mfg.de", phone: "+49 711 555 0177", companyId: "c4", status: "Champion", lastTouch: "yesterday" },
  { id: "p6", name: "Olivia Grant", title: "DPO", email: "olivia.grant@lumenmedia.co.uk", phone: "+44 20 555 0124", companyId: "c5", status: "Engaged", lastTouch: "4d ago" },
  { id: "p7", name: "Derek Osei", title: "VP Security", email: "d.osei@cobaltenergy.ca", phone: "+1 403 555 0150", companyId: "c6", status: "Lead", lastTouch: "1d ago" },
  { id: "p8", name: "Hannah Lee", title: "Director, GRC", email: "hannah.lee@pinecrest.com", phone: "+1 512 555 0139", companyId: "c7", status: "Customer", lastTouch: "6d ago" },
  { id: "p9", name: "Dr. Felix Brunner", title: "Head of Quality & Risk", email: "felix.brunner@asterbio.ch", phone: "+41 61 555 0102", companyId: "c8", status: "Engaged", lastTouch: "2d ago" },
  { id: "p10", name: "Rachel Adler", title: "Chief Risk Officer", email: "r.adler@sterling-ins.com", phone: "+1 860 555 0188", companyId: "c9", status: "Champion", lastTouch: "1w ago" },
  { id: "p11", name: "Jonas Weber", title: "CTO", email: "jonas.weber@quanta.dev", phone: "+49 30 555 0166", companyId: "c10", status: "Lead", lastTouch: "today" },
  { id: "p12", name: "Aisha Rahman", title: "Compliance Lead", email: "aisha.rahman@meridianpay.ie", phone: "+353 1 555 0119", companyId: "c12", status: "Engaged", lastTouch: "3d ago" },
  { id: "p13", name: "Carlos Mendes", title: "Security Analyst", email: "c.mendes@northwind.com", phone: "+1 212 555 0170", companyId: "c1", status: "Engaged", lastTouch: "1d ago" },
  { id: "p14", name: "Nina Patel", title: "Procurement Manager", email: "nina.patel@pinecrest.com", phone: "+1 512 555 0145", companyId: "c7", status: "Customer", lastTouch: "2w ago" },
  { id: "p15", name: "Erik Solberg", title: "VP Operations", email: "erik.solberg@cobaltenergy.ca", phone: "+1 403 555 0158", companyId: "c6", status: "Lead", lastTouch: "5d ago" },
  { id: "p16", name: "Grace Kim", title: "Head of Audit", email: "grace.kim@sterling-ins.com", phone: "+1 860 555 0191", companyId: "c9", status: "Engaged", lastTouch: "4d ago" },
];

export const deals: Deal[] = [
  { id: "d1", name: "Northwind — Platform expansion", companyId: "c1", value: 64000, stage: "Negotiation", owner: "Maya Chen", probability: 80, closeDate: "Jul 15" },
  { id: "d2", name: "Orbit — ISO 27001 program", companyId: "c3", value: 38000, stage: "Proposal", owner: "Maya Chen", probability: 55, closeDate: "Aug 02" },
  { id: "d3", name: "Cobalt — NIST CSF rollout", companyId: "c6", value: 92000, stage: "Qualified", owner: "Liam Novak", probability: 35, closeDate: "Sep 10" },
  { id: "d4", name: "Lumen — GDPR + SOC 2", companyId: "c5", value: 27000, stage: "Lead", owner: "Sam Reyes", probability: 20, closeDate: "Sep 28" },
  { id: "d5", name: "Aster — Multi-framework", companyId: "c8", value: 71000, stage: "Proposal", owner: "Sam Reyes", probability: 60, closeDate: "Aug 19" },
  { id: "d6", name: "Quanta — Startup tier", companyId: "c10", value: 18000, stage: "Qualified", owner: "Maya Chen", probability: 40, closeDate: "Aug 30" },
  { id: "d7", name: "Meridian — PCI + GDPR", companyId: "c12", value: 44000, stage: "Lead", owner: "Liam Novak", probability: 25, closeDate: "Oct 05" },
  { id: "d8", name: "Vertex — ERP controls add-on", companyId: "c4", value: 31000, stage: "Negotiation", owner: "Liam Novak", probability: 75, closeDate: "Jul 22" },
  { id: "d9", name: "Sterling — Vendor risk module", companyId: "c9", value: 29000, stage: "Proposal", owner: "Liam Novak", probability: 50, closeDate: "Aug 12" },
  { id: "d10", name: "Helios — Renewal + seats", companyId: "c2", value: 52000, stage: "Closed Won", owner: "Sam Reyes", probability: 100, closeDate: "Jun 18" },
  { id: "d11", name: "Pinecrest — Audit automation", companyId: "c7", value: 47000, stage: "Closed Won", owner: "Maya Chen", probability: 100, closeDate: "Jun 09" },
  { id: "d12", name: "Northwind — Vendor monitoring", companyId: "c1", value: 22000, stage: "Qualified", owner: "Maya Chen", probability: 45, closeDate: "Sep 02" },
  { id: "d13", name: "Cobalt — Pilot", companyId: "c6", value: 12000, stage: "Lead", owner: "Liam Novak", probability: 15, closeDate: "Oct 14" },
  { id: "d14", name: "Aster — GxP evidence pack", companyId: "c8", value: 16000, stage: "Qualified", owner: "Sam Reyes", probability: 40, closeDate: "Sep 20" },
];

export const activities: Activity[] = [
  { id: "a1", type: "meeting", title: "Security review with Elena Fischer", contact: "Elena Fischer", companyId: "c1", when: "Today, 2:00 PM" },
  { id: "a2", type: "email", title: "Sent SOC 2 evidence pack", contact: "Sabine Krüger", companyId: "c4", when: "Today, 11:20 AM", done: true },
  { id: "a3", type: "call", title: "Discovery call — NIST CSF scope", contact: "Derek Osei", companyId: "c6", when: "Yesterday, 4:30 PM", done: true },
  { id: "a4", type: "task", title: "Prepare proposal for Aster Biotech", contact: "Dr. Felix Brunner", companyId: "c8", when: "Due tomorrow" },
  { id: "a5", type: "note", title: "Quanta prefers self-serve onboarding", contact: "Jonas Weber", companyId: "c10", when: "2d ago", done: true },
  { id: "a6", type: "email", title: "Follow-up: vendor risk module pricing", contact: "Rachel Adler", companyId: "c9", when: "2d ago", done: true },
  { id: "a7", type: "meeting", title: "QBR with Helios Health", contact: "Dr. Priya Nair", companyId: "c2", when: "3d ago", done: true },
  { id: "a8", type: "task", title: "Send renewal quote to Pinecrest", contact: "Hannah Lee", companyId: "c7", when: "Due Fri" },
  { id: "a9", type: "call", title: "Intro call — Meridian Pay", contact: "Aisha Rahman", companyId: "c12", when: "3d ago", done: true },
  { id: "a10", type: "note", title: "Orbit wants GDPR mapping before Q3", contact: "Tom Vandermeer", companyId: "c3", when: "4d ago", done: true },
];

// ---- helpers ----
export const companyById = (id: string) => companies.find((c) => c.id === id);
export const companyName = (id: string) => companyById(id)?.name ?? "—";
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
export const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

export const statusTone: Record<string, Tone> = {
  Prospect: "info", Active: "success", Customer: "brand", Churned: "danger",
  Lead: "neutral", Engaged: "info", Champion: "success",
};
export const riskTone: Record<string, Tone> = { Low: "success", Medium: "warning", High: "danger" };

// ---- derived dashboard metrics ----
export const openDeals = deals.filter((d) => d.stage !== "Closed Won");
export const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
export const wonValue = deals.filter((d) => d.stage === "Closed Won").reduce((s, d) => s + d.value, 0);
export const weightedPipeline = Math.round(
  openDeals.reduce((s, d) => s + (d.value * d.probability) / 100, 0),
);
