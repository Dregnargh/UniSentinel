// Server-only accessors for the workspace methodology (settings framework).
import { getSetting, setSetting } from "@/platform/settings";
import { defaultMethodology, methodologySchema, type Methodology } from "./methodology";

const NS = "risk";
const KEY = "methodology";

export async function getMethodology(workspaceId: string): Promise<Methodology> {
  return (await getSetting(workspaceId, NS, KEY, methodologySchema)) ?? defaultMethodology();
}

export async function saveMethodology(workspaceId: string, m: Methodology): Promise<void> {
  await setSetting(workspaceId, NS, KEY, m);
}
