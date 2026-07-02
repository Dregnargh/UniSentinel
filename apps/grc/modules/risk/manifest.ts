import type { ModuleManifest } from "../types";

export const riskManifest: ModuleManifest = {
  key: "risk",
  name: "Risk Management",
  description:
    "Risk register with configurable methodologies, likelihood × impact heatmaps, treatment plans and acceptance workflows. Enriched by Service Catalog scope and Tasks & Activities execution.",
  icon: "risk",
  plannedPhase: 6,
  navigation: [
    { path: "", label: "Overview" },
    { path: "/register", label: "Register" },
    { path: "/heatmap", label: "Heatmap" },
    { path: "/methodology", label: "Methodology" },
  ],
  permissions: {
    module: "risk",
    label: "Risk Management",
    resources: [
      {
        resource: "risks",
        label: "Risks",
        description: "The risk register",
        actions: [
          { action: "view", label: "View risks" },
          { action: "manage", label: "Create, edit and assess risks" },
          { action: "approve", label: "Approve risk acceptance" },
          { action: "delete", label: "Delete risks" },
        ],
      },
      {
        resource: "methodology",
        label: "Methodology",
        description: "Scales, criteria and appetite settings",
        actions: [{ action: "manage", label: "Configure the risk methodology" }],
      },
    ],
  },
  entityTypes: ["risk:risk", "risk:treatment"],
  emits: ["risk.created", "risk.accepted", "risk.treatment.updated"],
};
