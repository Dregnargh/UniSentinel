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
  widgets: [
    {
      key: "risk.bands",
      title: "Open risks by band",
      description: "Counts of open risks per severity band",
      span: 1,
      permission: "risk.risks.view",
    },
    {
      key: "risk.heatmap",
      title: "Risk heatmap",
      description: "Likelihood × impact distribution of open risks",
      span: 1,
      permission: "risk.risks.view",
    },
    {
      key: "risk.top",
      title: "Top risks",
      description: "Highest-scoring open risks",
      span: 2,
      permission: "risk.risks.view",
    },
  ],
  reports: [
    {
      key: "risk.register",
      title: "Risk register",
      description: "The full register with inherent and residual scoring, filterable by status and band.",
      permission: "risk.risks.view",
      params: [
        {
          name: "status",
          label: "Status",
          options: [
            { value: "all", label: "All statuses" },
            { value: "open", label: "Open (draft / assessed / in treatment)" },
            { value: "accepted", label: "Accepted" },
            { value: "closed", label: "Closed" },
          ],
        },
        {
          name: "band",
          label: "Inherent band",
          options: [
            { value: "all", label: "All bands" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ],
        },
      ],
    },
  ],
};
