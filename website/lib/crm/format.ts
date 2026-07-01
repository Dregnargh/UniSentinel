// Pure presentational helpers — safe to import from both Server and Client
// Components (no DB, no server-only APIs). Row data types live in @/lib/db/schema.

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";
export type Stage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won";

export const STAGES: Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"];

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

export const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`;

export const statusTone: Record<string, Tone> = {
  Prospect: "info", Active: "success", Customer: "brand", Churned: "danger",
  Lead: "neutral", Engaged: "info", Champion: "success",
};

export const riskTone: Record<string, Tone> = { Low: "success", Medium: "warning", High: "danger" };

export const stageTone: Record<string, Tone> = {
  Lead: "neutral", Qualified: "info", Proposal: "brand", Negotiation: "warning", "Closed Won": "success",
};
