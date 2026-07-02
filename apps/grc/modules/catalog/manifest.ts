import type { ModuleManifest } from "../types";

export const catalogManifest: ModuleManifest = {
  key: "catalog",
  name: "Service Catalog",
  description:
    "Your company context: business lines, services, asset inventory, relationships and network/data-flow diagrams. The entity hub other modules build on.",
  icon: "catalog",
  plannedPhase: 4,
  navigation: [
    { path: "", label: "Overview" },
    { path: "/services", label: "Services" },
    { path: "/assets", label: "Assets" },
    { path: "/connections", label: "Connections" },
    { path: "/map", label: "Map" },
  ],
  permissions: {
    module: "catalog",
    label: "Service Catalog",
    resources: [
      {
        resource: "services",
        label: "Services & processes",
        description: "Business services and processes",
        actions: [
          { action: "view", label: "View services" },
          { action: "manage", label: "Create, edit and delete services" },
        ],
      },
      {
        resource: "assets",
        label: "Assets",
        description: "The asset inventory",
        actions: [
          { action: "view", label: "View assets" },
          { action: "manage", label: "Create, edit and delete assets" },
          { action: "import", label: "Import assets (CSV / connectors)" },
        ],
      },
    ],
  },
  entityTypes: ["catalog:service", "catalog:asset"],
  emits: ["catalog.asset.created", "catalog.asset.updated"],
};
