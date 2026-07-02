// Pure display helpers — shared by server and client, no db imports.

export const ASSET_TYPES = ["hardware", "software", "data", "people", "facility", "cloud"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const CRITICALITIES = ["low", "medium", "high", "critical"] as const;
export const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"] as const;
export const ENTITY_STATUSES = ["active", "planned", "retired"] as const;
export const RELATIONSHIP_KINDS = [
  "hosts",
  "connects_to",
  "stores",
  "processes",
  "depends_on",
  "supports",
] as const;

export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

export const criticalityTone: Record<string, Tone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export const classificationTone: Record<string, Tone> = {
  public: "neutral",
  internal: "info",
  confidential: "warning",
  restricted: "danger",
};

export const statusTone: Record<string, Tone> = {
  active: "success",
  planned: "info",
  retired: "neutral",
};

export const ASSET_TYPE_LABEL: Record<string, string> = {
  hardware: "Hardware",
  software: "Software",
  data: "Data",
  people: "People",
  facility: "Facility",
  cloud: "Cloud",
};

export const RELATIONSHIP_LABEL: Record<string, string> = {
  hosts: "hosts",
  connects_to: "connects to",
  stores: "stores",
  processes: "processes",
  depends_on: "depends on",
  supports: "supports",
};
